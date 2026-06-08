import { spawn } from "node:child_process";
import { readdirSync, statSync, existsSync, mkdirSync, readFileSync, rmSync, copyFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, basename, dirname, resolve } from "node:path";
import net from "node:net";

export interface SpawnResult {
  stdout: string;
  stderr: string;
  code: number | null;
  timedOut: boolean;
}

export function spawnCapture(
  cmd: string,
  args: string[],
  opts: { cwd?: string; timeout?: number; env?: Record<string, string> } = {}
): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const env = { ...process.env, ...opts.env };
    const proc = spawn(cmd, args, {
      cwd: opts.cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));

    const timer = opts.timeout
      ? setTimeout(() => {
          timedOut = true;
          proc.kill("SIGKILL");
        }, opts.timeout)
      : null;

    proc.on("error", (err: any) => {
      if (timer) clearTimeout(timer);
      // ENOENT (binary not found) etc. — surface as non-zero exit instead of crashing
      const msg = err?.code === "ENOENT" ? `command not found: ${cmd}` : (err?.message ?? String(err));
      resolve({ stdout, stderr: stderr + msg, code: 127, timedOut });
    });

    proc.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({ stdout, stderr, code, timedOut });
    });
  });
}

/**
 * Recursively walk a directory and collect files with a given extension.
 */
export function walkFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  function walk(d: string) {
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(ext)) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

/**
 * Run async tasks with limited concurrency.
 */
export async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

/**
 * Strips NEX compiler/runtime header lines from captured stdout,
 * leaving only the program's actual output.
 */
export function stripNexHeaders(output: string): string {
  return output
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (t === "") return false;
      if (/^─+$/.test(t)) return false;
      if (/NEX (Compile|Runtime)/.test(t)) return false;
      if (/^(Source|Language|Output|Bundle|Bricks|Built|Loaded|Exit|Compiling):/.test(t)) return false;
      if (/^Compiling (TypeScript|JavaScript|C\b|C\+\+)/.test(t)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

/**
 * Git clone (depth=1, sparse) or update a repo.
 */
export async function ensureRepo(
  repoUrl: string,
  targetDir: string,
  sparsePaths: string[] = []
): Promise<{ ok: boolean; error?: string }> {
  const label = basename(targetDir);

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
    process.stdout.write(`  Cloning ${label}... `);

    const cloneArgs = sparsePaths.length > 0
      ? ["clone", "--depth=1", "--filter=blob:none", "--sparse", repoUrl, targetDir]
      : ["clone", "--depth=1", repoUrl, targetDir];

    const clone = await spawnCapture("git", cloneArgs);
    if (clone.code !== 0) {
      console.log("✗");
      return { ok: false, error: `git clone failed: ${clone.stderr.trim()}` };
    }

    if (sparsePaths.length > 0) {
      const sparse = await spawnCapture(
        "git", ["sparse-checkout", "set", ...sparsePaths],
        { cwd: targetDir }
      );
      if (sparse.code !== 0) {
        console.log("✗");
        return { ok: false, error: `git sparse-checkout failed: ${sparse.stderr.trim()}` };
      }
    }

    console.log("✓");
  } else {
    if (sparsePaths.length > 0) {
      await spawnCapture("git", ["sparse-checkout", "add", ...sparsePaths], { cwd: targetDir });
    }
    process.stdout.write(`  Updating ${label}... `);
    await spawnCapture("git", ["pull", "--ff-only"], { cwd: targetDir });
    console.log("✓");
  }

  return { ok: true };
}

/** Parse // @expect-contains: <value> directives from a source file */
export function parseExpectContains(source: string): string[] {
  const results: string[] = [];
  for (const line of source.split("\n")) {
    const m = line.match(/\/\/\s*@expect-contains:\s*(.+)/);
    if (m) results.push(m[1].trim());
  }
  return results;
}

/** Parse STATUS / CONTAINS / NOT-CONTAINS / HEADER / REDIRECT from a .expect file */
export interface ExpectFile {
  status: number;
  contains: string[];
  notContains: string[];
  headers: { name: string; value: string }[];
  /** "manual" disables fetch's automatic redirect following so STATUS / HEADER
   *  assertions can target the 3xx response itself. */
  redirect?: "manual" | "follow";
}

export function parseExpectFile(content: string): ExpectFile {
  const result: ExpectFile = {
    status: 200,
    contains: [],
    notContains: [],
    headers: [],
  };
  for (const line of content.split("\n")) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const statusM = l.match(/^STATUS:\s*(\d+)/);
    if (statusM) { result.status = parseInt(statusM[1]); continue; }
    const containsM = l.match(/^CONTAINS:\s*(.+)/);
    if (containsM) { result.contains.push(containsM[1].trim()); continue; }
    const notM = l.match(/^NOT-CONTAINS:\s*(.+)/);
    if (notM) { result.notContains.push(notM[1].trim()); continue; }
    const headerM = l.match(/^HEADER:\s*([^:]+):\s*(.+)/);
    if (headerM) {
      result.headers.push({ name: headerM[1].trim(), value: headerM[2].trim() });
      continue;
    }
    const redirM = l.match(/^REDIRECT:\s*(manual|follow)/);
    if (redirM) { result.redirect = redirM[1] as "manual" | "follow"; continue; }
  }
  return result;
}

