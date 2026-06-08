/**
 * Real-World Build Suite
 *
 * Compiles real-world C/C++ projects (SQLite, lua, bzip2, miniz, mongoose, ...)
 * via the c-compiler plugin and verifies:
 *   1. Brick comes out (compile succeeds)
 *   2. Brick format is valid (manifest, wasm magic, abi_version)
 *   3. Manifest declares expected syscall_caps
 *   4. Smoke test passes (program does its job end-to-end)
 *
 * Each program has a `program.json` config under
 *   tests/realworld/<id>/program.json
 *
 * Sources are either pre-cached under tests/realworld/<id>/<extract_dir>/
 * or fetched on demand into .data/realworld/<id>/ (sha256-pinned).
 *
 * The suite generates a single wrapper.c that #includes every source file
 * (amalgamation-style) since the c-compiler plugin only accepts one --source.
 */

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  createReadStream,
  mkdtempSync,
} from "node:fs";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js";
import { spawnCapture } from "../utils.js";
import { validateBrick } from "../brick-validator.js";

interface ProgramSource {
  /** http(s) url to fetch (tarball, zip, single .c file) */
  url?: string;
  /** sha256 of the downloaded artifact, hex */
  sha256?: string;
  /** archive type: "zip" | "tar.gz" | "raw" */
  type?: "zip" | "tar.gz" | "raw";
  /** subdirectory inside the archive that holds the sources, after extraction */
  extract_dir?: string;
  /**
   * If sources are already pre-cached under tests/realworld/<id>/<local_dir>,
   * give the relative path here. Skips download.
   */
  local_dir?: string;
}

interface ProgramSmoke {
  /** stdin to feed (optional) */
  stdin?: string;
  /** strings expected to occur in stdout */
  expect_stdout_contains?: string[];
  /** strings that must NOT occur in stdout */
  expect_stdout_not_contains?: string[];
  /** expected exit code */
  expect_exit?: number;
  /** runtime timeout in ms */
  timeout_ms?: number;
}

interface ProgramConfig {
  id: string;
  label: string;
  /** "c-compiler" (default) or "cpp-compiler" */
  compiler?: "c-compiler" | "cpp-compiler";
  source: ProgramSource;
  /**
   * System headers to #include at the very top of wrapper.c, before any
   * project sources. Use to satisfy programs that rely on transitive
   * stdio.h/time.h/etc. includes that are missing on wasi-sysroot.
   */
  prelude_headers?: string[];
  /**
   * Defines to inject into wrapper.c (#define X Y or just X).
   * Required because the c-compiler plugin doesn't expose -D.
   */
  defines?: string[];
  /**
   * .c source files to #include in wrapper.c, in order.
   * Paths are relative to the resolved source root (extract_dir or local_dir).
   */
  sources: string[];
  /**
   * Per-source preprocessor preludes. For each source path key, the
   * `pre` lines are emitted immediately BEFORE its #include and the
   * `post` lines immediately AFTER. Use to resolve unity-build symbol
   * collisions (e.g. `#define kAsciiToInt kAsciiToInt_charconv`) without
   * editing third-party sources.
   */
  source_pragmas?: Record<string, { pre?: string[]; post?: string[] }>;
  /**
   * Optional driver .c file to append after the source includes.
   * Path is relative to the program directory (where program.json lives).
   * Use this for libraries that don't ship a main() (e.g. miniz, mongoose).
   */
  driver_file?: string;
  /**
   * Additional include subdirectories (relative to resolved source root).
   */
  include_dirs?: string[];
  /**
   * Caps the compiled brick is expected to declare in manifest.json.
   * Suite verifies they all appear.
   */
  expected_caps?: string[];
  smoke: ProgramSmoke;
}

interface RealWorldConfig {
  /** override timeout per program (ms) */
  timeout_ms?: number;
  /** if true: skip programs that need download when offline */
  offline_only?: boolean;
}

const DEFAULT_BUILD_TIMEOUT_MS = 10 * 60_000; // 10 min per program (sqlite is big)
const DEFAULT_RUN_TIMEOUT_MS = 30_000;

