/**
 * React SSR Compatibility Suite
 *
 * Runs .ts test files from tests/react/ with `nex run`.
 * Each file uses React.createElement + renderToString and validates its own
 * output by throwing on failure (exit 1 = fail, exit 0 = pass).
 *
 * Optional stdout assertions via inline directive:
 *   // @expect-contains: <h1>Hello</h1>
 */

import fs from "fs"
import path from "path"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { spawnCapture, stripNexHeaders, parseExpectContains, runWithConcurrency, nexRunArgs } from "../utils.js"

interface ReactSsrConfig {
  tests_dir: string
  concurrency: number
  timeout_ms?: number
}

// ── npm install helper ────────────────────────────────────────────────────

async function ensureNpmInstall(dir: string): Promise<{ ok: boolean; error?: string }> {
  const pkgJson = path.join(dir, "package.json")
  const nodeModules = path.join(dir, "node_modules")

  if (!fs.existsSync(pkgJson)) return { ok: true } // no package.json, nothing to install
  if (fs.existsSync(nodeModules)) return { ok: true } // already installed

  process.stdout.write(`  Installing React dependencies... `)
  const result = await spawnCapture("npm", ["install", "--prefer-offline"], { cwd: dir, timeout: 120_000 })
  if (result.code !== 0) {
    console.log("✗")
    return { ok: false, error: `npm install failed: ${result.stderr.trim().slice(0, 200)}` }
  }
  console.log("✓")
  return { ok: true }
}

// ── Single test runner ────────────────────────────────────────────────────

async function runReactTest(
  file: string,
  nexBinary: string,
  timeoutMs: number,
  cap?: string,
): Promise<{ pass: boolean; message?: string }> {
  const source = fs.readFileSync(file, "utf-8")
  const expects = parseExpectContains(source)

  const result = await spawnCapture(nexBinary, nexRunArgs(file, cap), { timeout: timeoutMs })

  if (result.timedOut) return { pass: false, message: "timed out" }

  if (result.code !== 0) {
    const msg = result.stderr.trim().split("\n").slice(-3).join(" | ") || `exit code ${result.code}`
    return { pass: false, message: msg }
  }

  if (expects.length > 0) {
    const stdout = stripNexHeaders(result.stdout)
    for (const expected of expects) {
      if (!stdout.includes(expected)) {
        return {
          pass: false,
          message: `missing in stdout: ${JSON.stringify(expected)}\ngot: ${stdout.slice(0, 300)}`,
        }
      }
    }
  }

  return { pass: true }
}

// ── Runner ────────────────────────────────────────────────────────────────

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const { tests_dir, concurrency, timeout_ms = 15_000 } = config as unknown as ReactSsrConfig

    const start = Date.now()
    const id = "react-ssr"
    const label = "React SSR Compatibility"

    if (!fs.existsSync(ctx.nexBinary)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: 0, failures: [], error: `nex binary not found: ${ctx.nexBinary}` }
    }

    // tests_dir is relative to benchDir (parent of ctx.testsDir which is "<bench>/tests")
    const benchDir = path.dirname(ctx.testsDir)
    const testsDir = path.resolve(benchDir, tests_dir)
    if (!fs.existsSync(testsDir)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: `tests_dir not found: ${testsDir}` }
    }

    // npm install if package.json present
    const install = await ensureNpmInstall(testsDir)
    if (!install.ok) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: install.error }
    }

    // Discover all .ts test files (not .d.ts)
    const files = fs.readdirSync(testsDir)
      .filter(f => f.endsWith(".ts") && !f.endsWith(".d.ts") && !f.startsWith("._"))
      .sort()
      .map(f => path.join(testsDir, f))

    console.log(`  ${files.length} tests (${concurrency} parallel)...`)

    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []

    const tasks = files.map(file => async () => {
      const result = await runReactTest(file, ctx.nexBinary, timeout_ms, ctx.cap)
      return { file, result }
    })

    const results = await runWithConcurrency(tasks, concurrency)

    for (const { file, result } of results) {
      if (result.pass) {
        passed++
      } else {
        failed++
        failures.push({ name: path.basename(file), message: result.message ?? "failed" })
      }
    }

    return { id, label, passed, failed, skipped: 0, duration_ms: Date.now() - start, failures }
  },
}
