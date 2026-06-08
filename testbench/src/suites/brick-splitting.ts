/**
 * Brick Splitting Test Suite
 *
 * Tests the NEX static compiler's brick partitioning system.
 * Each test verifies that a C program compiles, executes correctly,
 * and produces the expected output — regardless of how the compiler
 * partitions the code into bricks.
 *
 * Tests cover: recursion, mutual recursion, shared globals, function
 * pointers, struct operations, deep call chains, callbacks, and more.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface BrickSplittingConfig {
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
    const { concurrency = 8, timeout_ms = 30_000 } = config as unknown as BrickSplittingConfig
    const start = Date.now()
    const id = "brick-splitting"
    const label = "Brick Splitting"

    // Tests live alongside the testbench
    const testsDir = path.resolve(path.dirname(path.dirname(__dirname)), "tests", "brick-splitting")

    if (!fs.existsSync(testsDir)) {
      return {
        id, label, passed: 0, failed: 0, skipped: 0,
        duration_ms: Date.now() - start, failures: [],
        error: `Tests directory not found: ${testsDir}`,
      }
    }

    const files = fs.readdirSync(testsDir)
      .filter((f) => f.endsWith(".c"))
      .sort()
      .map((f) => path.join(testsDir, f))

    console.log(`  ${files.length} tests (${concurrency} parallel)...`)

    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []

    // Import spawnCapture dynamically
    const { spawnCapture, nexRunArgs } = await import("../utils.js")

    const tasks = files.map((file) => async () => {
      const source = fs.readFileSync(file, "utf-8")
      const { expectExit, expectContains } = parseDirectives(source)

      const result = await spawnCapture(ctx.nexBinary, nexRunArgs(file, ctx.cap), {
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

    // Run sequentially for predictability (these are fast)
    for (const task of tasks) {
      const { name, pass, message } = await task()
      if (pass) {
        passed++
      } else {
        failed++
        failures.push({ name, message: message ?? "failed" })
      }
    }

    return {
      id, label, passed, failed, skipped: 0,
      duration_ms: Date.now() - start, failures,
    }
  },
}
