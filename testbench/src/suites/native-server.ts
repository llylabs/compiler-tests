/**
 * Native Server Suite
 *
 * Compiles C/C++ HTTP server programs, starts them, sends HTTP probes,
 * and verifies the responses.
 */

import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js";
import { spawnCapture, walkFiles, findFreePort, waitForPort, runWithConcurrency } from "../utils.js";

interface NativeServerConfig {
  tests_dir: string;
  concurrency: number;
  timeout_ms: number;
  compile_timeout_ms: number;
}

interface Probe {
  method: string;
  path: string;
  body?: string;
  expectStatus: number;
  expectBodyContains?: string;
  expectHeader?: { key: string; value: string };
}

interface TestFile {
  filePath: string;
  name: string;
  probes: Probe[];
}

function parseTestFile(filePath: string): TestFile {
  const source = fs.readFileSync(filePath, "utf-8");
  const name = path.basename(filePath);
  const probes: Probe[] = [];
  let current: Partial<Probe> | null = null;

  for (const line of source.split("\n")) {
    const probeMatch = line.match(/\/\/\s*@probe:\s*(GET|POST|PUT|DELETE|PATCH)\s+(\S+)/);
    if (probeMatch) {
      if (current?.method) {
        probes.push({
          method: current.method,
          path: current.path!,
          body: current.body,
          expectStatus: current.expectStatus ?? 200,
          expectBodyContains: current.expectBodyContains,
          expectHeader: current.expectHeader,
        });
      }
      current = { method: probeMatch[1], path: probeMatch[2] };
      continue;
    }

    if (!current) continue;

    const statusMatch = line.match(/\/\/\s*@expect-status:\s*(\d+)/);
    if (statusMatch) { current.expectStatus = parseInt(statusMatch[1]); continue; }

    const bodyMatch = line.match(/\/\/\s*@expect-body-contains:\s*(.+)/);
    if (bodyMatch) { current.expectBodyContains = bodyMatch[1].trim(); continue; }

    const postBodyMatch = line.match(/\/\/\s*@post-body:\s*(.+)/);
    if (postBodyMatch) { current.body = postBodyMatch[1].trim(); continue; }

    const headerMatch = line.match(/\/\/\s*@expect-header:\s*([^:]+):\s*(.+)/);
    if (headerMatch) { current.expectHeader = { key: headerMatch[1].trim().toLowerCase(), value: headerMatch[2].trim() }; continue; }
  }

  // Push last probe
  if (current?.method) {
    probes.push({
      method: current.method,
      path: current.path!,
      body: current.body,
      expectStatus: current.expectStatus ?? 200,
      expectBodyContains: current.expectBodyContains,
      expectHeader: current.expectHeader,
    });
  }

  return { filePath, name, probes };
}

