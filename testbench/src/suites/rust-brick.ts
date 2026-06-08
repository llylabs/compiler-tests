/**
 * Rust Brick Compilation — local test suite.
 *
 * Mirrors c-brick.ts: compiles .rs files from tests/rust/,
 * validates brick format, and runs them.
 *
 * Each test needs a .rs source file and a .expected file.
 * .expected format:
 *   - "EXIT: <code>"  — check exit code only
 *   - Any other text   — check stdout matches exactly
 */
import { join, basename } from "node:path";
import {
  readdirSync,
  readFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import type { Runner, SuiteResult, CaseFailure } from "../runner.js";
import { spawnCapture } from "../utils.js";
import { validateBrick } from "../brick-validator.js";

export const runner: Runner = {
  async run(_config, ctx): Promise<SuiteResult> {
    const failures: CaseFailure[] = [];
    let passed = 0;
    let skipped = 0;

    const testsDir = join(ctx.testsDir, "rust");
    const runtime = join(ctx.pluginsDir, "runtime");

    if (!existsSync(testsDir)) {
      return result(failures, passed, skipped, `tests/rust/ directory not found (${testsDir})`);
    }
    if (!existsSync(runtime)) {
      return result(failures, passed, skipped, "runtime binary not found");
    }

    // Check rustc is available
    const rustcCheck = await spawnCapture("rustc", ["--version"], { timeout: 10_000 });
    if (rustcCheck.code !== 0) {
      return result(failures, passed, skipped, "rustc not found in PATH");
    }

    const sources = readdirSync(testsDir).filter((f) => f.endsWith(".rs")).sort();

    for (const file of sources) {
      const name = basename(file, ".rs");
      const sourcePath = join(testsDir, file);
      const expectedPath = join(testsDir, `${name}.expected`);

      if (!existsSync(expectedPath)) {
        skipped++;
        continue;
      }

      const expectedRaw = readFileSync(expectedPath, "utf-8");
      const expectExit = expectedRaw.startsWith("EXIT:");
      const expectedExitCode = expectExit
        ? parseInt(expectedRaw.split(":")[1].trim(), 10)
        : 0;
      const expectedOutput = expectExit ? "" : expectedRaw;

      const tmpDir = mkdtempSync(join(tmpdir(), `nex-rust-brick-${name}-`));
      const brickDir = join(tmpDir, `${name}.brick`);
      const wasmFile = join(tmpDir, `${name}.wasm`);

      try {
        // Phase 1: Compile Rust → WASM via rustc
        const rustc = await spawnCapture("rustc", [
          "--edition=2021",
          "--target=wasm32-wasip1",
          "--crate-type=bin",
          "-C", "opt-level=2",
          "-C", "panic=abort",
          "-C", "link-args=--export-all",
          "-C", "link-args=--allow-undefined",
          "-o", wasmFile,
          sourcePath,
        ], { timeout: 60_000 });

        if (rustc.code !== 0) {
          failures.push({
            name: `${name}: rustc`,
            message: rustc.stderr.slice(-500),
          });
          continue;
        }

        // Phase 1b: Try NEX rust-compiler if available
        const nexRustCompiler = join(ctx.pluginsDir, "rust-compiler");
        if (existsSync(nexRustCompiler)) {
          const compile = await spawnCapture(nexRustCompiler, [
            "compile", "--source", sourcePath, "--output", brickDir,
          ], {
            timeout: 60_000,
            env: { LLY_INTERNAL: "1" },
          });
          if (compile.code !== 0) {
            failures.push({
              name: `${name}: nexc`,
              message: compile.stderr.slice(-500),
            });
            continue;
          }
        } else {
          // Fallback: wrap raw WASM into brick
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

        passed++; // compile ok

        // Phase 2: Validate brick format
        const validation = validateBrick(brickDir);
        const formatFails = validation.checks.filter((c) => !c.ok);
        if (formatFails.length === 0) {
          passed++;
        } else {
          failures.push({
            name: `${name}: format`,
            message: formatFails.map((c) => `${c.name}: ${c.message}`).join("\n"),
          });
        }

        // Phase 3: Run
        const run = await spawnCapture(runtime, ["run", brickDir], {
          timeout: 30_000,
          env: { LLY_INTERNAL: "1" },
        });

        if (expectExit) {
          if (run.code === expectedExitCode) {
            passed++;
          } else {
            failures.push({
              name: `${name}: exit code`,
              message: `Expected exit ${expectedExitCode}, got ${run.code}\nstderr: ${run.stderr.slice(-200)}`,
            });
          }
        } else {
          if (run.code !== 0 && run.code !== null) {
            failures.push({
              name: `${name}: exit code`,
              message: `Expected exit 0, got ${run.code}\nstderr: ${run.stderr.slice(-300)}`,
            });
          } else {
            passed++;
          }
          if (run.stdout === expectedOutput) {
            passed++;
          } else {
            failures.push({
              name: `${name}: output mismatch`,
              message: diffOutput(expectedOutput, run.stdout),
            });
          }
        }
      } finally {
        try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      }
    }

    return result(failures, passed, skipped);
  },
};

function diffOutput(expected: string, actual: string): string {
  const expLines = expected.split("\n");
  const actLines = actual.split("\n");
  const lines: string[] = [];
  const max = Math.max(expLines.length, actLines.length);
  for (let i = 0; i < max && lines.length < 10; i++) {
    const e = expLines[i] ?? "<missing>";
    const a = actLines[i] ?? "<missing>";
    if (e !== a) {
      lines.push(`  line ${i + 1}:`);
      lines.push(`    expected: ${JSON.stringify(e)}`);
      lines.push(`    actual:   ${JSON.stringify(a)}`);
    }
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
