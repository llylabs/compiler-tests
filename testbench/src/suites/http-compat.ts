/**
 * Node.js HTTP / API Compatibility Suite
 *
 * Runs .ts test files from tests/node-compat/ with `nex run`.
 * Each test file is self-contained: it starts its own HTTP server,
 * makes a request, asserts the response, and exits 0 on success or
 * throws (exit 1) on failure.
 *
 * The runner injects the PORT env var so tests can pick up a free port.
 * Tests should read: const port = parseInt(process.env.PORT ?? '3000')
 */

import fs from "fs"
import path from "path"
import { spawn } from "child_process"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { findFreePort, runWithConcurrency, spawnCapture, nexRunArgs } from "../utils.js"

interface HttpCompatConfig {
  tests_dir: string
  concurrency: number
  timeout_ms?: number
}

async function runHttpTest(
  file: string,
  nexBinary: string,
  timeoutMs: number,
  cap?: string,
): Promise<{ pass: boolean; message?: string }> {
  const port = await findFreePort()

  const result = await spawnCapture(nexBinary, nexRunArgs(file, cap), {
    timeout: timeoutMs,
    env: { ...process.env, PORT: String(port) },
  })

  if (result.timedOut) return { pass: false, message: "timed out" }

  if (result.code !== 0) {
    const msg = result.stderr.trim().split("\n").slice(-3).join(" | ") || `exit code ${result.code}`
    return { pass: false, message: msg }
  }

  return { pass: true }
}

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const { tests_dir, concurrency, timeout_ms = 20_000 } = config as unknown as HttpCompatConfig

    const start = Date.now()
    const id = "http-compat"
    const label = "Node.js HTTP Compatibility"

    if (!fs.existsSync(ctx.nexBinary)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: 0, failures: [], error: `nex binary not found: ${ctx.nexBinary}` }
    }

    const testsDir = path.resolve(ctx.dataDir, tests_dir)
    if (!fs.existsSync(testsDir)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: `tests_dir not found: ${testsDir}` }
    }

    const files = fs.readdirSync(testsDir)
      .filter(f => f.endsWith(".ts") && !f.endsWith(".d.ts"))
      .sort()
      .map(f => path.join(testsDir, f))

    console.log(`  ${files.length} tests (${concurrency} parallel)...`)

    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []

    const tasks = files.map(file => async () => {
      const result = await runHttpTest(file, ctx.nexBinary, timeout_ms, ctx.cap)
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