async function runServerTest(
  test: TestFile,
  ctx: RunContext,
  config: NativeServerConfig,
): Promise<{ pass: boolean; message?: string }> {
  const port = await findFreePort();
  const includeDir = path.resolve(path.dirname(test.filePath), "../include");

  const nexEnv: Record<string, string> = {
    ...process.env as Record<string, string>,
    PORT: String(port),
    NEX_INCLUDE_PATH: ctx.includePath ?? "",
  };

  const args = ["run", "-I", includeDir, test.filePath];

  // Start server as background process (nex run compiles + runs)
  let serverProc: ChildProcess;
  let stderr = "";

  try {
    serverProc = spawn(ctx.nexBinary, args, {
      env: nexEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });

    serverProc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

    // Wait for server to start (compilation + startup)
    // We DON'T use waitForPort because a raw TCP probe consumes an accept() in the server.
    // Instead, wait for stderr to show "Bundle:" or "Exit:" indicating compilation is done.
    let serverReady = false;
    const startTime = Date.now();
    while (Date.now() - startTime < config.compile_timeout_ms) {
      if (stderr.includes("Bundle:") || stderr.includes("brick")) {
        // Compilation done, server should be starting
        await new Promise((r) => setTimeout(r, 1000));
        serverReady = true;
        break;
      }
      if (stderr.includes("error:")) {
        break;
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    if (!serverReady) {
      serverProc.kill("SIGKILL");
      await new Promise((r) => setTimeout(r, 500));
      const errLines = stderr.split("\n").filter(l => {
        const t = l.trim();
        return t && !t.startsWith("NEX") && !t.startsWith("─") && !t.startsWith("Source:") &&
          !t.startsWith("Language:") && !t.startsWith("Output:") && !t.startsWith("Built:") &&
          !t.startsWith("Bundle:") && !t.startsWith("[EXECUTOR]");
      }).join("\n").trim();
      return {
        pass: false,
        message: `Server failed to start on port ${port}. ${errLines || "(timeout waiting for compilation)"}`,
      };
    }

    // Run probes sequentially — each probe retries to handle startup timing
    for (let i = 0; i < test.probes.length; i++) {
      const probe = test.probes[i];
      const url = `http://127.0.0.1:${port}${probe.path}`;

      try {
        // Retry up to 5 times with delays (first probe needs more time)
        const maxAttempts = i === 0 ? 10 : 3;
        let resp: Response | undefined;
        let body = "";
        let lastErr: any;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const fetchOpts: RequestInit = {
              method: probe.method,
              signal: AbortSignal.timeout(5000),
            };
            if (probe.body) {
              fetchOpts.body = probe.body;
              fetchOpts.headers = { "Content-Type": "text/plain" };
            }
            resp = await fetch(url, fetchOpts);
            body = await resp.text();
            break;
          } catch (e) {
            lastErr = e;
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        if (!resp) {
          const errMsg = lastErr?.cause?.message ?? lastErr?.message ?? String(lastErr);
          return {
            pass: false,
            message: `Probe ${i + 1} (${probe.method} ${probe.path}): ${errMsg.slice(0, 300)}`,
          };
        }

        if (resp.status !== probe.expectStatus) {
          return {
            pass: false,
            message: `Probe ${i + 1} (${probe.method} ${probe.path}): expected status ${probe.expectStatus}, got ${resp.status}`,
          };
        }

        if (probe.expectBodyContains && !body.includes(probe.expectBodyContains)) {
          return {
            pass: false,
            message: `Probe ${i + 1} (${probe.method} ${probe.path}): body missing "${probe.expectBodyContains}". Got: "${body.slice(0, 200)}"`,
          };
        }

        if (probe.expectHeader) {
          const headerVal = resp.headers.get(probe.expectHeader.key);
          if (!headerVal?.includes(probe.expectHeader.value)) {
            return {
              pass: false,
              message: `Probe ${i + 1}: header "${probe.expectHeader.key}" expected "${probe.expectHeader.value}", got "${headerVal}"`,
            };
          }
        }
      } catch (e: any) {
        return {
          pass: false,
          message: `Probe ${i + 1} (${probe.method} ${probe.path}): ${e.message?.slice(0, 300) ?? e}`,
        };
      }
    }

    return { pass: true };
  } finally {
    serverProc!?.kill("SIGKILL");
    // Wait a moment for cleanup
    await new Promise((r) => setTimeout(r, 200));
  }
}

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const cfg = config as unknown as NativeServerConfig;
    const benchDir = path.resolve(ctx.testsDir, "..");
    const testsDir = path.resolve(benchDir, cfg.tests_dir);

    const id = "native-server";
    const label = "C/C++ Server (HTTP)";
    const start = Date.now();

    // Discover tests
    const cFiles = walkFiles(path.join(testsDir, "c"), ".c");
    const cppFiles = walkFiles(path.join(testsDir, "cpp"), ".cpp");
    const allFiles = [...cFiles, ...cppFiles].sort();

    const tests = allFiles
      .map(parseTestFile)
      .filter((t) => t.probes.length > 0);

    if (tests.length === 0) {
      return {
        id, label, passed: 0, failed: 0, skipped: 0,
        duration_ms: Date.now() - start, failures: [],
        error: `No server tests found in ${testsDir}`,
      };
    }

    console.log(`\n    ${tests.length} server tests (${cfg.concurrency} parallel)`);

    let passed = 0;
    let failed = 0;
    const failures: CaseFailure[] = [];
    let done = 0;

    const tasks = tests.map((test) => async () => {
      const result = await runServerTest(test, ctx, cfg);
      done++;

      if (result.pass) {
        passed++;
      } else {
        failed++;
        failures.push({ name: test.name, message: result.message ?? "unknown error" });
      }

      if (done % 5 === 0 || done === tests.length) {
        process.stdout.write(`    ... ${done}/${tests.length} (${failed} failed)\n`);
      }

      return result;
    });

    await runWithConcurrency(tasks, cfg.concurrency);

    return { id, label, passed, failed, skipped: 0, duration_ms: Date.now() - start, failures };
  },
};
