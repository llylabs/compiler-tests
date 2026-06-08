import type { RunRecord, SuiteSnapshot } from "./history.js"

export interface CategoryChange {
  category: string
  prev: number
  curr: number
  delta: number
}

export interface SuiteDiff {
  id: string
  label: string
  prev_passed: number
  curr_passed: number
  delta_passed: number
  prev_pass_rate: number
  curr_pass_rate: number
  newly_fixed: string[]
  newly_broken: string[]
  category_changes: CategoryChange[]
}

export interface DiffResult {
  prev: RunRecord
  curr: RunRecord
  suites: SuiteDiff[]
  total_newly_fixed: number
  total_newly_broken: number
  has_regressions: boolean
}

export function diffRuns(prev: RunRecord, curr: RunRecord): DiffResult {
  const suites: SuiteDiff[] = []

  // Build lookup for previous suites
  const prevMap = new Map(prev.suites.map((s) => [s.id, s]))

  for (const currSuite of curr.suites) {
    const prevSuite = prevMap.get(currSuite.id)
    if (!prevSuite) continue

    // Test-level regression detection (only if both have full lists)
    let newly_fixed: string[] = []
    let newly_broken: string[] = []

    if (prevSuite.has_full_failure_list && currSuite.has_full_failure_list) {
      const prevFailing = new Set(prevSuite.failing_tests)
      const currFailing = new Set(currSuite.failing_tests)
      newly_fixed = prevSuite.failing_tests.filter((t) => !currFailing.has(t))
      newly_broken = currSuite.failing_tests.filter((t) => !prevFailing.has(t))
    }

    // Category-level changes
    const allCats = new Set([
      ...Object.keys(prevSuite.categories),
      ...Object.keys(currSuite.categories),
    ])
    const category_changes: CategoryChange[] = []
    for (const cat of allCats) {
      const p = prevSuite.categories[cat] ?? 0
      const c = currSuite.categories[cat] ?? 0
      if (p !== c) {
        category_changes.push({ category: cat, prev: p, curr: c, delta: c - p })
      }
    }
    category_changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

    suites.push({
      id: currSuite.id,
      label: currSuite.label,
      prev_passed: prevSuite.passed,
      curr_passed: currSuite.passed,
      delta_passed: currSuite.passed - prevSuite.passed,
      prev_pass_rate: prevSuite.pass_rate,
      curr_pass_rate: currSuite.pass_rate,
      newly_fixed,
      newly_broken,
      category_changes,
    })
  }

  const total_newly_fixed = suites.reduce((n, s) => n + s.newly_fixed.length, 0)
  const total_newly_broken = suites.reduce((n, s) => n + s.newly_broken.length, 0)

  return {
    prev,
    curr,
    suites,
    total_newly_fixed,
    total_newly_broken,
    has_regressions: total_newly_broken > 0,
  }
}
