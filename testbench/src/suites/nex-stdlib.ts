/**
 * NEX Standard Library Test Suite
 *
 * Targeted tests for C/C++ standard library functions implemented
 * in the NEX runtime. Each test verifies a specific libc/libstdc++
 * function or group of functions.
 *
 * Test format matches brick-splitting: inline directives
 *   // @expect-exit: 0
 *   // @expect-contains: expected output
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface NexStdlibConfig {
  concurrency: number
  timeout_ms?: number
}

function parseDirectives(source: string): { expectExit: number; expectContains: string[] } {
  let expectExit = 0
  const expectContains: string[] = []

  for (const line of source.split("\n")) {
    const exitMatch = line.match(/@expect-exit:\s*(\d+)/)
    if (exitMatch) expectExit = parseInt(exitMatch[1])

    const containsMatch = line.match(/@expect-contains:\s*(.+)/)
    if (containsMatch) expectContains.push(containsMatch[1].trim())
  }

  return { expectExit, expectContains }
}

function stripNexOutput(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => {
      const t = line.trim()
      if (!t) return false
      if (/NEX (Compile|Runtime)/.test(t)) return false
      if (/^[─═]/.test(t)) return false
      if (/^(Source|Language|Output|Bundle|Bricks|Built|Loaded|Entrypoint|Exit):/.test(t)) return false
      if (/^Compiling/.test(t)) return false
      return true
    })
    .join("\n")
    .trim()
}

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const { concurrency = 8, timeout_ms = 30_000 } = config as unknown as NexStdlibConfig
    const start = Date.now()
    const id = "nex-stdlib"
    const label = "NEX Standard Library"

    const testsDir = path.resolve(path.dirname(path.dirname(__dirname)), "tests", "nex-stdlib")

    if (!fs.existsSync(testsDir)) {
      return {
        id, label, passed: 0, failed: 0, skipped: 0,
        duration_ms: Date.now() - start, failures: [],
        error: `Tests directory not found: ${testsDir}`,
      }
    }

    const files = fs.readdirSync(testsDir)
      .filter((f) => f.endsWith(".c") || f.endsWith(".cpp"))
      .sort()
      .map((f) => path.join(testsDir, f))

    console.log(`  ${files.length} tests (${concurrency} parallel)...`)

    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []

    const { spawnCapture, nexRunArgs } = await import("../utils.js")

    const tasks = files.map((file) => async () => {
      const source = fs.readFileSync(file, "utf-8")
      const { expectExit, expectContains } = parseDirectives(source)

      const extra: string[] = []
      if (ctx.includePath) extra.push("-I", ctx.includePath)
      const result = await spawnCapture(ctx.nexBinary, nexRunArgs(file, ctx.cap, extra), {
        timeout: timeout_ms,
      })

      const name = path.basename(file)

      if (result.timedOut) {
        return { name, pass: false, message: `timed out (${timeout_ms / 1000}s)` }
      }

      if (result.code !== expectExit) {
        const stderr = result.stderr.trim().split("\n").slice(-3).join(" | ")
        return {
          name,
          pass: false,
          message: `exit ${result.code} (expected ${expectExit}): ${stderr}`,
        }
      }

      const stdout = stripNexOutput(result.stdout)

      for (const expected of expectContains) {
        if (!stdout.includes(expected)) {
          return {
            name,
            pass: false,
            message: `output missing "${expected}", got: ${stdout.slice(0, 200)}`,
          }
        }
      }

      return { name, pass: true, message: undefined as string | undefined }
    })

    // Run with concurrency
    const { runWithConcurrency } = await import("../utils.js")
    const results = await runWithConcurrency(tasks, concurrency)

    for (const r of results) {
      if (r.pass) {
        passed++
      } else {
        failed++
        failures.push({ name: r.name, message: r.message ?? "failed" })
      }
    }

    return {
      id, label, passed, failed, skipped: 0,
      duration_ms: Date.now() - start, failures,
    }
  },
}
