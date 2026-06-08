/**
 * Rust run-pass test suite.
 *
 * Sources:
 *   1. rustc's tests/ui/ — files annotated with `//@ run-pass`
 *      (standalone only, no aux-build dependencies)
 *   2. Miri's tests/pass/ — standalone runtime-semantics tests
 *
 * Each test is a single .rs file that must:
 *   - Compile via rustc to WASM
 *   - Compile through the NEX static pipeline to a .brick bundle
 *   - Execute in the NEX runtime with exit code 0
 */
import { join, relative, basename } from "node:path";
import {
  readFileSync,
  readdirSync,
  existsSync,
  mkdtempSync,
  rmSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js";
import { spawnCapture, walkFiles, runWithConcurrency } from "../utils.js";
import { ensureRepo } from "../repo.js";

interface Config {
  rustc_repo: string;
  miri_repo: string;
  data_dir: string;
  concurrency: number;
  timeout_ms: number;
  target: string;
  include_miri: boolean;
}

const DEFAULTS: Config = {
  rustc_repo: "https://github.com/rust-lang/rust",
  miri_repo: "https://github.com/rust-lang/miri",
  data_dir: ".data/rust",
  concurrency: 16,
  timeout_ms: 60_000,
  target: "wasm32-wasip1",
  include_miri: true,
};

// ---------------------------------------------------------------------------
// Test discovery & filtering
// ---------------------------------------------------------------------------

/** Directives that make a test non-standalone or incompatible with WASM */
const SKIP_DIRECTIVES = [
  "//@ aux-build",
  "//@ aux-crate",
  "//@ aux-bin",
  "//@ ignore-wasm",
  "//@ ignore-wasm32",
  "//@ only-x86",
  "//@ only-linux",
  "//@ only-macos",
  "//@ only-windows",
  "//@ only-64bit",
  "//@ needs-asm-support",
  "//@ needs-unwind",
  "//@ needs-threads",
  "//@ needs-profiler-support",
  "//@ needs-sanitizer",
  "//@ needs-dynamic-linking",
  "//@ no-prefer-dynamic",
  "//@ needs-run-enabled",
  "//@ revisions",
  "//@ proc-macro",
];

/** Subdirectories most likely to contain WASM-compatible run-pass tests */
const PRIORITY_DIRS = [
  "numbers-arithmetic",
  "numeric",
  "binop",
  "unop",
  "float",
  "structs-enums",
  "structs",
  "enum",
  "enum-discriminant",
  "match",
  "pattern",
  "closures",
  "unboxed-closures",
  "traits",
  "associated-types",
  "generics",
  "const-generics",
  "type",
  "cast",
  "coercion",
  "loops",
  "for-loop-while",
  "if",
  "fn",
  "recursion",
  "array",
  "tuple",
  "box",
  "dst",
  "drop",
  "moves",
  "copy",
  "transmute",
  "const",
  "statics",
];

function isRunPass(source: string): boolean {
  // Check first 30 lines for the directive (like compiletest does)
  const head = source.slice(0, 3000);
  return head.includes("//@ run-pass") || head.includes("// run-pass");
}

function shouldSkip(source: string): string | null {
  const head = source.slice(0, 4000);
  for (const directive of SKIP_DIRECTIVES) {
    if (head.includes(directive)) {
      return directive;
    }
  }
  // Skip tests that require std features unavailable on WASM
  if (head.includes("std::process") || head.includes("std::thread") ||
      head.includes("std::net") || head.includes("std::fs::") ||
      head.includes("std::env::")) {
    return "uses-unavailable-std";
  }
  return null;
}

/**
 * Parse optional expected output from `//@ check-run-results` tests.
 * Most run-pass tests just check exit code 0.
 */
function parseExpectedOutput(testFile: string): string | undefined {
  const runStdout = testFile.replace(/\.rs$/, ".run.stdout");
  if (existsSync(runStdout)) {
    return readFileSync(runStdout, "utf-8");
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Compilation helpers
// ---------------------------------------------------------------------------

async function compileRustToBrick(
  sourceFile: string,
  pluginsDir: string,
  target: string,
  timeout: number,
): Promise<{ pass: boolean; brickDir: string; tmpDir: string; message?: string }> {
  const name = basename(sourceFile, ".rs");
  const tmpDir = mkdtempSync(join(tmpdir(), `nex-rust-${name}-`));
  const brickDir = join(tmpDir, `${name}.brick`);
  const wasmFile = join(tmpDir, `${name}.wasm`);

  // Step 1: rustc → WASM (direct compilation, no NEX pipeline yet)
  // This validates that rustc can compile it for the target
  const rustc = await spawnCapture("rustc", [
    "--edition=2021",
    "--target", target,
    "--crate-type=bin",
    "-C", "opt-level=2",
    "-C", "panic=abort",
    "-C", "link-args=--export-all",
    "-C", "link-args=--allow-undefined",
    "-o", wasmFile,
    sourceFile,
  ], { timeout });

  if (rustc.code !== 0) {
    return {
      pass: false, brickDir, tmpDir,
      message: `rustc failed: ${rustc.stderr.slice(-500)}`,
    };
  }

  // Step 2: NEX static compiler (.rs → .brick)
  // Once the Rust frontend is implemented in the static compiler,
  // this will use the c-compiler plugin (or a future rust-compiler plugin).
  // For now, use the nexc binary if available, otherwise wrap the WASM
  // into a minimal brick structure.
  const nexc = join(pluginsDir, "rust-compiler");
  if (existsSync(nexc)) {
    const compile = await spawnCapture(nexc, [
      "compile", "--source", sourceFile, "--output", brickDir,
    ], {
      timeout,
      env: { LLY_INTERNAL: "1" },
    });

    if (compile.code !== 0) {
      return {
        pass: false, brickDir, tmpDir,
        message: `nexc (rust) failed: ${compile.stderr.slice(-500)}`,
      };
    }
  } else {
    // Fallback: create minimal brick from raw WASM
    // This allows running the test suite before the Rust frontend is complete.
    if (!existsSync(wasmFile)) {
      return { pass: false, brickDir, tmpDir, message: "WASM file not produced" };
    }
    mkdirSync(join(brickDir, "bricks"), { recursive: true });
    const { copyFileSync: cp, writeFileSync: wf } = await import("node:fs");
    cp(wasmFile, join(brickDir, "bricks", "brick_001.wasm"));
    wf(join(brickDir, "manifest.json"), JSON.stringify({
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
  }

  return { pass: true, brickDir, tmpDir };
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

    // Check rustc is available
    const rustcCheck = await spawnCapture("rustc", ["--version"], { timeout: 10_000 });
    if (rustcCheck.code !== 0) {
      return empty(start, "rustc not found in PATH");
    }

    // Ensure repos
    const dataDir = join(ctx.testsDir, "..", cfg.data_dir);

    // Clone rustc repo (sparse — only tests/ui/)
    const rustcDir = join(dataDir, "rustc");
    const rustcResult = await ensureRepo(cfg.rustc_repo, rustcDir, ["tests/ui"]);
    if (!rustcResult.ok) {
      return empty(start, `Failed to clone rustc: ${rustcResult.error}`);
    }

    // Collect test files
    const testFiles: { file: string; source: string; expectedOutput?: string }[] = [];

    // Source 1: rustc tests/ui/ — run-pass tests
    const uiDir = join(rustcDir, "tests/ui");
    if (existsSync(uiDir)) {
      // Scan priority directories first, then all others
      const scannedDirs = new Set<string>();
      const scanDir = (dir: string) => {
        if (scannedDirs.has(dir) || !existsSync(dir)) return;
        scannedDirs.add(dir);
        const files = walkFiles(dir, ".rs");
        for (const file of files) {
          try {
            const source = readFileSync(file, "utf-8");
            if (!isRunPass(source)) continue;
            const skipReason = shouldSkip(source);
            if (skipReason) { skipped++; continue; }
            testFiles.push({
              file,
              source,
              expectedOutput: parseExpectedOutput(file),
            });
          } catch { /* unreadable file */ }
        }
      };

      // Priority dirs first
      for (const d of PRIORITY_DIRS) {
        scanDir(join(uiDir, d));
      }
      // Then all other dirs
      const allSubdirs = (() => {
        try {
          return readdirSync(uiDir, { withFileTypes: true })
            .filter(e => e.isDirectory())
            .map(e => e.name);
        } catch { return []; }
      })();
      for (const d of allSubdirs) {
        scanDir(join(uiDir, d));
      }
      // Top-level .rs files
      const topFiles = walkFiles(uiDir, ".rs").filter(
        f => basename(f) === f.replace(uiDir + "/", "").replace(/\//g, "")
      );
      // Actually just re-scan without recursion for top-level
      try {
        const entries = readdirSync(uiDir).filter(f => f.endsWith(".rs"));
        for (const file of entries) {
          const fullPath = join(uiDir, file);
          try {
            const source = readFileSync(fullPath, "utf-8");
            if (!isRunPass(source)) continue;
            const skipReason = shouldSkip(source);
            if (skipReason) { skipped++; continue; }
            testFiles.push({ file: fullPath, source });
          } catch {}
        }
      } catch {}
    }

    // Source 2: Miri tests/pass/
    if (cfg.include_miri) {
      const miriDir = join(dataDir, "miri");
      const miriResult = await ensureRepo(cfg.miri_repo, miriDir, ["tests/pass"]);
      if (miriResult.ok) {
        const miriPassDir = join(miriDir, "tests/pass");
        if (existsSync(miriPassDir)) {
          const files = walkFiles(miriPassDir, ".rs");
          for (const file of files) {
            try {
              const source = readFileSync(file, "utf-8");
              const skipReason = shouldSkip(source);
              if (skipReason) { skipped++; continue; }
              // Miri pass tests are all run-pass by definition
              testFiles.push({ file, source });
            } catch {}
          }
        }
      }
    }

    console.log(`\n    ${testFiles.length} tests discovered, ${skipped} skipped (${cfg.concurrency} parallel)`);

    if (testFiles.length === 0) {
      return empty(start, "No run-pass tests found");
    }

    // Run tests
    let done = 0;
    const tasks = testFiles.map(({ file, expectedOutput }) => async () => {
      const label = file.includes("rustc/tests/ui/")
        ? `rustc/${relative(join(rustcDir, "tests/ui"), file)}`
        : file.includes("miri/tests/pass/")
          ? `miri/${relative(join(dataDir, "miri/tests/pass"), file)}`
          : basename(file);

      // Compile
      const compile = await compileRustToBrick(
        file, ctx.pluginsDir, cfg.target, cfg.timeout_ms,
      );

      done++;
      if (done % 50 === 0) {
        process.stdout.write(`    ... ${done}/${testFiles.length} (${failures.length} failed)\n`);
      }

      if (!compile.pass) {
        try { rmSync(compile.tmpDir, { recursive: true, force: true }); } catch {}
        return { name: label, pass: false, message: compile.message || "compile failed" };
      }

      // Run
      try {
        const run = await spawnCapture(runtime, ["run", compile.brickDir], {
          timeout: cfg.timeout_ms,
          env: { LLY_INTERNAL: "1" },
        });

        if (run.timedOut) {
          return { name: label, pass: false, message: "timeout" };
        }

        if (run.code !== 0) {
          return {
            name: label,
            pass: false,
            message: `exit ${run.code}\n${run.stderr.slice(-300)}`,
          };
        }

        // Check expected output if present
        if (expectedOutput !== undefined) {
          const actual = run.stdout;
          if (actual.trim() !== expectedOutput.trim()) {
            return {
              name: label,
              pass: false,
              message: `output mismatch:\n  expected: ${expectedOutput.slice(0, 150)}\n  got:      ${actual.slice(0, 150)}`,
            };
          }
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
      id: "rust-runpass",
      label: "Rust Run-Pass",
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
    id: "rust-runpass",
    label: "Rust Run-Pass",
    passed: 0, failed: 0, skipped: 0,
    duration_ms: Date.now() - start, failures: [], error,
  };
}

