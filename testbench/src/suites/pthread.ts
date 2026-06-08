/* M6 DoD-Suite: 7 Threading-Tests die belegen, dass pthread/* echt arbeitet
 * (nicht stub'd) und dass Phase-0-Cleanup (alarm/priority/rlimit) ehrlich ist.
 *
 * Architektur 1:1 wie c-brick — compile via c-compiler, run via runtime,
 * stdout-Vergleich gegen .expected. Kein eigener Brick-Validator (das macht
 * c-brick schon flächendeckend).
 *
 * Whitelist statt readdir, damit die Suite NUR die DoD-Tests fährt und nicht
 * versehentlich grün wird, weil andere Tests in tests/c/ auch grün sind.
 */
import { join, basename } from "node:path";
import { readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import type { Runner, SuiteResult, CaseFailure } from "../runner.js";
import { spawnCapture } from "../utils.js";

const DOD_TESTS = [
  "alarm_honest",
  "priority_honest",
  "rlimit_roundtrip",
  "pthread_basic",
  "pthread_once",
  "pthread_tls",
  "pthread_prodcons",
];

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

    for (const name of DOD_TESTS) {
      const sourcePath = join(testsDir, `${name}.c`);
      const expectedPath = join(testsDir, `${name}.expected`);

      if (!existsSync(sourcePath) || !existsSync(expectedPath)) {
        failures.push({
          name: `${name}: missing test artifact`,
          message: `expected ${sourcePath} and ${expectedPath} to exist`,
        });
        continue;
      }

      const expectedRaw = readFileSync(expectedPath, "utf-8");
      const expectExit = expectedRaw.startsWith("EXIT:");
      const expectedExitCode = expectExit
        ? parseInt(expectedRaw.split(":")[1].trim(), 10)
        : 0;
      const expectedOutput = expectExit ? "" : expectedRaw;

      const tmpDir = join(tmpdir(), `lly-m6-${name}-${Date.now()}`);
      const brickDir = join(tmpDir, `${name}.brick`);
      mkdirSync(tmpDir, { recursive: true });

      try {
        // Compile
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

        // Run
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
              message: `Expected exit ${expectedExitCode}, got ${run.code}\nstdout: ${run.stdout.slice(-200)}\nstderr: ${run.stderr.slice(-200)}`,
            });
          }
        } else {
          if (run.code !== 0 && run.code !== null) {
            failures.push({
              name: `${name}: exit code`,
              message: `Expected exit 0, got ${run.code}\nstdout: ${run.stdout.slice(-300)}\nstderr: ${run.stderr.slice(-300)}`,
            });
            continue;
          }
          if (run.stdout === expectedOutput) {
            passed++;
          } else {
            failures.push({
              name: `${name}: output mismatch`,
              message: diffOutput(expectedOutput, run.stdout, run.stderr),
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