async function sha256OfFile(path: string): Promise<string> {
  return new Promise((resolveHash, reject) => {
    const h = createHash("sha256");
    const s = createReadStream(path);
    s.on("error", reject);
    s.on("data", (d) => h.update(d));
    s.on("end", () => resolveHash(h.digest("hex")));
  });
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const which = await spawnCapture("which", ["curl"]);
  if (which.code !== 0) {
    throw new Error("curl not found — required for downloading real-world sources");
  }
  const res = await spawnCapture("curl", [
    "-fsSL", "--retry", "3", "--max-time", "120",
    "-o", dest, url,
  ], { timeout: 180_000 });
  if (res.code !== 0) {
    throw new Error(`curl failed for ${url}: ${res.stderr.slice(-200)}`);
  }
}

async function extractArchive(archive: string, destDir: string, type: "zip" | "tar.gz"): Promise<void> {
  mkdirSync(destDir, { recursive: true });
  if (type === "zip") {
    const r = await spawnCapture("unzip", ["-q", "-o", archive, "-d", destDir], { timeout: 120_000 });
    if (r.code !== 0) throw new Error(`unzip failed: ${r.stderr.slice(-200)}`);
  } else {
    const r = await spawnCapture("tar", ["xzf", archive, "-C", destDir], { timeout: 120_000 });
    if (r.code !== 0) throw new Error(`tar xzf failed: ${r.stderr.slice(-200)}`);
  }
}

async function ensureSource(
  programDir: string,
  cacheDir: string,
  cfg: ProgramConfig,
  offlineOnly: boolean,
): Promise<{ ok: true; sourceRoot: string } | { ok: false; error: string }> {
  // Prefer pre-cached local directory
  if (cfg.source.local_dir) {
    const localPath = join(programDir, cfg.source.local_dir);
    if (existsSync(localPath) && statSync(localPath).isDirectory()) {
      return { ok: true, sourceRoot: localPath };
    }
  }

  // Check data cache
  if (cfg.source.extract_dir) {
    const cachedExtract = join(cacheDir, cfg.source.extract_dir);
    if (existsSync(cachedExtract)) {
      return { ok: true, sourceRoot: cachedExtract };
    }
  }

  if (!cfg.source.url) {
    return { ok: false, error: "No url and no local_dir/cached source available" };
  }
  if (offlineOnly) {
    return { ok: false, error: `Offline mode: source not cached (would need ${cfg.source.url})` };
  }

  // Download
  mkdirSync(cacheDir, { recursive: true });
  const archiveName = basename(new URL(cfg.source.url).pathname) || `${cfg.id}.bin`;
  const archivePath = join(cacheDir, archiveName);

  if (!existsSync(archivePath)) {
    try {
      await downloadFile(cfg.source.url, archivePath);
    } catch (e: any) {
      return { ok: false, error: `download failed: ${e.message}` };
    }
  }

  // Verify sha256 if specified
  if (cfg.source.sha256) {
    const actual = await sha256OfFile(archivePath);
    if (actual !== cfg.source.sha256) {
      try { rmSync(archivePath); } catch {}
      return { ok: false, error: `sha256 mismatch: expected ${cfg.source.sha256}, got ${actual}` };
    }
  }

  // Extract or use raw
  const archType = cfg.source.type ?? "tar.gz";
  if (archType === "raw") {
    return { ok: true, sourceRoot: cacheDir };
  }
  try {
    await extractArchive(archivePath, cacheDir, archType);
  } catch (e: any) {
    return { ok: false, error: e.message };
  }

  if (cfg.source.extract_dir) {
    const root = join(cacheDir, cfg.source.extract_dir);
    if (!existsSync(root)) {
      return { ok: false, error: `extract_dir "${cfg.source.extract_dir}" not found after extraction` };
    }
    return { ok: true, sourceRoot: root };
  }
  return { ok: true, sourceRoot: cacheDir };
}

