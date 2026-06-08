import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js";
import { walkFiles, runWithConcurrency } from "../utils.js";
import { ensureRepo } from "../repo.js";
import { compileAndRun } from "../compile-run.js";
import { parseDgSimple } from "../dg-parser.js";

interface Config {
  repo: string;
  data_dir: string;
  sparse_paths: string[];
  concurrency: number;
}

export const runner: Runner = {
  async run(config, ctx): Promise<SuiteResult> {
    const { repo, data_dir, sparse_paths, concurrency } = config as unknown as Config;
    const start = Date.now();

    const cloneDir = join(ctx.testsDir, "..", data_dir);
    const repoResult = await ensureRepo(repo, cloneDir, sparse_paths);
    if (!repoResult.ok) {
      return empty(start, repoResult.error);
    }

    const executeDir = join(cloneDir, "gcc/testsuite/gcc.c-torture/execute");
    const allFiles = walkFiles(executeDir, ".c");

    let skipped = 0;
    const runnable: { file: string; outputPattern?: RegExp }[] = [];
    for (const f of allFiles) {
      const src = readFileSync(f, "utf-8");
      const meta = parseDgSimple(src);
      if (meta.action === "skip") { skipped++; continue; }
      if (meta.action === "compile") { skipped++; continue; }
      runnable.push({ file: f, outputPattern: meta.outputPattern });
    }

    console.log(`\n    ${runnable.length} tests, ${skipped} skipped (${concurrency} parallel)`);

    let passed = 0;
    let failed = 0;
    let done = 0;
    const failures: CaseFailure[] = [];

    const tasks = runnable.map(({ file, outputPattern }) => async () => {
      const result = await compileAndRun(file, ctx.pluginsDir, ctx.includePath);
      done++;
      if (done % 100 === 0) process.stdout.write(`    ... ${done}/${runnable.length} (${failed} failed)\n`);

      if (!result.pass) {
        return { name: relative(executeDir, file), pass: false, message: result.message || "failed" };
      }

      if (outputPattern) {
        const stdout = result.stdout || "";
        if (!outputPattern.test(stdout)) {
          return {
            name: relative(executeDir, file),
            pass: false,
            message: `dg-output mismatch: /${outputPattern.source}/\ngot: ${stdout.slice(0, 150)}`,
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
      id: "gcc-torture", label: "GCC C Torture",
      passed, failed, skipped,
      duration_ms: Date.now() - start, failures,
    };
  },
};

function empty(start: number, error?: string): SuiteResult {
  return { id: "gcc-torture", label: "GCC C Torture", passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error };
}
