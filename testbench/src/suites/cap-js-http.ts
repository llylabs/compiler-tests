/**
 * cap-js-http Suite — End-to-end JS HTTP-server through CAP
 *
 * Hard E2E: compile a JS source via the machineroom nex-frontend-js plugin,
 * pack it as a .brick tar, POST it to a real cap-runtime instance running
 * locally as a subprocess (not QEMU — see note below), and while the agent
 * is still executing the bundle, hit the TCP port the JS server binds
 * inside the worker. The probe HTTP request actually traverses:
 *
 *   testbench → cap-runtime agent (/run) → worker subprocess →
 *   nex_runtime::BrickExecutor → wasm guest →
 *   runtime.http_server_create_compat host fn → TcpListener::bind("0.0.0.0:PORT") →
 *   ... testbench's parallel curl ↩
 *
 * That is the same chain a CAP-VM-internal `listen()` traverses; the only
 * difference vs. QEMU is the absence of the slirp hostfwd hop. The full
 * QEMU path would additionally need an app-port hostfwd in cap/qemu/run.sh
 * (currently only 19091→19090 is forwarded for the agent itself).
 *
 * Why we let /run block + probe in parallel:
 *   /run is synchronous. A `listen()` server never exits on its own, so the
 *   agent will SIGTERM/SIGKILL the worker after worker_timeout seconds and
 *   return status:"timeout", exit_code:124. We POST in the background, give
 *   the server a moment to bind, then hit it from the host. Eventually the
 *   pending /run resolves with the timeout response — which is correct
 *   behavior we explicitly assert.
 *
 * Config:
 *   cap_runtime          Path to cap-runtime binary
 *   js_frontend          Path to nex-frontend-js plugin binary
 *   agent_port           Host port for cap-runtime --listen (default 19099)
 *   worker_timeout_s     Per-job timeout, must exceed all probe deadlines (default 60)
 *   boot_timeout_ms      Wait budget for /health (default 10_000)
 *   bind_timeout_ms      Wait budget for the JS server's port to accept (default 12_000)
 *   cases                Per-fixture test definitions (see TestCase)
 */

import { spawn, ChildProcess } from "node:child_process";
import { join, resolve, basename } from "node:path";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  openSync,
  closeSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import * as http from "node:http";
import * as net from "node:net";
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js";
import { spawnCapture } from "../utils.js";

// ── Config ────────────────────────────────────────────────────────────────

interface TestProbe {
  /** URL path, e.g. "/", "/json". */
  path: string;
  /** HTTP method, default GET. */
  method?: string;
  /** Expected status code, default 200. */
  expect_status?: number;
  /** Substring that must appear in the response body. */
  expect_body_contains?: string;
  /** Optional: exact response body (after trimming trailing newlines). */
  expect_body_exact?: string;
  /** Optional header equality check (case-insensitive key). */
  expect_header?: { key: string; value: string };
}

interface TestCase {
  /** Stable identifier used in console output and failure names. */
  name: string;
  /** Path to JS source file (relative to bench/testbench). */
  source: string;
  /** Port the JS server binds inside the worker. Must match the source. */
  guest_port: number;
  /** Probes to fire against guest_port. */
  probes: TestProbe[];
}

interface CapJsHttpConfig {
  cap_runtime?: string;
  js_frontend?: string;
  agent_port?: number;
  worker_timeout_s?: number;
  boot_timeout_ms?: number;
  bind_timeout_ms?: number;
  cases?: TestCase[];
}

// ── HTTP helpers ──────────────────────────────────────────────────────────

interface HttpResult {
  status: number;
  headers: Record<string, string>;
  body: string;
}

