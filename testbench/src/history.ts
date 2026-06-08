import fs from "fs"
import path from "path"

export type ErrorCategory = string

export interface CategoryMap {
  [category: ErrorCategory]: number
}

export interface SuiteSnapshot {
  id: string
  label: string
  passed: number
  failed: number
  skipped: number
  total: number
  pass_rate: number
  categories: CategoryMap
  failing_tests: string[]       // only populated for last 10 runs per suite
  has_full_failure_list: boolean
}

export interface RunRecord {
  timestamp: string
  nex_commit: string
  nex_binary: string
  output_dir: string
  target?: string          // "local" (default) or cap machine name
  suites: SuiteSnapshot[]
}

/** Returns the target for a RunRecord, defaulting to "local" for old records. */
export function getTarget(record: RunRecord): string {
  return record.target ?? "local"
}

/** Filter runs by target (backward-compatible: missing target = "local"). */
export function filterByTarget(runs: RunRecord[], target: string): RunRecord[] {
  return runs.filter((r) => getTarget(r) === target)
}

export interface HistoryFile {
  version: 1
  runs: RunRecord[]
}

const MAX_RUNS = 500
const MAX_RUNS_WITH_FULL_FAILURES = 10

export function readHistory(rootDir: string): HistoryFile {
  const p = path.join(rootDir, "history.json")
  if (!fs.existsSync(p)) return { version: 1, runs: [] }
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as HistoryFile
  } catch {
    return { version: 1, runs: [] }
  }
}

export function writeHistory(rootDir: string, history: HistoryFile): void {
  // Trim to max runs
  if (history.runs.length > MAX_RUNS) {
    history.runs = history.runs.slice(-MAX_RUNS)
  }

  // Only keep full failing_tests for last N runs per suite
  const allSuiteIds = new Set(history.runs.flatMap((r) => r.suites.map((s) => s.id)))
  for (const suiteId of allSuiteIds) {
    const runsWithSuite = history.runs.filter((r) => r.suites.find((s) => s.id === suiteId))
    runsWithSuite.slice(0, -MAX_RUNS_WITH_FULL_FAILURES).forEach((run) => {
      const suite = run.suites.find((s) => s.id === suiteId)
      if (suite && suite.has_full_failure_list) {
        suite.failing_tests = []
        suite.has_full_failure_list = false
      }
    })
  }

  const tmp = path.join(rootDir, ".history.json.tmp")
  fs.writeFileSync(tmp, JSON.stringify(history, null, 2))
  fs.renameSync(tmp, path.join(rootDir, "history.json"))
}
