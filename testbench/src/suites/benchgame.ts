/**
 * Computer Language Benchmarks Game — Rust + Go differential suite.
 *
 * Source: https://salsa.debian.org/benchmarksgame-team/benchmarksgame
 *         (via the GitHub mirror https://github.com/madnight/benchmarksgame)
 *
 * Each task (n-body, mandelbrot, fasta, k-nucleotide, regex-redux,
 * binary-trees, fannkuch-redux, spectral-norm, reverse-complement, pidigits)
 * has multiple implementations per language. This suite picks the single-
 * threaded reference implementation per language, compiles it to
 * wasm32-wasip1, runs it with a small fixed input N, and compares stdout
 * against the canonical reference output.
 *
 * The same task in Rust + Go must produce byte-identical output — that's
 * the differential signal: if Rust passes but Go diverges (or vice versa),
 * one frontend has a bug.
 *
 * The expected outputs are checked into `tests/benchgame/expected/<task>.<N>.txt`
 * (small N, deterministic, hand-verified once with stock rustc + go).
 *
 * For tasks that read stdin (fasta-output → reverse-complement-input chain),
 * we use the small fixtures in `tests/benchgame/inputs/`.
 */
import { join, basename, dirname } from "node:path";
import {
  readFileSync,
  existsSync,
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js";
import { spawnCapture, runWithConcurrency } from "../utils.js";
import { ensureRepo } from "../repo.js";

interface Config {
  bg_repo: string;
  data_dir: string;
  fixtures_dir: string;       // tests/benchgame/
  concurrency: number;
  timeout_ms: number;
  langs: ("rust" | "go")[];
  tasks: TaskSpec[];
}

interface TaskSpec {
  /** Task identifier (e.g. "nbody"). */
  id: string;
  /** Path inside the BG repo to the Rust impl (relative). */
  rust_path: string;
  /** Path inside the BG repo to the Go impl (relative). */
  go_path: string;
  /** Single integer argument (BG convention: program reads N from argv). */
  n: number;
  /** If true, the program reads input from stdin from `inputs/<id>.<n>.in`. */
  stdin_input?: boolean;
  /** Fixed-stdout reference file basename: `expected/<id>.<n>.out`. */
  expected_basename: string;
}

const DEFAULTS: Config = {
  bg_repo: "https://github.com/madnight/benchmarksgame",
  data_dir: ".data/benchgame",
  fixtures_dir: "tests/benchgame",
  concurrency: 4,
  timeout_ms: 60_000,
  langs: ["rust", "go"],
  // Curated subset: pure-compute, single-threaded variants, small N
  tasks: [
    {
      id: "nbody",
      rust_path: "bench/nbody/nbody.rust",
      go_path: "bench/nbody/nbody.go",
      n: 1000,
      expected_basename: "nbody.1000.out",
    },
    {
      id: "fannkuch-redux",
      rust_path: "bench/fannkuchredux/fannkuchredux.rust",
      go_path: "bench/fannkuchredux/fannkuchredux.go",
      n: 7,
      expected_basename: "fannkuchredux.7.out",
    },
    {
      id: "spectral-norm",
      rust_path: "bench/spectralnorm/spectralnorm.rust",
      go_path: "bench/spectralnorm/spectralnorm.go",
      n: 100,
      expected_basename: "spectralnorm.100.out",
    },
    {
      id: "binary-trees",
      rust_path: "bench/binarytrees/binarytrees.rust",
      go_path: "bench/binarytrees/binarytrees.go",
      n: 10,
      expected_basename: "binarytrees.10.out",
    },
    {
      id: "mandelbrot",
      rust_path: "bench/mandelbrot/mandelbrot.rust",
      go_path: "bench/mandelbrot/mandelbrot.go",
      n: 200,
      expected_basename: "mandelbrot.200.out",
    },
    {
      id: "fasta",
      rust_path: "bench/fasta/fasta.rust",
      go_path: "bench/fasta/fasta.go",
      n: 1000,
      expected_basename: "fasta.1000.out",
    },
    {
      id: "pidigits",
      rust_path: "bench/pidigits/pidigits.rust",
      go_path: "bench/pidigits/pidigits.go",
      n: 100,
      expected_basename: "pidigits.100.out",
    },
  ],
};

// ---------------------------------------------------------------------------
// Compile helpers
// ---------------------------------------------------------------------------

interface CompileResult {
  pass: boolean;
  brickDir: string;
  tmpDir: string;
  message?: string;
}

async function compileRust(sourceFile: string, timeout: number): Promise<CompileResult> {
  const name = basename(sourceFile).replace(/\.[^.]+$/, "");
  const tmpDir = mkdtempSync(join(tmpdir(), `bg-rust-${name}-`));
  const brickDir = join(tmpDir, `${name}.brick`);
  const wasmFile = join(tmpDir, `${name}.wasm`);

  const rc = await spawnCapture("rustc", [
    "--edition=2021",
    "--target", "wasm32-wasip1",
    "--crate-type=bin",
    "-C", "opt-level=2",
    "-C", "panic=abort",
    "-C", "link-args=--export-all",
    "-C", "link-args=--allow-undefined",
    "-o", wasmFile,
    sourceFile,
  ], { timeout });

  if (rc.code !== 0) {
    return { pass: false, brickDir, tmpDir, message: `rustc: ${rc.stderr.slice(-400)}` };
  }
  return wrapBrick(wasmFile, brickDir, tmpDir);
}

async function compileGo(sourceFile: string, timeout: number): Promise<CompileResult> {
  const name = basename(sourceFile).replace(/\.[^.]+$/, "");
  const tmpDir = mkdtempSync(join(tmpdir(), `bg-go-${name}-`));
  const brickDir = join(tmpDir, `${name}.brick`);
  const wasmFile = join(tmpDir, `${name}.wasm`);

  const gb = await spawnCapture("go", ["build", "-o", wasmFile, sourceFile], {
    timeout,
    env: {
      GOOS: "wasip1",
      GOARCH: "wasm",
      GOFLAGS: "-mod=mod",
      GOCACHE: join(tmpDir, "gocache"),
      GOMODCACHE: join(tmpDir, "modcache"),
    },
  });
  if (gb.code !== 0) {
    return { pass: false, brickDir, tmpDir, message: `go build: ${gb.stderr.slice(-400)}` };
  }
  return wrapBrick(wasmFile, brickDir, tmpDir);
}

function wrapBrick(wasmFile: string, brickDir: string, tmpDir: string): CompileResult {
  if (!existsSync(wasmFile)) {
    return { pass: false, brickDir, tmpDir, message: "wasm not produced" };
  }
  mkdirSync(join(brickDir, "bricks"), { recursive: true });
  copyFileSync(wasmFile, join(brickDir, "bricks", "brick_001.wasm"));
  writeFileSync(join(brickDir, "manifest.json"), JSON.stringify({
    version: "1",
    abi_version: "legacy.static.v0",
    entrypoint: "brick_001",
    bricks: [{
      id: "brick_001",
      wasm: "bricks/brick_001.wasm",
      functions: ["main", "_start"],
    }],
    execution_flow: {},
    globals: [],
    init_order: ["brick_001"],
    fini_order: ["brick_001"],
  }, null, 2));
  return { pass: true, brickDir, tmpDir };
}

// ---------------------------------------------------------------------------
// Run with argv N + optional stdin
// ---------------------------------------------------------------------------

async function runBrick(
  runtime: string,
  brickDir: string,
  argN: number,
  stdinFile: string | null,
  timeout: number,
): Promise<{ stdout: string; stderr: string; code: number | null; timedOut: boolean }> {
  return new Promise((resolve) => {
    const args = ["run", brickDir, "--", String(argN)];
    const proc = spawn(runtime, args, {
      stdio: [stdinFile ? "pipe" : "ignore", "pipe", "pipe"],
      env: { ...process.env, LLY_INTERNAL: "1" },
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    proc.stdout?.on("data", (d) => (stdout += d));
    proc.stderr?.on("data", (d) => (stderr += d));

    if (stdinFile && proc.stdin) {
      try {
        const data = readFileSync(stdinFile);
        proc.stdin.end(data);
      } catch {
        proc.stdin.end();
      }
    }

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, timeout);

    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, timedOut });
    });
  });
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export const runner: Runner = {
  async run(config, ctx): Promise<SuiteResult> {
    const cfg = { ...DEFAULTS, ...(config as Partial<Config>) };
    const start = Date.now();
    const failures: CaseFailure[] = [];
    let passed = 0;
    let skipped = 0;

    const runtime = join(ctx.pluginsDir, "runtime");
    if (!existsSync(runtime)) {
      return empty(start, "runtime binary not found");
    }

    // Toolchain checks (per language). Skip whole language if missing.
    const haveRust = (await spawnCapture("rustc", ["--version"], { timeout: 10_000 })).code === 0;
    const haveGo = (await spawnCapture("go", ["version"], { timeout: 10_000 })).code === 0;

    const langs = cfg.langs.filter((l) => (l === "rust" ? haveRust : l === "go" ? haveGo : false));
    if (langs.length === 0) {
      return empty(start, "neither rustc nor go found in PATH");
    }

    // Clone benchmarksgame mirror (sparse — only bench/)
    const dataDir = join(ctx.testsDir, "..", cfg.data_dir);
    const bgDir = join(dataDir, "benchmarksgame");
    const repo = await ensureRepo(cfg.bg_repo, bgDir, ["bench"]);
    if (!repo.ok) {
      return empty(start, `failed to clone benchmarksgame: ${repo.error}`);
    }

    const fixturesRoot = join(ctx.testsDir, "..", cfg.fixtures_dir);
    const expectedDir = join(fixturesRoot, "expected");
    const inputsDir = join(fixturesRoot, "inputs");

    // Cross-product: tasks × langs
    type Case = { lang: "rust" | "go"; task: TaskSpec; sourceFile: string; expectedFile: string; stdinFile: string | null };
    const cases: Case[] = [];
    for (const task of cfg.tasks) {
      for (const lang of langs) {
        const relPath = lang === "rust" ? task.rust_path : task.go_path;
        const sourceFile = join(bgDir, relPath);
        if (!existsSync(sourceFile)) {
          skipped++;
          continue;
        }
        const expectedFile = join(expectedDir, task.expected_basename);
        if (!existsSync(expectedFile)) {
          // Capture-once policy: without a pinned reference we can't differential-test
          skipped++;
          continue;
        }
        const stdinFile = task.stdin_input ? join(inputsDir, `${task.id}.${task.n}.in`) : null;
        cases.push({ lang, task, sourceFile, expectedFile, stdinFile });
      }
    }

    console.log(`\n    ${cases.length} benchgame cases (${cfg.tasks.length} tasks × ${langs.length} langs, ${skipped} skipped)`);

    if (cases.length === 0) {
      return empty(start, "no executable cases (sources or expected files missing)");
    }

    const tasks = cases.map((c) => async () => {
      const label = `${c.task.id}/${c.lang}`;
      const expected = readFileSync(c.expectedFile, "utf-8");

      const compile = c.lang === "rust"
        ? await compileRust(c.sourceFile, cfg.timeout_ms)
        : await compileGo(c.sourceFile, cfg.timeout_ms);

      if (!compile.pass) {
        try { rmSync(compile.tmpDir, { recursive: true, force: true }); } catch {}
        return { name: label, pass: false, message: compile.message || "compile failed" };
      }

      try {
        const run = await runBrick(
          runtime, compile.brickDir, c.task.n, c.stdinFile, cfg.timeout_ms,
        );
        if (run.timedOut) return { name: label, pass: false, message: "timeout" };
        if (run.code !== 0) {
          return { name: label, pass: false, message: `exit ${run.code}\n${run.stderr.slice(-300)}` };
        }
        // Byte-exact comparison after trim — BG outputs are deterministic
        if (run.stdout.trim() !== expected.trim()) {
          // Show first diverging line for actionable failure messages
          const exp = expected.trim().split("\n");
          const act = run.stdout.trim().split("\n");
          let firstDiff = -1;
          for (let i = 0; i < Math.max(exp.length, act.length); i++) {
            if (exp[i] !== act[i]) { firstDiff = i; break; }
          }
          return {
            name: label, pass: false,
            message: firstDiff >= 0
              ? `diff at line ${firstDiff + 1}:\n  expected: ${(exp[firstDiff] ?? "").slice(0, 100)}\n  got:      ${(act[firstDiff] ?? "").slice(0, 100)}`
              : `output length mismatch (exp ${exp.length} lines, got ${act.length})`,
          };
        }
        return { name: label, pass: true, message: "" };
      } finally {
        try { rmSync(compile.tmpDir, { recursive: true, force: true }); } catch {}
      }
    });

    const results = await runWithConcurrency(tasks, cfg.concurrency);
    for (const r of results) {
      if (r.pass) passed++;
      else failures.push({ name: r.name, message: r.message });
    }

    return {
      id: "benchgame",
      label: "Benchmarks Game (Rust+Go diff)",
      passed,
      failed: failures.length,
      skipped,
      duration_ms: Date.now() - start,
      failures,
    };
  },
};

function empty(start: number, error?: string): SuiteResult {
  return {
    id: "benchgame",
    label: "Benchmarks Game (Rust+Go diff)",
    passed: 0, failed: 0, skipped: 0,
    duration_ms: Date.now() - start, failures: [], error,
  };
}
