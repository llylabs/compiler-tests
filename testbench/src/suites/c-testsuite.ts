import { readFileSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js";
import { walkFiles, runWithConcurrency } from "../utils.js";
import { ensureRepo } from "../repo.js";
import { compileAndRun } from "../compile-run.js";

interface Config {
  repo: string;
  data_dir: string;
  concurrency: number;
}

export const runner: Runner = {
  async run(config, ctx): Promise<SuiteResult> {
    const { repo, data_dir, concurrency } = config as unknown as Config;
    const start = Date.now();

    const cloneDir = join(ctx.testsDir, "..", data_dir);
    const repoResult = await ensureRepo(repo, cloneDir);
    if (!repoResult.ok) {
      return empty("c-testsuite", "C Testsuite", start, repoResult.error);
    }

    const testsDir = join(cloneDir, "tests", "single-exec");
    const allFiles = walkFiles(testsDir, ".c");

    // Filter: only tests with .expected files.
    // NOTE: 'needs-cpp' tag in c-testsuite means "Test relies on the C preprocessor"
    // (per upstream README), NOT "needs C++". Tests with that tag are valid C and
    // must run. Audit per M8 Phase 5: 98/220 were previously skipped under that
    // misreading — Kategorie C (fälschlicherweise geskippt). Filter removed.
    let skipped = 0;
    const runnable: { file: string; expected: string }[] = [];
    for (const f of allFiles) {
      const expectedPath = f + ".expected";
      if (!existsSync(expectedPath)) { skipped++; continue; }
      runnable.push({ file: f, expected: readFileSync(expectedPath, "utf-8") });
    }

    console.log(`\n    ${runnable.length} tests, ${skipped} skipped (${concurrency} parallel)`);

    let passed = 0;
    let failed = 0;
    let done = 0;
    const failures: CaseFailure[] = [];

    const tasks = runnable.map(({ file, expected }) => async () => {
      const result = await compileAndRun(file, ctx.pluginsDir, ctx.includePath);
      done++;
      if (done % 50 === 0) process.stdout.write(`    ... ${done}/${runnable.length} (${failed} failed)\n`);

      if (!result.pass) {
        return { name: relative(testsDir, file), pass: false, message: result.message || "compile/run failed" };
      }

      const stdout = result.stdout || "";
      if (stdout === expected) {
        return { name: "", pass: true, message: "" };
      } else {
        return {
          name: relative(testsDir, file),
          pass: false,
          message: `output mismatch\nexpected: ${expected.slice(0, 100)}\ngot: ${stdout.slice(0, 100)}`,
        };
      }
    });

    const results = await runWithConcurrency(tasks, concurrency);
    for (const r of results) {
      if (r.pass) passed++;
      else { failed++; failures.push({ name: r.name, message: r.message }); }
    }

    return {
      id: "c-testsuite", label: "C Testsuite",
      passed, failed, skipped,
      duration_ms: Date.now() - start, failures,
    };
  },
};

function empty(id: string, label: string, start: number, error?: string): SuiteResult {
  return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error };
}