function httpRequest(opts: {
  method: string;
  host: string;
  port: number;
  path: string;
  headers?: Record<string, string>;
  body?: Buffer;
  timeoutMs?: number;
}): Promise<HttpResult> {
  return new Promise((resolveFn, rejectFn) => {
    const timeoutMs = opts.timeoutMs ?? 60_000;
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    if (opts.body) headers["Content-Length"] = String(opts.body.length);
    const req = http.request(
      {
        method: opts.method,
        hostname: opts.host,
        port: opts.port,
        path: opts.path,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (Array.isArray(v)) flat[k.toLowerCase()] = v.join(", ");
            else if (v !== undefined) flat[k.toLowerCase()] = String(v);
          }
          resolveFn({
            status: res.statusCode ?? 0,
            headers: flat,
            body: Buffer.concat(chunks).toString("utf-8"),
          });
        });
      },
    );
    const timer = setTimeout(() => {
      req.destroy(new Error(`http ${opts.method} ${opts.path} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    req.on("error", (e) => { clearTimeout(timer); rejectFn(e); });
    req.on("close", () => clearTimeout(timer));
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Resolves once the given TCP port accepts a connection, or rejects on timeout. */
function waitForPort(host: string, port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolveFn, rejectFn) => {
    const tryOnce = () => {
      if (Date.now() > deadline) {
        rejectFn(new Error(`port ${host}:${port} did not accept within ${timeoutMs}ms`));
        return;
      }
      const sock = new net.Socket();
      sock.setTimeout(1000);
      sock.once("connect", () => { sock.destroy(); resolveFn(); });
      sock.once("error", () => { sock.destroy(); setTimeout(tryOnce, 250); });
      sock.once("timeout", () => { sock.destroy(); setTimeout(tryOnce, 250); });
      sock.connect(port, host);
    };
    tryOnce();
  });
}

// ── cap-runtime lifecycle ─────────────────────────────────────────────────

interface CapHandle {
  proc: ChildProcess;
  logPath: string;
  port: number;
  token: string;
  workDir: string;
}

async function bootCapRuntime(
  capRuntimeBin: string,
  port: number,
  workerTimeoutSec: number,
  bootTimeoutMs: number,
): Promise<CapHandle> {
  const workDir = mkdtempSync(join(tmpdir(), "cap-js-http-"));
  for (const sub of ["root", "tmp", "jobs"]) {
    mkdirSync(join(workDir, sub), { recursive: true });
  }
  const token = randomBytes(24).toString("base64").replace(/[/+=]/g, "").slice(0, 32);
  const logPath = join(workDir, "agent.log");
  const logFd = openSync(logPath, "w");

  const args = [
    "--listen", `127.0.0.1:${port}`,
    "--agent-token", token,
    "--worker-timeout", String(workerTimeoutSec),
    "--no-heartbeat",
    "--skip-boot-bundle",
    "--host-root", join(workDir, "root"),
    "--host-tmp", join(workDir, "tmp"),
    "--jobs-dir", join(workDir, "jobs"),
  ];
  const proc = spawn(capRuntimeBin, args, {
    stdio: ["ignore", logFd, logFd],
    detached: false,
  });
  closeSync(logFd);

  const handle: CapHandle = { proc, logPath, port, token, workDir };

  const deadline = Date.now() + bootTimeoutMs;
  let lastErr = "no health response";
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) {
      throw new Error(`cap-runtime exited during boot (code=${proc.exitCode}); log: ${logPath}`);
    }
    try {
      const r = await httpRequest({
        method: "GET", host: "127.0.0.1", port, path: "/health", timeoutMs: 2_000,
      });
      if (r.status === 200) return handle;
      lastErr = `health status ${r.status}`;
    } catch (e: any) {
      lastErr = e?.message ?? String(e);
    }
    await sleep(250);
  }
  await shutdownCap(handle);
  throw new Error(`cap-runtime /health not reachable on 127.0.0.1:${port} within ${bootTimeoutMs}ms — last: ${lastErr}; log: ${logPath}`);
}

async function shutdownCap(h: CapHandle): Promise<void> {
  if (h.proc.exitCode === null) {
    h.proc.kill("SIGTERM");
    for (let i = 0; i < 20; i++) {
      if (h.proc.exitCode !== null) break;
      await sleep(100);
    }
    if (h.proc.exitCode === null) h.proc.kill("SIGKILL");
  }
  try { rmSync(h.workDir, { recursive: true, force: true }); } catch {}
}

// ── Brick tar packer (matches what /run expects: contents at top level) ───

function packBrick(brickDir: string): Promise<Buffer> {
  return new Promise((resolveFn, rejectFn) => {
    const tar = spawn("tar", ["-cf", "-", "."], { cwd: brickDir });
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    tar.stdout.on("data", (c: Buffer) => chunks.push(c));
    tar.stderr.on("data", (c: Buffer) => errChunks.push(c));
    tar.on("error", rejectFn);
    tar.on("close", (code) => {
      if (code !== 0) {
        rejectFn(new Error(`tar exited ${code}: ${Buffer.concat(errChunks).toString()}`));
      } else {
        resolveFn(Buffer.concat(chunks));
      }
    });
  });
}

// ── Per-case runner ───────────────────────────────────────────────────────

interface CaseOutcome { name: string; ok: boolean; detail?: string }

interface RunResponseBody {
  job_id?: string;
  status?: string;
  exit_code?: number;
  stdout?: string;
  stderr?: string;
  duration_ms?: number;
}

async function runJsCase(
  cap: CapHandle,
  jsFrontendBin: string,
  benchDir: string,
  tc: TestCase,
  bindTimeoutMs: number,
  runTimeoutMs: number,
): Promise<CaseOutcome[]> {
  const outcomes: CaseOutcome[] = [];
  const sourceAbs = resolve(benchDir, tc.source);
  if (!existsSync(sourceAbs)) {
    outcomes.push({ name: `${tc.name}: source exists`, ok: false, detail: `not found: ${sourceAbs}` });
    return outcomes;
  }
  outcomes.push({ name: `${tc.name}: source exists`, ok: true });

  const tmp = mkdtempSync(join(tmpdir(), `cap-js-http-${tc.name}-`));
  const brickDir = join(tmp, `${tc.name}.brick`);

  try {
    // 1. Compile via the JS frontend (JSON stdin protocol).
    const compileInput = JSON.stringify({ source: sourceAbs, output: brickDir });
    const compile = await new Promise<{ code: number | null; stdout: string; stderr: string }>(
      (res) => {
        const proc = spawn(jsFrontendBin, ["compile"], {
          env: { ...process.env, LLY_INTERNAL: "1" },
          stdio: ["pipe", "pipe", "pipe"],
        });
        let stdout = ""; let stderr = "";
        proc.stdout.on("data", (c) => stdout += c.toString());
        proc.stderr.on("data", (c) => stderr += c.toString());
        proc.on("close", (code) => res({ code, stdout, stderr }));
        proc.on("error", (e) => res({ code: 127, stdout, stderr: String(e) }));
        proc.stdin.end(compileInput);
      },
    );
    if (compile.code !== 0) {
      outcomes.push({ name: `${tc.name}: compile`, ok: false,
        detail: `frontend exit=${compile.code}; ${(compile.stderr || compile.stdout).slice(-300)}` });
      return outcomes;
    }
    // Sanity: brick artifacts present.
    if (!existsSync(join(brickDir, "manifest.json")) || !existsSync(join(brickDir, "brick_0.wasm"))) {
      outcomes.push({ name: `${tc.name}: compile produced brick`, ok: false,
        detail: `manifest.json/brick_0.wasm missing under ${brickDir}` });
      return outcomes;
    }
    outcomes.push({ name: `${tc.name}: compile`, ok: true });

    // 2. Pack tar (top-level contents — matches /run convention).
    const tarBytes = await packBrick(brickDir);

    // 3. Fire POST /run in background. We let it block; the server inside
    //    the worker will never exit on its own. /run resolves once
    //    worker_timeout kicks in.
    let runResolution: { error?: string; res?: HttpResult } = {};
    const runPromise = httpRequest({
      method: "POST",
      host: "127.0.0.1",
      port: cap.port,
      path: "/run",
      headers: { Authorization: `Bearer ${cap.token}`, "Content-Type": "application/x-tar" },
      body: tarBytes,
      timeoutMs: runTimeoutMs,
    })
      .then((r) => { runResolution.res = r; })
      .catch((e) => { runResolution.error = e?.message ?? String(e); });

    // 4. Wait for the JS server's port to come up inside the worker.
    try {
      await waitForPort("127.0.0.1", tc.guest_port, bindTimeoutMs);
      outcomes.push({ name: `${tc.name}: bind ${tc.guest_port}`, ok: true });
    } catch (e: any) {
      outcomes.push({ name: `${tc.name}: bind ${tc.guest_port}`, ok: false,
        detail: e?.message ?? String(e) });
      // Wait for /run to finish before bailing — otherwise we leave the
      // slot reserved which will confuse the next case.
      await runPromise;
      return outcomes;
    }

    // 5. Run all probes against the live in-worker HTTP server.
    for (const probe of tc.probes) {
      const probeName = `${tc.name}: ${probe.method ?? "GET"} ${probe.path}`;
      let r: HttpResult;
      try {
        r = await httpRequest({
          method: probe.method ?? "GET",
          host: "127.0.0.1",
          port: tc.guest_port,
          path: probe.path,
          timeoutMs: 5_000,
        });
      } catch (e: any) {
        outcomes.push({ name: probeName, ok: false, detail: `request failed: ${e?.message ?? e}` });
        continue;
      }
      const expectStatus = probe.expect_status ?? 200;
      const checks: string[] = [];
      let ok = true;
      if (r.status !== expectStatus) {
        ok = false;
        checks.push(`status=${r.status} (want ${expectStatus})`);
      }
      if (probe.expect_body_contains && !r.body.includes(probe.expect_body_contains)) {
        ok = false;
        checks.push(`body missing "${probe.expect_body_contains}"`);
      }
      if (probe.expect_body_exact !== undefined) {
        const got = r.body.replace(/\n+$/, "");
        const want = probe.expect_body_exact.replace(/\n+$/, "");
        if (got !== want) {
          ok = false;
          checks.push(`body=${JSON.stringify(got)} (want ${JSON.stringify(want)})`);
        }
      }
      if (probe.expect_header) {
        const got = r.headers[probe.expect_header.key.toLowerCase()];
        if (!got || !got.toLowerCase().includes(probe.expect_header.value.toLowerCase())) {
          ok = false;
          checks.push(`header ${probe.expect_header.key}=${got ?? "<missing>"} (want ${probe.expect_header.value})`);
        }
      }
      outcomes.push({
        name: probeName, ok,
        detail: ok ? `${r.status} ${r.body.length}B` : checks.join("; ") + ` | body=${r.body.slice(0, 120)}`,
      });
    }

    // 6. Wait for /run to come back so the slot frees up. We expect a
    //    worker-timeout response — the server never exits voluntarily.
    await runPromise;
    if (runResolution.error) {
      // The request was abandoned (testbench-side timeout, not agent-side).
      // Mark as expected as long as we observed bind + probes. Treat as
      // soft-fail to keep visibility.
      outcomes.push({
        name: `${tc.name}: /run wait`, ok: false,
        detail: `client-side: ${runResolution.error}`,
      });
    } else if (runResolution.res) {
      let body: RunResponseBody = {};
      try { body = JSON.parse(runResolution.res.body); } catch {}
      const expectedExit = 124;
      const ok = runResolution.res.status === 200 &&
                 (body.status === "timeout" || body.exit_code === expectedExit);
      outcomes.push({
        name: `${tc.name}: /run timeout response`,
        ok,
        detail: `http=${runResolution.res.status} status=${body.status} exit=${body.exit_code}`,
      });
    }
  } finally {
    try { rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
  return outcomes;
}

// ── Detached-flow runner (/run-detached + /jobs/<id>) ─────────────────────

interface DetachedSnapshot {
  job_id?: string;
  state?: string;
  exposed_addresses?: string[];
  exposed_ports?: number[];
  exit_code?: number | null;
  duration_ms?: number | null;
  stdout_tail?: string;
  stderr_tail?: string;
}

interface RunDetachedBody {
  job_id?: string;
  state?: string;
  exposed_port_file_hint?: string;
}

async function runDetachedCase(
  cap: CapHandle,
  jsFrontendBin: string,
  benchDir: string,
  tc: TestCase,
  bindTimeoutMs: number,
): Promise<CaseOutcome[]> {
  const outcomes: CaseOutcome[] = [];
  const sourceAbs = resolve(benchDir, tc.source);
  if (!existsSync(sourceAbs)) {
    outcomes.push({ name: `${tc.name}: source exists`, ok: false, detail: `not found: ${sourceAbs}` });
    return outcomes;
  }
  outcomes.push({ name: `${tc.name}: source exists`, ok: true });

  const tmp = mkdtempSync(join(tmpdir(), `cap-js-http-${tc.name}-`));
  const brickDir = join(tmp, `${tc.name}.brick`);

  try {
    // 1. Compile via JS frontend.
    const compileInput = JSON.stringify({ source: sourceAbs, output: brickDir });
    const compile = await new Promise<{ code: number | null; stdout: string; stderr: string }>(
      (res) => {
        const proc = spawn(jsFrontendBin, ["compile"], {
          env: { ...process.env, LLY_INTERNAL: "1" },
          stdio: ["pipe", "pipe", "pipe"],
        });
        let stdout = ""; let stderr = "";
        proc.stdout.on("data", (c) => stdout += c.toString());
        proc.stderr.on("data", (c) => stderr += c.toString());
        proc.on("close", (code) => res({ code, stdout, stderr }));
        proc.on("error", (e) => res({ code: 127, stdout, stderr: String(e) }));
        proc.stdin.end(compileInput);
      },
    );
    if (compile.code !== 0) {
      outcomes.push({ name: `${tc.name}: compile`, ok: false,
        detail: `frontend exit=${compile.code}; ${(compile.stderr || compile.stdout).slice(-300)}` });
      return outcomes;
    }
    outcomes.push({ name: `${tc.name}: compile`, ok: true });

    // 2. Pack tar.
    const tarBytes = await packBrick(brickDir);

    // 3. POST /run-detached → expect 200 + job_id quickly.
    let postRes: HttpResult;
    try {
      postRes = await httpRequest({
        method: "POST",
        host: "127.0.0.1",
        port: cap.port,
        path: "/run-detached",
        headers: { Authorization: `Bearer ${cap.token}`, "Content-Type": "application/x-tar" },
        body: tarBytes,
        timeoutMs: 15_000,
      });
    } catch (e: any) {
      outcomes.push({ name: `${tc.name}: POST /run-detached`, ok: false, detail: e?.message ?? String(e) });
      return outcomes;
    }
    if (postRes.status !== 200) {
      outcomes.push({ name: `${tc.name}: POST /run-detached`, ok: false,
        detail: `status=${postRes.status} body=${postRes.body.slice(0, 200)}` });
      return outcomes;
    }
    let postBody: RunDetachedBody = {};
    try { postBody = JSON.parse(postRes.body); } catch {}
    const jobId = postBody.job_id;
    if (!jobId) {
      outcomes.push({ name: `${tc.name}: POST /run-detached`, ok: false,
        detail: `missing job_id in body: ${postRes.body.slice(0, 200)}` });
      return outcomes;
    }
    outcomes.push({ name: `${tc.name}: POST /run-detached`, ok: true,
      detail: `job_id=${jobId} state=${postBody.state}` });

    // 4. Poll /jobs/<id> until the worker exposes its port.
    const bindDeadline = Date.now() + bindTimeoutMs;
    let firstSnap: DetachedSnapshot | undefined;
    while (Date.now() < bindDeadline) {
      try {
        const r = await httpRequest({
          method: "GET", host: "127.0.0.1", port: cap.port,
          path: `/jobs/${jobId}`,
          headers: { Authorization: `Bearer ${cap.token}` },
          timeoutMs: 3_000,
        });
        if (r.status === 200) {
          let snap: DetachedSnapshot = {};
          try { snap = JSON.parse(r.body); } catch {}
          if (Array.isArray(snap.exposed_ports) && snap.exposed_ports.length > 0) {
            firstSnap = snap;
            break;
          }
        }
      } catch {}
      await sleep(200);
    }
    if (!firstSnap) {
      outcomes.push({ name: `${tc.name}: /jobs port discovery`, ok: false,
        detail: `no exposed_ports observed within ${bindTimeoutMs}ms` });
      // Still try to clean up.
      await httpRequest({
        method: "DELETE", host: "127.0.0.1", port: cap.port,
        path: `/jobs/${jobId}`,
        headers: { Authorization: `Bearer ${cap.token}` },
        timeoutMs: 3_000,
      }).catch(() => {});
      return outcomes;
    }
    outcomes.push({ name: `${tc.name}: /jobs port discovery`, ok: true,
      detail: `ports=[${firstSnap.exposed_ports!.join(",")}] addr=${(firstSnap.exposed_addresses ?? []).join(",")}` });

    // 5. Confirm advertised address is reachable.
    const port = firstSnap.exposed_ports![0]!;
    const addr = (firstSnap.exposed_addresses ?? [])[0];
    const addrMatchesExpected = addr === `127.0.0.1:${tc.guest_port}` && port === tc.guest_port;
    outcomes.push({
      name: `${tc.name}: advertised address`,
      ok: addrMatchesExpected,
      detail: `got ${addr} want 127.0.0.1:${tc.guest_port}`,
    });

    // 6. Probe the exposed server.
    try {
      const r = await httpRequest({
        method: "GET", host: "127.0.0.1", port, path: "/",
        timeoutMs: 5_000,
      });
      const probe = tc.probes[0]!;
      const expectStatus = probe.expect_status ?? 200;
      const bodyOk = !probe.expect_body_contains || r.body.includes(probe.expect_body_contains);
      const ok = r.status === expectStatus && bodyOk;
      outcomes.push({
        name: `${tc.name}: GET / on exposed port`,
        ok,
        detail: `status=${r.status} body=${r.body.slice(0, 80)}`,
      });
    } catch (e: any) {
      outcomes.push({ name: `${tc.name}: GET / on exposed port`, ok: false, detail: e?.message ?? String(e) });
    }

    // 7. DELETE /jobs/<id> → expect 202.
    let killStatus: number | undefined;
    try {
      const r = await httpRequest({
        method: "DELETE", host: "127.0.0.1", port: cap.port,
        path: `/jobs/${jobId}`,
        headers: { Authorization: `Bearer ${cap.token}` },
        timeoutMs: 5_000,
      });
      killStatus = r.status;
      outcomes.push({
        name: `${tc.name}: DELETE /jobs`,
        ok: r.status === 202,
        detail: `status=${r.status} body=${r.body.slice(0, 80)}`,
      });
    } catch (e: any) {
      outcomes.push({ name: `${tc.name}: DELETE /jobs`, ok: false, detail: e?.message ?? String(e) });
    }

    // 8. Poll until state=terminated (supervisor reaped the child).
    const reapDeadline = Date.now() + 10_000;
    let finalSnap: DetachedSnapshot | undefined;
    while (Date.now() < reapDeadline) {
      try {
        const r = await httpRequest({
          method: "GET", host: "127.0.0.1", port: cap.port,
          path: `/jobs/${jobId}`,
          headers: { Authorization: `Bearer ${cap.token}` },
          timeoutMs: 3_000,
        });
        if (r.status === 200) {
          let snap: DetachedSnapshot = {};
          try { snap = JSON.parse(r.body); } catch {}
          if (snap.state && snap.state !== "starting" && snap.state !== "running") {
            finalSnap = snap;
            break;
          }
        }
      } catch {}
      await sleep(150);
    }
    if (!finalSnap) {
      outcomes.push({ name: `${tc.name}: terminal state`, ok: false,
        detail: `did not observe terminal state after kill (status=${killStatus})` });
    } else {
      outcomes.push({
        name: `${tc.name}: terminal state`,
        ok: finalSnap.state === "terminated",
        detail: `state=${finalSnap.state} exit=${finalSnap.exit_code} dur=${finalSnap.duration_ms}ms`,
      });
    }
  } finally {
    try { rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
  return outcomes;
}

// ── Default cases ─────────────────────────────────────────────────────────

const DEFAULT_CASES: TestCase[] = [
  {
    name: "hello_plain",
    source: "tests/cap-js-http/hello_plain.js",
    guest_port: 18211,
    probes: [
      { path: "/",       expect_body_contains: "hello" },
      { path: "/again",  expect_body_contains: "hello" },
    ],
  },
  {
    name: "echo_method",
    source: "tests/cap-js-http/echo_method.js",
    guest_port: 18212,
    probes: [
      { path: "/foo",                expect_body_exact: "GET /foo" },
      { path: "/bar",  method: "POST", expect_body_exact: "POST /bar" },
      { path: "/x",                  expect_header: { key: "Content-Type", value: "text/plain" } },
    ],
  },
  {
    name: "multi_route",
    source: "tests/cap-js-http/multi_route.js",
    guest_port: 18213,
    probes: [
      { path: "/",        expect_body_contains: "root-ok" },
      { path: "/json",    expect_body_contains: '"ok":true',
                          expect_header: { key: "Content-Type", value: "application/json" } },
      { path: "/created", expect_status: 201, expect_body_contains: "created" },
      { path: "/missing", expect_status: 404, expect_body_contains: "not-found" },
    ],
  },
];

// ── Runner ────────────────────────────────────────────────────────────────

export const runner: Runner = {
  async run(rawConfig: Record<string, unknown>, ctx: RunContext): Promise<SuiteResult> {
    const cfg = rawConfig as unknown as CapJsHttpConfig;
    const id = "cap-js-http";
    const label = "CAP JS HTTP-server E2E";
    const start = Date.now();

    const benchDir = resolve(ctx.testsDir, "..");
    const capRuntime = cfg.cap_runtime
      ? resolve(benchDir, cfg.cap_runtime)
      : "/home/leon/prod/cap/src/runtime/target/release/cap-runtime";
    const jsFrontend = cfg.js_frontend
      ? resolve(benchDir, cfg.js_frontend)
      : "/home/leon/prod/machineroom/target/release/nex-frontend-js";

    if (!existsSync(capRuntime)) {
      return { id, label, passed: 0, failed: 0, skipped: 0,
        duration_ms: Date.now() - start, failures: [],
        error: `cap-runtime not found: ${capRuntime}` };
    }
    if (!existsSync(jsFrontend)) {
      return { id, label, passed: 0, failed: 0, skipped: 0,
        duration_ms: Date.now() - start, failures: [],
        error: `nex-frontend-js not found: ${jsFrontend}` };
    }

    const agentPort = cfg.agent_port ?? 19099;
    const workerTimeoutS = cfg.worker_timeout_s ?? 60;
    const bootTimeoutMs = cfg.boot_timeout_ms ?? 10_000;
    const bindTimeoutMs = cfg.bind_timeout_ms ?? 12_000;
    const cases = (cfg.cases && cfg.cases.length > 0) ? cfg.cases : DEFAULT_CASES;

    // The HTTP-client side waits at most a hair longer than the agent
    // timeout so we always see the timeout response itself.
    const runTimeoutMs = (workerTimeoutS + 15) * 1000;

    console.log(`  booting cap-runtime on 127.0.0.1:${agentPort} (worker_timeout=${workerTimeoutS}s)...`);
    let cap: CapHandle;
    try {
      cap = await bootCapRuntime(capRuntime, agentPort, workerTimeoutS, bootTimeoutMs);
    } catch (e: any) {
      return { id, label, passed: 0, failed: 0, skipped: 0,
        duration_ms: Date.now() - start, failures: [],
        error: e?.message ?? String(e) };
    }
    console.log(`  cap up; token=${cap.token.slice(0, 8)}…`);

    const failures: CaseFailure[] = [];
    let passed = 0;

    try {
      for (const tc of cases) {
        process.stdout.write(`  ${tc.name}... `);
        const outcomes = await runJsCase(cap, jsFrontend, benchDir, tc, bindTimeoutMs, runTimeoutMs);
        const localFail = outcomes.filter((o) => !o.ok);
        if (localFail.length === 0) {
          passed += outcomes.length;
          console.log(`✓ (${outcomes.length} checks)`);
        } else {
          for (const o of outcomes) {
            if (o.ok) passed++;
            else failures.push({ name: o.name, message: o.detail ?? "failed" });
          }
          console.log(`✗ ${localFail.length}/${outcomes.length}`);
          for (const o of localFail) console.log(`    ✗ ${o.name} — ${o.detail ?? "failed"}`);
        }
      }

      // Detached flow: POST /run-detached + /jobs/<id> + DELETE /jobs/<id>.
      // Uses a dedicated fixture (different port) so it never collides
      // with a synchronous case above.
      const detachedCase: TestCase = {
        name: "detached_hello",
        source: "tests/cap-js-http/hello_detached.js",
        guest_port: 18221,
        probes: [{ path: "/", expect_body_contains: "detached-hello" }],
      };
      process.stdout.write(`  ${detachedCase.name} (detached)... `);
      const detachedOutcomes = await runDetachedCase(
        cap, jsFrontend, benchDir, detachedCase, bindTimeoutMs,
      );
      const detachedFail = detachedOutcomes.filter((o) => !o.ok);
      if (detachedFail.length === 0) {
        passed += detachedOutcomes.length;
        console.log(`✓ (${detachedOutcomes.length} checks)`);
      } else {
        for (const o of detachedOutcomes) {
          if (o.ok) passed++;
          else failures.push({ name: o.name, message: o.detail ?? "failed" });
        }
        console.log(`✗ ${detachedFail.length}/${detachedOutcomes.length}`);
        for (const o of detachedFail) console.log(`    ✗ ${o.name} — ${o.detail ?? "failed"}`);
      }
    } finally {
      await shutdownCap(cap);
    }

    return {
      id, label,
      passed, failed: failures.length, skipped: 0,
      duration_ms: Date.now() - start,
      failures,
    };
  },
};
