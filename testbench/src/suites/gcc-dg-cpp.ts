import { readFileSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js";
import { walkFiles, runWithConcurrency } from "../utils.js";
import { ensureRepo } from "../repo.js";
import { compileAndRun } from "../compile-run.js";
import { shouldRunCpp, CPP_SKIP_DIRS, parseDgOutputCpp } from "../dg-parser.js";

interface Config {
  data_dir: string;
  concurrency: number;
}

export const runner: Runner = {
  async run(config, ctx): Promise<SuiteResult> {
    const { data_dir, concurrency } = config as unknown as Config;
    const start = Date.now();

    const cloneDir = join(ctx.testsDir, "..", data_dir);
    const dgPath = "gcc/testsuite/g++.dg";

    const repoResult = await ensureRepo(
      "https://github.com/gcc-mirror/gcc",
      cloneDir,
      ["gcc/testsuite/gcc.c-torture", "gcc/testsuite/gcc.dg", dgPath]
    );
    if (!repoResult.ok) {
      return empty(start, repoResult.error);
    }

    const dgDir = join(cloneDir, dgPath);
    const testsuiteDir = join(cloneDir, "gcc/testsuite");
    const allFiles = [
      ...walkFiles(dgDir, ".C"),
      ...walkFiles(dgDir, ".cc"),
      ...walkFiles(dgDir, ".cpp"),
    ];

    let skipped = 0;
    const runnable: string[] = [];
    for (const f of allFiles) {
      // Skip directories with WASM-unsupported features
      const relDir = relative(dgDir, f).split(sep)[0];
      if (CPP_SKIP_DIRS.has(relDir)) { skipped++; continue; }

      const src = readFileSync(f, "utf-8");
      if (shouldRunCpp(src)) runnable.push(f);
      else skipped++;
    }

    console.log(`\n    ${runnable.length} tests, ${skipped} skipped (${concurrency} parallel)`);

    let passed = 0;
    let failed = 0;
    let done = 0;
    const failures: CaseFailure[] = [];

    const tasks = runnable.map((file) => async () => {
      const src = readFileSync(file, "utf-8");
      const outPattern = parseDgOutputCpp(src);

      const result = await compileAndRun(file, ctx.pluginsDir, ctx.includePath, {
        includePaths: [dirname(file), dgDir, testsuiteDir],
        timeout: 90_000,
      });
      done++;
      if (done % 200 === 0) process.stdout.write(`    ... ${done}/${runnable.length} (${failed} failed)\n`);

      if (!result.pass) {
        return { name: relative(dgDir, file), pass: false, message: result.message || "failed" };
      }

      if (outPattern) {
        const stdout = result.stdout || "";
        if (!outPattern.test(stdout)) {
          return {
            name: relative(dgDir, file),
            pass: false,
            message: `dg-output mismatch: /${outPattern.source}/\ngot: ${stdout.slice(0, 150)}`,
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
      id: "gcc-dg-cpp", label: "GCC C++ Diagnostics",
      passed, failed, skipped,
      duration_ms: Date.now() - start, failures,
    };
  },
};

function empty(start: number, error?: string): SuiteResult {
  return { id: "gcc-dg-cpp", label: "GCC C++ Diagnostics", passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error };
}
