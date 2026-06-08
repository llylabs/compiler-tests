import { join, basename } from "node:path";
import { readdirSync, readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import type { Runner, SuiteResult, CaseFailure } from "../runner.js";
import { spawnCapture } from "../utils.js";
import { validateBrick } from "../brick-validator.js";

export const runner: Runner = {
  async run(_config, ctx): Promise<SuiteResult> {
    const failures: CaseFailure[] = [];
    let passed = 0;
    let skipped = 0;

    const testsDir = join(ctx.testsDir, "c");
    const compiler = join(ctx.pluginsDir, "c-compiler");
    const runtime = join(ctx.pluginsDir, "runtime");

    if (!existsSync(compiler)) {
      return result(failures, passed, skipped, "c-compiler binary not found");
    }
    if (!existsSync(runtime)) {
      return result(failures, passed, skipped, "runtime binary not found");
    }

    const sources = readdirSync(testsDir).filter((f) => f.endsWith(".c")).sort();

    for (const file of sources) {
      const name = basename(file, ".c");
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

      const tmpDir = join(tmpdir(), `lly-test-c-${name}-${Date.now()}`);
      const brickDir = join(tmpDir, `${name}.brick`);
      mkdirSync(tmpDir, { recursive: true });

      try {
        // Phase 1: Compile
        const compileArgs = ["compile", "--source", sourcePath, "--output", brickDir];
        if (ctx.includePath) compileArgs.push("--include-path", ctx.includePath);
        const compile = await spawnCapture(compiler, compileArgs, {
          timeout: 60_000,
          env: { LLY_INTERNAL: "1", WASI_SDK_PATH: "", WASI_SYSROOT: "" },
        });

        if (compile.code !== 0) {
          failures.push({
            name: `${name}: compile`,
            message: compile.stderr.slice(-500),
          });
          continue;
        }
        passed++; // compile ok

        // Phase 2: Validate brick format
        const validation = validateBrick(brickDir);
        const formatFails = validation.checks.filter((c) => !c.ok);
        if (formatFails.length === 0) {
          passed++; // format ok
        } else {
          failures.push({
            name: `${name}: format`,
            message: formatFails.map((c) => `${c.name}: ${c.message}`).join("\n"),
          });
        }

        // Phase 3: Run
        // Runtime writes [EXECUTOR] lines to stderr, program output to stdout.
        // We compare stdout directly — no stripping. If runtime ever leaks
        // debug output to stdout, the test should FAIL to catch the regression.
        const run = await spawnCapture(runtime, [
          "run", brickDir,
        ], {
          timeout: 30_000,
          env: { LLY_INTERNAL: "1" },
        });

        if (expectExit) {
          // Exit code test: check code matches expected
          if (run.code === expectedExitCode) {
            passed++;
          } else {
            failures.push({
              name: `${name}: exit code`,
              message: `Expected exit ${expectedExitCode}, got ${run.code}\nstderr: ${run.stderr.slice(-200)}`,
            });
          }
          // Also verify no unexpected stdout
          if (run.stdout.length > 0) {
            failures.push({
              name: `${name}: unexpected stdout on exit-code test`,
              message: `Expected no output, got: ${run.stdout.slice(0, 200)}`,
            });
          }
        } else {
          // Output test: check exit code AND stdout
          if (run.code !== 0 && run.code !== null) {
            failures.push({
              name: `${name}: exit code`,
              message: `Expected exit 0, got ${run.code}\nstderr: ${run.stderr.slice(-300)}`,
            });
          } else {
            passed++; // exit 0 ok
          }
          if (run.stdout === expectedOutput) {
            passed++; // output matches
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
  if (lines.length === 0) {
    // Same lines but different (trailing whitespace, etc.)
    lines.push(`  expected bytes: ${Buffer.from(expected).toString("hex").slice(0, 80)}`);
    lines.push(`  actual bytes:   ${Buffer.from(actual).toString("hex").slice(0, 80)}`);
  }
  return lines.join("\n");
}

function result(
  failures: CaseFailure[],
  passed: number,
  skipped: number,
  error?: string
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
