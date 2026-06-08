/**
 * Go test/-directory suite.
 *
 * Source: https://github.com/golang/go (sparse-checkout `test/`)
 *
 * Each test file declares its action via the first non-build-constraint
 * comment line:
 *   // run            — compile + execute, exit 0 (or stdout matches .out file)
 *   // compile        — compile only, must succeed
 *   // errorcheck     — compile must fail with `// ERROR "regex"` matches
 *   // build          — compile package, must succeed
 *   // skip           — explicitly skip
 *   // rundir/runoutput/errorcheckoutput — multi-file or generated, skipped here
 *
 * This runner handles `// run` and `// compile` only (the highest-yield subset
 * that maps cleanly to single-file `.go` → wasm32-wasip1 compile-and-run).
 *
 * The Go toolchain compiles directly to wasip1 via `GOOS=wasip1 GOARCH=wasm
 * go build`. The resulting `.wasm` is wrapped into a minimal brick if the
 * NEX go-frontend plugin (`nexc-go`) is not yet available — same fallback
 * pattern as `rust-runpass.ts`.
 */
import { join, relative, basename, dirname } from "node:path";
import {
  readFileSync,
  readdirSync,
  existsSync,
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js";
import { spawnCapture, walkFiles, runWithConcurrency } from "../utils.js";
import { ensureRepo } from "../repo.js";

interface Config {
  go_repo: string;
  data_dir: string;
  concurrency: number;
  timeout_ms: number;
  include_subdirs: string[];
  max_tests: number; // 0 = unlimited
}

const DEFAULTS: Config = {
  go_repo: "https://github.com/golang/go",
  data_dir: ".data/go",
  concurrency: 16,
  timeout_ms: 60_000,
  // High-yield subdirs: pure-language tests with low syscall pressure
  include_subdirs: [
    "fixedbugs",
    "interface",
    "typeparam",
    "ken",
    "chan",
    "method",
    "closure",
    "convert",
    "nilptr",
    "stack",
    "syntax",
  ],
  max_tests: 0,
};

// ---------------------------------------------------------------------------
// Test discovery & filtering
// ---------------------------------------------------------------------------

interface ParsedHeader {
  action: "run" | "compile" | "errorcheck" | "build" | "skip" | "rundir" |
          "runoutput" | "errorcheckoutput" | "compiledir" | "errorcheckdir" |
          "unknown";
  raw: string;
}

/** Parse the first action directive from the file head (skipping //go:build / +build). */
function parseHeader(source: string): ParsedHeader {
  const lines = source.split("\n").slice(0, 30);
  for (const line of lines) {
    const t = line.trim();
    if (t === "" || t.startsWith("//go:build") || t.startsWith("// +build")) continue;
    if (!t.startsWith("//")) break;
    const body = t.slice(2).trim();
    const head = body.split(/\s+/)[0];
    if (
      head === "run" || head === "compile" || head === "errorcheck" ||
      head === "build" || head === "skip" || head === "rundir" ||
      head === "runoutput" || head === "errorcheckoutput" ||
      head === "compiledir" || head === "errorcheckdir"
    ) {
      return { action: head, raw: t };
    }
    // Stop at first non-directive comment
    break;
  }
  return { action: "unknown", raw: "" };
}

/** Patterns that make a test wasip1-incompatible. */
const SKIP_IMPORTS = [
  '"unsafe"',         // pointer-cast tests are arch-specific
  '"runtime"',        // runtime introspection
  '"syscall"',        // raw syscalls
  '"os/exec"',        // process spawning
  '"net"',            // sockets — gated by capability anyway
  '"plugin"',         // dynamic loading
  '"reflect"',        // mostly fine but many tests depend on host arch
  '"debug/',          // debug information
  '"runtime/debug"',
  '"runtime/cgo"',
  '"runtime/race"',
];

function shouldSkipBySource(source: string): string | null {
  // Quick imports bail-out
  for (const pat of SKIP_IMPORTS) {
    if (source.includes(pat)) {
      // Allow "unsafe" if it's the only stdlib touched — these tests still often work
      if (pat === '"unsafe"') continue;
      if (pat === '"reflect"') continue;
      return `imports ${pat}`;
    }
  }
  // Build-tags that indicate non-wasi target
  if (/\/\/go:build .*\b(amd64|arm64|386|arm|mips|s390x|riscv64)\b/.test(source)) {
    if (!/\/\/go:build .*\bwasm\b/.test(source)) {
      return "arch-specific build tag";
    }
  }
  if (source.includes("//go:build !wasm") || source.includes("// +build !wasm")) {
    return "explicitly !wasm";
  }
  return null;
}

/** If a `.out` file exists next to the test, that's the expected stdout. */
function parseExpectedOutput(testFile: string): string | undefined {
  const outFile = testFile.replace(/\.go$/, ".out");
  if (existsSync(outFile)) {
    return readFileSync(outFile, "utf-8");
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Compilation
// ---------------------------------------------------------------------------

async function compileGoToBrick(
  sourceFile: string,
  pluginsDir: string,
  timeout: number,
): Promise<{ pass: boolean; brickDir: string; tmpDir: string; wasmFile: string; message?: string }> {
  const name = basename(sourceFile, ".go");
  const tmpDir = mkdtempSync(join(tmpdir(), `nex-go-${name}-`));
  const brickDir = join(tmpDir, `${name}.brick`);
  const wasmFile = join(tmpDir, `${name}.wasm`);

  // Step 1: go build → wasm32-wasip1
  // Note: requires Go 1.21+ for wasip1 target.
  const goBuild = await spawnCapture(
    "go",
    ["build", "-o", wasmFile, sourceFile],
    {
      timeout,
      env: {
        GOOS: "wasip1",
        GOARCH: "wasm",
        // Hermetic: no module fetching for single-file tests
        GOFLAGS: "-mod=mod",
        GOCACHE: join(tmpDir, "gocache"),
        GOMODCACHE: join(tmpDir, "modcache"),
      },
    },
  );

  if (goBuild.code !== 0) {
    return {
      pass: false, brickDir, tmpDir, wasmFile,
      message: `go build failed: ${goBuild.stderr.slice(-500)}`,
    };
  }

  // Step 2: NEX go-frontend (when implemented), else minimal-brick fallback
  const nexcGo = join(pluginsDir, "go-compiler");
  if (existsSync(nexcGo)) {
    const compile = await spawnCapture(nexcGo, [
      "compile", "--source", sourceFile, "--output", brickDir,
    ], { timeout, env: { LLY_INTERNAL: "1" } });
    if (compile.code !== 0) {
      return {
        pass: false, brickDir, tmpDir, wasmFile,
        message: `nexc-go failed: ${compile.stderr.slice(-500)}`,
      };
    }
  } else {
    if (!existsSync(wasmFile)) {
      return { pass: false, brickDir, tmpDir, wasmFile, message: "wasm file not produced" };
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
  }

  return { pass: true, brickDir, tmpDir, wasmFile };
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

    // Check go is available + supports wasip1
    const goCheck = await spawnCapture("go", ["version"], { timeout: 10_000 });
    if (goCheck.code !== 0) {
      return empty(start, "go not found in PATH (install Go 1.21+ with wasip1 support)");
    }
    // Probe wasip1 target via tool-list
    const distList = await spawnCapture("go", ["tool", "dist", "list"], { timeout: 10_000 });
    if (!distList.stdout.includes("wasip1/wasm")) {
      return empty(start, `go toolchain does not support wasip1/wasm (need Go 1.21+); got: ${goCheck.stdout.trim()}`);
    }

    // Clone go repo (sparse — only test/)
    const dataDir = join(ctx.testsDir, "..", cfg.data_dir);
    const goDir = join(dataDir, "go");
    const goRepo = await ensureRepo(cfg.go_repo, goDir, ["test"]);
    if (!goRepo.ok) {
      return empty(start, `failed to clone golang/go: ${goRepo.error}`);
    }

    const testRoot = join(goDir, "test");
    if (!existsSync(testRoot)) {
      return empty(start, "test/ not found after clone");
    }

    // Collect candidates: top-level + each include_subdirs
    const candidates: string[] = [];
    try {
      for (const f of readdirSync(testRoot)) {
        if (f.endsWith(".go")) candidates.push(join(testRoot, f));
      }
    } catch {}
    for (const sub of cfg.include_subdirs) {
      const dir = join(testRoot, sub);
      if (!existsSync(dir)) continue;
      candidates.push(...walkFiles(dir, ".go"));
    }

    // Classify
    const tests: { file: string; action: "run" | "compile"; expected?: string }[] = [];
    for (const file of candidates) {
      let source: string;
      try { source = readFileSync(file, "utf-8"); }
      catch { continue; }

      const header = parseHeader(source);

      // Only run + compile actions in v1
      if (header.action === "run") {
        const skip = shouldSkipBySource(source);
        if (skip) { skipped++; continue; }
        tests.push({ file, action: "run", expected: parseExpectedOutput(file) });
      } else if (header.action === "compile") {
        const skip = shouldSkipBySource(source);
        if (skip) { skipped++; continue; }
        tests.push({ file, action: "compile" });
      } else if (header.action === "skip") {
        skipped++;
      } else {
        // errorcheck/rundir/runoutput/etc — not supported in v1
        skipped++;
      }
    }

    const limit = cfg.max_tests > 0 ? Math.min(cfg.max_tests, tests.length) : tests.length;
    const slice = tests.slice(0, limit);

    console.log(`\n    ${slice.length} go tests selected (${skipped} skipped, ${cfg.concurrency} parallel)`);

    if (slice.length === 0) {
      return empty(start, "no compatible go tests found");
    }

    let done = 0;
    const tasks = slice.map(({ file, action, expected }) => async () => {
      const label = `go/${relative(testRoot, file)} [${action}]`;
      const compile = await compileGoToBrick(file, ctx.pluginsDir, cfg.timeout_ms);

      done++;
      if (done % 50 === 0) {
        process.stdout.write(`    ... ${done}/${slice.length} (${failures.length} failed)\n`);
      }

      if (!compile.pass) {
        try { rmSync(compile.tmpDir, { recursive: true, force: true }); } catch {}
        return { name: label, pass: false, message: compile.message || "compile failed" };
      }

      // For compile-only tests: success = compilation produced a wasm
      if (action === "compile") {
        try { rmSync(compile.tmpDir, { recursive: true, force: true }); } catch {}
        return { name: label, pass: true, message: "" };
      }

      // run: execute and check exit-code (+ optional .out match)
      try {
        const run = await spawnCapture(runtime, ["run", compile.brickDir], {
          timeout: cfg.timeout_ms,
          env: { LLY_INTERNAL: "1" },
        });

        if (run.timedOut) return { name: label, pass: false, message: "timeout" };
        if (run.code !== 0) {
          return {
            name: label, pass: false,
            message: `exit ${run.code}\n${run.stderr.slice(-300)}`,
          };
        }
        if (expected !== undefined) {
          if (run.stdout.trim() !== expected.trim()) {
            return {
              name: label, pass: false,
              message: `output mismatch:\n  expected: ${expected.slice(0, 150)}\n  got:      ${run.stdout.slice(0, 150)}`,
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
      id: "go-testdir",
      label: "Go test/ (golang/go)",
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
    id: "go-testdir",
    label: "Go test/ (golang/go)",
    passed: 0, failed: 0, skipped: 0,
    duration_ms: Date.now() - start, failures: [], error,
  };
}