/** Find a free TCP port on localhost */
export function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as net.AddressInfo;
      server.close(() => resolve(addr.port));
    });
    server.on("error", reject);
  });
}

/** Poll until a TCP port accepts connections, or timeout */
export function waitForPort(port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    function attempt() {
      if (Date.now() > deadline) { resolve(false); return; }
      const socket = net.createConnection(port, "127.0.0.1");
      socket.on("connect", () => { socket.destroy(); resolve(true); });
      socket.on("error", () => { socket.destroy(); setTimeout(attempt, 300); });
    }
    attempt();
  });
}

/**
 * Build `nex run` args with optional `--cap` for remote execution.
 */
export function nexRunArgs(file: string, cap?: string, extraArgs: string[] = []): string[] {
  const args = ["run"];
  if (cap) args.push("--cap", cap);
  args.push(...extraArgs, file);
  return args;
}

/** Run a C file with nex, return { pass, message } */
export async function runNexC(
  sourceFile: string,
  nexBinary: string,
  options: { expectedOutput?: string; timeout?: number; includePaths?: string[]; cap?: string } = {}
): Promise<{ pass: boolean; message?: string }> {
  const os = await import("os");
  const tmpDir = mkdtempSync(join(os.tmpdir(), "nex-c-"));
  const tmpFile = join(tmpDir, basename(sourceFile));
  copyFileSync(sourceFile, tmpFile);

  const args = ["run"];
  if (options.cap) args.push("--cap", options.cap);
  const sourceDir = dirname(resolve(sourceFile));
  args.push("-I", sourceDir);
  if (options.includePaths) {
    for (const p of options.includePaths) {
      args.push("-I", p);
    }
  }
  args.push(tmpFile);

  try {
    const result = await spawnCapture(nexBinary, args, {
      timeout: options.timeout ?? 45_000,
    });

    if (result.timedOut) return { pass: false, message: `timed out (${Math.round((options.timeout ?? 45_000) / 1000)}s)` };

    if (result.code !== 0) {
      const msg = result.stderr.trim().split("\n").slice(-3).join(" | ") || `exit code ${result.code}`;
      return { pass: false, message: msg };
    }

    if (options.expectedOutput !== undefined) {
      const actual = stripNexHeaders(result.stdout).trim();
      const expected = options.expectedOutput.trim();
      if (actual !== expected) {
        return {
          pass: false,
          message: `expected: ${expected.slice(0, 150)}\ngot:      ${actual.slice(0, 150)}`,
        };
      }
    }

    return { pass: true };
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