function generateWrapper(cfg: ProgramConfig, sourceRoot: string, programDir: string): string {
  const lines: string[] = [];
  lines.push(`/* Auto-generated by realworld-build suite for ${cfg.id} */`);
  for (const def of cfg.defines ?? []) {
    if (def.includes(" ") || def.includes("=")) {
      const [k, ...rest] = def.split(/[ =]/);
      lines.push(`#define ${k} ${rest.join(" ")}`);
    } else {
      lines.push(`#define ${def}`);
    }
  }
  for (const h of cfg.prelude_headers ?? []) {
    if (h.startsWith("<") || h.startsWith("\"")) {
      lines.push(`#include ${h}`);
    } else {
      lines.push(`#include <${h}>`);
    }
  }
  for (const src of cfg.sources) {
    const pragmas = cfg.source_pragmas?.[src];
    if (pragmas?.pre) {
      for (const p of pragmas.pre) lines.push(p);
    }
    lines.push(`#include "${join(sourceRoot, src)}"`);
    if (pragmas?.post) {
      for (const p of pragmas.post) lines.push(p);
    }
  }
  if (cfg.driver_file) {
    const driverPath = join(programDir, cfg.driver_file);
    if (existsSync(driverPath)) {
      lines.push("");
      lines.push(`/* driver: ${cfg.driver_file} */`);
      lines.push(readFileSync(driverPath, "utf-8"));
    } else {
      lines.push(`#error "driver_file not found: ${driverPath}"`);
    }
  }
  return lines.join("\n") + "\n";
}

