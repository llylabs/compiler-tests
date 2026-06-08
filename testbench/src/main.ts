import { resolve, dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { runSuite, type SuiteResult } from "./runner.js";
import { writeReport, writeSuiteLog, updateHistory } from "./report.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const benchDir = resolve(__dirname, "..");

// ── CLI Args ───────────────────────────────────────────────
const args = process.argv.slice(2);
let configPath = resolve(benchDir, "testbench.json");
let suiteFilter: string | undefined;
let pathFilter: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--config" && args[i + 1]) {
    configPath = resolve(args[++i]);
  } else if (args[i] === "--suite" && args[i + 1]) {
    suiteFilter = args[++i];
  } else if ((args[i] === "--pathFilter" || args[i] === "--filter") && args[i + 1]) {
    // BOOT-01: --filter is the short alias for --pathFilter; lets Worker
    // sessions run `bench-quick.sh nextjs-e2e --filter use-action-state`
    // to skip the other ~200 fixtures during per-task iteration.
    pathFilter = args[++i];
  }
}

// ── Load Config ────────────────────────────────────────────
const config = loadConfig(configPath);
let suites = config.suites;
if (suiteFilter) {
  suites = suites.filter((s) => s.id === suiteFilter);
  if (suites.length === 0) {
    console.error(`Suite not found: ${suiteFilter}`);
    console.error(`Available: ${config.suites.map((s) => s.id).join(", ")}`);
    process.exit(1);
  }
}

// ── Output Dir ─────────────────────────────────────────────
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outputDir = resolve(benchDir, "output", timestamp);
mkdirSync(outputDir, { recursive: true });

// ── Run ────────────────────────────────────────────────────
console.log("");
console.log("  LLY Testbench");
console.log("  " + "=".repeat(50));
console.log("");

const ctx = {
  pluginsDir: config.plugins_dir,
  testsDir: config.tests_dir,
  includePath: config.include_path,
  nexBinary: config.nex ?? "nex",
  llyBinary: (config as any).lly ?? process.env.LLY_BIN ?? `${process.env.HOME}/.local/bin/lly`,
  dataDir: config.data_dir ?? resolve(benchDir, ".data"),
  pathFilter,
};

const results: SuiteResult[] = [];
let totalPassed = 0;
let totalFailed = 0;

for (let i = 0; i < suites.length; i++) {
  const suite = suites[i];
  const tag = `[${i + 1}/${suites.length}]`;

  process.stdout.write(`  ${tag} ${suite.label}...`);

  // Per-Suite nex-Binary-Override (z.B. JS-Suiten brauchen oldies-nex
  // mit JS-Backend statt machineroom). Override über suite.nex oder
  // suite.config.nex.
  const suiteNex = (suite as any).nex ?? (suite as any).config?.nex;
  const suiteCtx = suiteNex ? { ...ctx, nexBinary: suiteNex } : ctx;

  const result = await runSuite(suite, suiteCtx);

  results.push(result);
  writeSuiteLog(outputDir, result);

  totalPassed += result.passed;
  totalFailed += result.failed;

  if (result.error) {
    console.log(` ERROR: ${result.error}`);
  } else if (result.failed === 0) {
    console.log(` ${result.passed} passed${result.skipped ? `, ${result.skipped} skipped` : ""}`);
  } else {
    console.log(` ${result.passed} passed, ${result.failed} FAILED`);
  }
}

// ── Report ─────────────────────────────────────────────────
const report = { timestamp: new Date().toISOString(), suites: results };
writeReport(outputDir, report);
updateHistory(benchDir, report);

// ── Summary ────────────────────────────────────────────────
console.log("");
console.log("  " + "=".repeat(50));
console.log("  REPORT");
console.log("  " + "-".repeat(50));

for (const r of results) {
  const total = r.passed + r.failed + r.skipped;
  const pct = total > 0 ? ((r.passed / total) * 100).toFixed(0) : "0";
  const status = r.error ? "ERR" : r.failed === 0 ? " OK" : "FAIL";
  const skip = r.skipped > 0 ? `, ${r.skipped} skipped` : "";
  console.log(
    `  ${status}  ${r.label.padEnd(30)} ${r.passed}/${total} (${pct}%${skip})`
  );
}

console.log("  " + "-".repeat(50));
console.log(`  Total: ${totalPassed} passed, ${totalFailed} failed`);
console.log(`  Output: ${outputDir}`);
console.log("");

// ── Print failures ─────────────────────────────────────────
const allFailures = results.flatMap((r) =>
  r.failures.map((f) => ({ suite: r.label, ...f }))
);
if (allFailures.length > 0) {
  console.log("  FAILURES:");
  for (const f of allFailures) {
    console.log(`    [${f.suite}] ${f.name}`);
    console.log(`      ${f.message.split("\n")[0]}`);
  }
  console.log("");
}

process.exit(totalFailed > 0 || results.some((r) => r.error) ? 1 : 0);
