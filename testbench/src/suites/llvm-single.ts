import { readFileSync, existsSync } from "node:fs";
import { join, relative, basename, dirname } from "node:path";
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js";
import { walkFiles, runWithConcurrency } from "../utils.js";
import { ensureRepo } from "../repo.js";
import { compileAndRun, isCpp } from "../compile-run.js";

interface Config {
  repo: string;
  data_dir: string;
  concurrency: number;
}

function findReferenceOutput(file: string): string | undefined {
  // Try: <file>.reference_output then <basename without ext>.reference_output
  const exact = file + ".reference_output";
  if (existsSync(exact)) return readFileSync(exact, "utf-8");

  const dir = dirname(file);
  const base = basename(file).replace(/\.[^.]+$/, "");
  const alt = join(dir, base + ".reference_output");
  if (existsSync(alt)) return readFileSync(alt, "utf-8");

  return undefined;
}

export const runner: Runner = {
  async run(config, ctx): Promise<SuiteResult> {
    const { repo, data_dir, concurrency } = config as unknown as Config;
    const start = Date.now();

    const cloneDir = join(ctx.testsDir, "..", data_dir);
    const repoResult = await ensureRepo(repo, cloneDir, ["SingleSource"]);
    if (!repoResult.ok) {
      return empty(start, repoResult.error);
    }

    const srcDir = join(cloneDir, "SingleSource");
    const allFiles = [
      ...walkFiles(srcDir, ".c"),
      ...walkFiles(srcDir, ".cpp"),
      ...walkFiles(srcDir, ".cc"),
    ];

    // Filter out CMake files and test harness wrappers
    const runnable = allFiles.filter((f) => {
      const name = basename(f);
      if (name.startsWith("CMake")) return false;
      if (name.includes("_test_")) return false;
      return true;
    });

    console.log(`\n    ${runnable.length} tests (${concurrency} parallel)`);

    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let done = 0;
    const failures: CaseFailure[] = [];

    const tasks = runnable.map((file) => async () => {
      const result = await compileAndRun(file, ctx.pluginsDir, ctx.includePath, {
        includePaths: [dirname(file)],
      });
      done++;
      if (done % 100 === 0) process.stdout.write(`    ... ${done}/${runnable.length} (${failed} failed)\n`);

      if (!result.pass) {
        return { name: relative(srcDir, file), pass: false, message: result.message || "failed" };
      }

      // Check reference output if available
      const reference = findReferenceOutput(file);
      if (reference) {
        const stdout = result.stdout || "";
        // LLVM reference outputs often end with "exit 0\n"
        let expected = reference;
        let actual = stdout;
        // Normalize: strip trailing "exit 0" line from reference
        expected = expected.replace(/^exit 0\n$/m, "").trimEnd() + "\n";
        actual = actual.trimEnd() + "\n";
        if (actual !== expected) {
          return {
            name: relative(srcDir, file),
            pass: false,
            message: `output mismatch\nexpected: ${expected.slice(0, 120)}\ngot: ${actual.slice(0, 120)}`,
          };
        }
      }

      return { name: "", pass: true, message: "" };
    });

    const results = await runWithConcurrency(tasks, concurrency);
    for (const r of results) {
      if (r.pass) passed++;
      else { failed++; failures.push({ name: r.name, message: r.message }); }
    }

    return {
      id: "llvm-single", label: "LLVM SingleSource",
      passed, failed, skipped,
      duration_ms: Date.now() - start, failures,
    };
  },
};

function empty(start: number, error?: string): SuiteResult {
  return { id: "llvm-single", label: "LLVM SingleSource", passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error };
}