async function runWithStdin(
  bin: string,
  args: string[],
  stdin: string | undefined,
  timeoutMs: number,
  env: Record<string, string>,
): Promise<{ stdout: string; stderr: string; code: number | null; timedOut: boolean }> {
  return new Promise((resolveRun) => {
    const proc = spawn(bin, args, {
      env: { ...process.env, ...env },
      stdio: [stdin !== undefined ? "pipe" : "ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    proc.stdout?.on("data", (d) => (stdout += d));
    proc.stderr?.on("data", (d) => (stderr += d));
    if (stdin !== undefined && proc.stdin) {
      proc.stdin.write(stdin);
      proc.stdin.end();
    }
    const t = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, timeoutMs);
    proc.on("close", (code) => {
      clearTimeout(t);
      resolveRun({ stdout, stderr, code, timedOut });
    });
  });
}

interface ProgramOutcome {
  id: string;
  label: string;
  build: { ok: boolean; message?: string; durationMs: number };
  format: { ok: boolean; message?: string };
  caps: { ok: boolean; message?: string };
  smoke: { ok: boolean; message?: string; durationMs: number };
}

async function runProgram(
  programDir: string,
  cfg: ProgramConfig,
  ctx: RunContext,
  cacheRoot: string,
  suiteCfg: RealWorldConfig,
): Promise<ProgramOutcome> {
  const buildTimeout = suiteCfg.timeout_ms ?? DEFAULT_BUILD_TIMEOUT_MS;
  const runTimeout = cfg.smoke.timeout_ms ?? DEFAULT_RUN_TIMEOUT_MS;
  const cacheDir = join(cacheRoot, cfg.id);

  const outcome: ProgramOutcome = {
    id: cfg.id,
    label: cfg.label,
    build: { ok: false, durationMs: 0 },
    format: { ok: false },
    caps: { ok: false },
    smoke: { ok: false, durationMs: 0 },
  };

  // 1. Resolve source
  const src = await ensureSource(programDir, cacheDir, cfg, suiteCfg.offline_only ?? false);
  if (!src.ok) {
    outcome.build.message = `source: ${src.error}`;
    return outcome;
  }
  const sourceRoot = src.sourceRoot;

  // 2. Generate wrapper.{c,cpp}
  const isCpp = cfg.compiler === "cpp-compiler";
  const wrapperName = isCpp ? "wrapper.cpp" : "wrapper.c";
  const tmpDir = mkdtempSync(join(tmpdir(), `nex-rwb-${cfg.id}-`));
  const wrapperPath = join(tmpDir, wrapperName);
  const brickDir = join(tmpDir, "out.brick");
  writeFileSync(wrapperPath, generateWrapper(cfg, sourceRoot, programDir));

  // 3. Compile via {c,cpp}-compiler plugin
  const compilerName = cfg.compiler ?? "c-compiler";
  const compiler = join(ctx.pluginsDir, compilerName);
  if (!existsSync(compiler)) {
    outcome.build.message = `${compilerName} plugin missing: ${compiler}`;
    rmSync(tmpDir, { recursive: true, force: true });
    return outcome;
  }
  const compileArgs = ["compile", "--source", wrapperPath, "--output", brickDir];
  // Pass nex static include for both C and C++. The cpp-compiler now
  // hides its C++ stubs in a `c++/` subdirectory that it adds only in
  // Legacy mode, so passing the parent path is safe in ServerGrade mode
  // (libc++ from sysroot remains canonical).
  if (ctx.includePath) compileArgs.push("--include-path", ctx.includePath);
  compileArgs.push("--include-path", sourceRoot);
  // Program dir lets us drop hand-written stub headers next to program.json
  // (e.g. miniz_export.h that CMake would normally generate).
  compileArgs.push("--include-path", programDir);
  for (const inc of cfg.include_dirs ?? []) {
    compileArgs.push("--include-path", join(sourceRoot, inc));
  }

  const buildStart = Date.now();
  const compile = await spawnCapture(compiler, compileArgs, {
    timeout: buildTimeout,
    env: {
      LLY_INTERNAL: "1",
      ...(process.env.WASI_SDK_PATH ? { WASI_SDK_PATH: process.env.WASI_SDK_PATH } : {}),
      ...(process.env.WASI_SYSROOT ? { WASI_SYSROOT: process.env.WASI_SYSROOT } : {}),
    },
  });
  outcome.build.durationMs = Date.now() - buildStart;
  if (compile.timedOut) {
    outcome.build.message = `compile timed out after ${buildTimeout}ms`;
    rmSync(tmpDir, { recursive: true, force: true });
    return outcome;
  }
  if (compile.code !== 0) {
    // Preserve wrapper for post-mortem
    const debugDir = join(cacheRoot, "_debug", cfg.id);
    try {
      mkdirSync(debugDir, { recursive: true });
      writeFileSync(join(debugDir, "wrapper.c"), readFileSync(wrapperPath, "utf-8"));
      writeFileSync(join(debugDir, "compile_stderr.log"), compile.stderr);
    } catch {}
    outcome.build.message = `compile failed (exit ${compile.code}): ${compile.stderr.slice(-600)}`;
    rmSync(tmpDir, { recursive: true, force: true });
    return outcome;
  }
  outcome.build.ok = true;

  // 4. Validate brick format
  const validation = validateBrick(brickDir);
  const formatFails = validation.checks.filter((c) => !c.ok);
  if (formatFails.length === 0) {
    outcome.format.ok = true;
  } else {
    outcome.format.message = formatFails.map((c) => `${c.name}: ${c.message ?? ""}`).join("; ");
  }

  // 5. Verify expected caps in manifest
  const manifest = validation.manifest;
  if (cfg.expected_caps && cfg.expected_caps.length > 0) {
    if (!manifest || !Array.isArray(manifest.syscall_caps)) {
      outcome.caps.message = "manifest.syscall_caps missing or not array";
    } else {
      const haveCaps = new Set<string>(manifest.syscall_caps);
      const missing = cfg.expected_caps.filter((c) => !haveCaps.has(c));
      if (missing.length === 0) {
        outcome.caps.ok = true;
      } else {
        outcome.caps.message = `missing caps: ${missing.join(", ")} (have: ${[...haveCaps].join(", ")})`;
      }
    }
  } else {
    // No expectation → trivially ok
    outcome.caps.ok = true;
  }

  // 6. Smoke test via runtime plugin
  const runtime = join(ctx.pluginsDir, "runtime");
  if (!existsSync(runtime)) {
    outcome.smoke.message = `runtime plugin missing: ${runtime}`;
    rmSync(tmpDir, { recursive: true, force: true });
    return outcome;
  }
  const smokeStart = Date.now();
  const run = await runWithStdin(
    runtime,
    ["run", brickDir],
    cfg.smoke.stdin,
    runTimeout,
    { LLY_INTERNAL: "1" },
  );
  outcome.smoke.durationMs = Date.now() - smokeStart;

  const expectedExit = cfg.smoke.expect_exit ?? 0;
  if (run.timedOut) {
    outcome.smoke.message = `smoke timed out after ${runTimeout}ms`;
  } else if (run.code !== expectedExit) {
    outcome.smoke.message = `exit ${run.code} (expected ${expectedExit})\nstderr-tail: ${run.stderr.slice(-300)}\nstdout-tail: ${run.stdout.slice(-300)}`;
  } else {
    let ok = true;
    const reasons: string[] = [];
    for (const needle of cfg.smoke.expect_stdout_contains ?? []) {
      if (!run.stdout.includes(needle)) {
        ok = false;
        reasons.push(`missing "${needle}"`);
      }
    }
    for (const needle of cfg.smoke.expect_stdout_not_contains ?? []) {
      if (run.stdout.includes(needle)) {
        ok = false;
        reasons.push(`unexpected "${needle}"`);
      }
    }
    if (ok) {
      outcome.smoke.ok = true;
    } else {
      outcome.smoke.message = `${reasons.join("; ")}\nstdout-tail: ${run.stdout.slice(-300)}`;
    }
  }

  if (!process.env.NEX_KEEP_TMP) {
    rmSync(tmpDir, { recursive: true, force: true });
  } else {
    console.log(`    [keep-tmp] ${cfg.id} → ${tmpDir}`);
  }
  return outcome;
}

function loadProgramConfigs(testsRoot: string): ProgramConfig[] {
  const realRoot = join(testsRoot, "realworld");
  if (!existsSync(realRoot)) return [];
  const out: ProgramConfig[] = [];
  for (const entry of readdirSync(realRoot)) {
    const cfgPath = join(realRoot, entry, "program.json");
    if (!existsSync(cfgPath)) continue;
    try {
      const cfg = JSON.parse(readFileSync(cfgPath, "utf-8")) as ProgramConfig;
      if (cfg.id !== entry) {
        cfg.id = entry; // trust the directory name
      }
      out.push(cfg);
    } catch (e: any) {
      console.warn(`  realworld: bad program.json at ${cfgPath}: ${e.message}`);
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export const runner: Runner = {
  async run(rawConfig, ctx: RunContext): Promise<SuiteResult> {
    const cfg = (rawConfig ?? {}) as RealWorldConfig;
    const failures: CaseFailure[] = [];
    let passed = 0;

    let programs = loadProgramConfigs(ctx.testsDir);
    // Optional filter via REALWORLD_ONLY=miniz,cjson env var (comma-separated ids)
    const onlyFilter = process.env.REALWORLD_ONLY;
    if (onlyFilter) {
      const wanted = new Set(onlyFilter.split(",").map((s) => s.trim()).filter(Boolean));
      programs = programs.filter((p) => wanted.has(p.id));
    }
    if (programs.length === 0) {
      return {
        id: "", label: "", passed: 0, failed: 0, skipped: 0,
        duration_ms: 0, failures: [],
        error: `No real-world programs found under ${ctx.testsDir}/realworld/`,
      };
    }

    const cacheRoot = join(ctx.dataDir ?? join(ctx.testsDir, "..", ".data"), "realworld");
    mkdirSync(cacheRoot, { recursive: true });

    console.log(`\n    ${programs.length} real-world programs (sequential)`);

    for (const p of programs) {
      const programDir = join(ctx.testsDir, "realworld", p.id);
      process.stdout.write(`    ${p.id}... `);
      const t0 = Date.now();
      const outcome = await runProgram(programDir, p, ctx, cacheRoot, cfg);
      const elapsed = Date.now() - t0;

      // Each program contributes 4 sub-checks: build, format, caps, smoke
      const subs: { name: string; ok: boolean; msg?: string }[] = [
        { name: `${p.id}: build`,  ok: outcome.build.ok,  msg: outcome.build.message },
        { name: `${p.id}: format`, ok: outcome.format.ok, msg: outcome.format.message },
        { name: `${p.id}: caps`,   ok: outcome.caps.ok,   msg: outcome.caps.message },
        { name: `${p.id}: smoke`,  ok: outcome.smoke.ok,  msg: outcome.smoke.message },
      ];

      // If build failed, format/caps/smoke are inherently failed but reported once
      const isBuildFail = !outcome.build.ok;
      for (const s of subs) {
        if (s.ok) {
          passed++;
        } else {
          // For build-failure cascade, only report build itself (suppress noise)
          if (isBuildFail && s.name !== `${p.id}: build`) {
            failures.push({ name: s.name, message: "skipped due to build failure" });
          } else {
            failures.push({ name: s.name, message: s.msg ?? "no message" });
          }
        }
      }

      const okCount = subs.filter((s) => s.ok).length;
      console.log(`${okCount}/4 (${(elapsed / 1000).toFixed(1)}s, build ${(outcome.build.durationMs/1000).toFixed(1)}s, smoke ${(outcome.smoke.durationMs/1000).toFixed(1)}s)`);
    }

    return {
      id: "", label: "",
      passed,
      failed: failures.length,
      skipped: 0,
      duration_ms: 0,
      failures,
    };
  },
};
