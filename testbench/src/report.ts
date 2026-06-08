import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { SuiteResult } from "./runner.js";

export interface RunReport {
  timestamp: string;
  suites: SuiteResult[];
}

export interface HistoryEntry {
  timestamp: string;
  suites: {
    id: string;
    label: string;
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    pass_rate: number;
  }[];
}

export interface History {
  version: number;
  runs: HistoryEntry[];
}

export function writeReport(outputDir: string, report: RunReport): void {
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    join(outputDir, "report.json"),
    JSON.stringify(report, null, 2)
  );
}

export function writeSuiteLog(outputDir: string, result: SuiteResult): void {
  const lines: string[] = [];
  lines.push(`Suite:    ${result.label}`);
  lines.push(`ID:       ${result.id}`);
  lines.push(`Duration: ${(result.duration_ms / 1000).toFixed(1)}s`);
  lines.push("");
  lines.push(`Passed:  ${result.passed}`);
  lines.push(`Failed:  ${result.failed}`);
  lines.push(`Skipped: ${result.skipped}`);

  const total = result.passed + result.failed + result.skipped;
  const pct = total > 0 ? ((result.passed / total) * 100).toFixed(1) : "0.0";
  lines.push(`Total:   ${total}`);
  lines.push(`Pass %:  ${pct}%`);

  if (result.error) {
    lines.push("");
    lines.push(`ERROR: ${result.error}`);
  }

  if (result.failures.length > 0) {
    lines.push("");
    lines.push("─".repeat(60));
    lines.push(`FAILURES (${result.failures.length})`);
    lines.push("─".repeat(60));
    for (const f of result.failures) {
      lines.push("");
      lines.push(`FAIL  ${f.name}`);
      for (const line of f.message.split("\n")) {
        lines.push(`      ${line}`);
      }
    }
  }

  writeFileSync(join(outputDir, `${result.id}.log`), lines.join("\n") + "\n");
}

export function updateHistory(benchDir: string, report: RunReport): void {
  const historyPath = join(benchDir, "history.json");
  let history: History;

  if (existsSync(historyPath)) {
    try {
      history = JSON.parse(readFileSync(historyPath, "utf-8"));
    } catch {
      history = { version: 1, runs: [] };
    }
  } else {
    history = { version: 1, runs: [] };
  }

  const entry: HistoryEntry = {
    timestamp: report.timestamp,
    suites: report.suites.map((s) => {
      const total = s.passed + s.failed + s.skipped;
      return {
        id: s.id,
        label: s.label,
        passed: s.passed,
        failed: s.failed,
        skipped: s.skipped,
        total,
        pass_rate: total > 0 ? s.passed / total : 0,
      };
    }),
  };

  history.runs.push(entry);
  if (history.runs.length > 100) {
    history.runs = history.runs.slice(-100);
  }

  writeFileSync(historyPath, JSON.stringify(history, null, 2));
}
