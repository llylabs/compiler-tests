/* M7 DoD-Suite: 6 Tests die belegen, dass die Rust- und Go-Frontends echt
 * arbeiten — rustc / go build → .wasm → nex-pack-brick → runtime → stdout-
 * Vergleich.
 *
 * Whitelist statt readdir, damit die Suite NUR die DoD-Tests fährt.
 *
 * Compile-Pfad: über die Bash-Wrapper tools/nex-rustc und tools/nex-go,
 * NICHT via c-compiler — Rust/Go skip'en die LLVM-IR-Pipeline.
 */
import { join, resolve } from "node:path";
import { readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import type { Runner, SuiteResult, CaseFailure } from "../runner.js";
import { spawnCapture } from "../utils.js";

const RUST_TESTS = ["m7_hello", "m7_vec_collect", "m7_iter_fold"];
const GO_TESTS   = ["m7_hello", "m7_goroutine_chan", "m7_slice_map"];

export const runner: Runner = {
  async run(_config, ctx): Promise<SuiteResult> {
    const failures: CaseFailure[] = [];
    let passed = 0;
    let skipped = 0;

    // tools/ lives at <repo-root>/tools — testsDir is <root>/bench/testbench/tests
    const repoRoot = resolve(ctx.testsDir, "..", "..", "..");
    const nexRustc = join(repoRoot, "tools", "nex-rustc");
    const nexGo    = join(repoRoot, "tools", "nex-go");
    const runtime  = join(ctx.pluginsDir, "runtime");

    if (!existsSync(runtime)) {
      return result(failures, passed, skipped, "runtime binary not found");
    }
    if (!existsSync(nexRustc)) {
      return result(failures, passed, skipped, `nex-rustc wrapper missing at ${nexRustc}`);
    }
    if (!existsSync(nexGo)) {
      return result(failures, passed, skipped, `nex-go wrapper missing at ${nexGo}`);
    }

    // Toolchain availability
    const rustcCheck = await spawnCapture("rustc", ["--version"], { timeout: 10_000 });
    if (rustcCheck.code !== 0) {
      return result(failures, passed, skipped, "rustc not found in PATH");
    }
    const goCheck = await spawnCapture("go", ["version"], { timeout: 10_000 });
    if (goCheck.code !== 0) {
      return result(failures, passed, skipped, "go not found in PATH");
    }

    // Rust DoD
    for (const name of RUST_TESTS) {
      const sourcePath   = join(ctx.testsDir, "rust", `${name}.rs`);
      const expectedPath = join(ctx.testsDir, "rust", `${name}.expected`);
      const r = await runOne(name, sourcePath, expectedPath, nexRustc, runtime, "rust");
      if (r.ok) passed++;
      else failures.push(...r.failures);
    }

    // Go DoD
    for (const name of GO_TESTS) {
      const sourcePath   = join(ctx.testsDir, "go", `${name}.go`);
      const expectedPath = join(ctx.testsDir, "go", `${name}.expected`);
      const r = await runOne(name, sourcePath, expectedPath, nexGo, runtime, "go");
      if (r.ok) passed++;
      else failures.push(...r.failures);
    }

    return result(failures, passed, skipped);
  },
};

interface OneResult {
  ok: boolean;
  failures: CaseFailure[];
}

async function runOne(
  name: string,
  sourcePath: string,
  expectedPath: string,
  wrapper: string,
  runtime: string,
  lang: "rust" | "go",
): Promise<OneResult> {
  const failures: CaseFailure[] = [];

  if (!existsSync(sourcePath) || !existsSync(expectedPath)) {
    failures.push({
      name: `${lang}/${name}: missing artifact`,
      message: `expected ${sourcePath} and ${expectedPath} to exist`,
    });
    return { ok: false, failures };
  }

  const expectedRaw = readFileSync(expectedPath, "utf-8");
  const tmpDir = join(tmpdir(), `lly-m7-${lang}-${name}-${Date.now()}`);
  const brickDir = join(tmpDir, `${name}.brick`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    // Compile via wrapper. nex-rustc takes <src> -o <brick>. nex-go takes
    // `build <src> -o <brick>`.
    const args = lang === "rust"
      ? [sourcePath, "-o", brickDir]
      : ["build", sourcePath, "-o", brickDir];

    const compile = await spawnCapture(wrapper, args, {
      timeout: 120_000,
      env: {},
    });

    if (compile.code !== 0) {
      failures.push({
        name: `${lang}/${name}: compile`,
        message: `wrapper exit ${compile.code}\nstderr: ${compile.stderr.slice(-400)}`,
      });
      return { ok: false, failures };
    }

    // Run
    const run = await spawnCapture(runtime, ["run", brickDir], {
      timeout: 30_000,
      env: { LLY_INTERNAL: "1" },
    });

    if (run.code !== 0 && run.code !== null) {
      failures.push({
        name: `${lang}/${name}: exit code`,
        message: `Expected exit 0, got ${run.code}\nstdout: ${run.stdout.slice(-300)}\nstderr: ${run.stderr.slice(-300)}`,
      });
      return { ok: false, failures };
    }

    if (run.stdout !== expectedRaw) {
      failures.push({
        name: `${lang}/${name}: output mismatch`,
        message: diffOutput(expectedRaw, run.stdout, run.stderr),
      });
      return { ok: false, failures };
    }
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  return { ok: true, failures };
}

function diffOutput(expected: string, actual: string, stderr: string): string {
  const expLines = expected.split("\n");
  const actLines = actual.split("\n");
  const lines: string[] = [];
  const max = Math.max(expLines.length, actLines.length);
  for (let i = 0; i < max && lines.length < 14; i++) {
    const e = expLines[i] ?? "<missing>";
    const a = actLines[i] ?? "<missing>";
    if (e !== a) {
      lines.push(`  line ${i + 1}:`);
      lines.push(`    expected: ${JSON.stringify(e)}`);
      lines.push(`    actual:   ${JSON.stringify(a)}`);
    }
  }
  if (stderr.trim().length > 0) {
    lines.push(`  stderr-tail: ${stderr.slice(-200)}`);
  }
  return lines.join("\n");
}

function result(
  failures: CaseFailure[],
  passed: number,
  skipped: number,
  error?: string,
): SuiteResult {
  return {
    id: "",
    label: "",
    passed,
    failed: failures.length,
    skipped,
    duration_ms: 0,
    failures,
    error,
  };
}
