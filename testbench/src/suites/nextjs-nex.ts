/**
 * Next.js NEX-Native Suite
 *
 * Tests Next.js patterns (pages, layouts, API routes, components) rendered
 * directly with `nex run` — no Next.js build step required.
 *
 * Each .tsx/.ts file in tests/nextjs-nex/ is a standalone test that imports
 * React and Next.js shims, renders components, and validates the output.
 */

import fs from "fs"
import path from "path"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { spawnCapture, stripNexHeaders, parseExpectContains, runWithConcurrency, nexRunArgs } from "../utils.js"

interface NextjsNexConfig {
  tests_dir: string
  concurrency: number
  timeout_ms?: number
}

async function runTest(
  file: string,
  nexBinary: string,
  timeoutMs: number,
  cap?: string,
  llyBinary?: string,
  jsPlugin?: string,
): Promise<{ pass: boolean; message?: string }> {
  const source = fs.readFileSync(file, "utf-8")
  const expects = parseExpectContains(source)

  // Prefer the new pipeline: `nex-frontend-js compile --source X --output X.brick`
  // followed by `lly run X.brick`. This routes through the machineroom
  // bundler (which provides the next/server, next/link, next/image shims),
  // unlike the legacy `nex run <file>` which uses a stale embedded bundler.
  // Fall back to `nex run` when either component is missing.
  let result
  const canUseLly = llyBinary && jsPlugin && fs.existsSync(llyBinary) && fs.existsSync(jsPlugin)
  if (canUseLly) {
    const brick = file.replace(/\.tsx?$/, ".brick")
    const compileRes = await spawnCapture(jsPlugin!, ["compile", "--source", file, "--output", brick], { timeout: timeoutMs })
    if (compileRes.code !== 0) {
      const msg = compileRes.stderr.trim().split("\n").slice(-3).join(" | ") || `compile exit code ${compileRes.code}`
      return { pass: false, message: "compile failed: " + msg }
    }
    result = await spawnCapture(llyBinary!, ["run", brick], { timeout: timeoutMs })
  } else {
    result = await spawnCapture(nexBinary, nexRunArgs(file, cap), { timeout: timeoutMs })
  }

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

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const { tests_dir, concurrency, timeout_ms = 15_000 } = config as unknown as NextjsNexConfig

    const start = Date.now()
    const id = "nextjs-nex"
    const label = "Next.js NEX-Native"

    if (!fs.existsSync(ctx.nexBinary)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: 0, failures: [], error: `nex binary not found: ${ctx.nexBinary}` }
    }

    // tests_dir is relative to benchDir (parent of ctx.testsDir which is "<bench>/tests")
    const benchDir = path.dirname(ctx.testsDir)
    const testsDir = path.resolve(benchDir, tests_dir)
    if (!fs.existsSync(testsDir)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: `tests_dir not found: ${testsDir}` }
    }

    const files = fs.readdirSync(testsDir)
      .filter(f => (f.endsWith(".ts") || f.endsWith(".tsx")) && !f.endsWith(".d.ts") && !f.startsWith("._"))
      .sort()
      .map(f => path.join(testsDir, f))

    console.log(`  ${files.length} tests (${concurrency} parallel)...`)

    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []

    // Locate the JS-frontend plugin for the new pipeline.
    const jsPluginCandidates = [
      `${process.env.HOME}/.lly/plugins/js/nex-frontend-js`,
      "/home/leon/prod/machineroom/target/release/nex-frontend-js",
    ]
    const jsPlugin = jsPluginCandidates.find(p => fs.existsSync(p))

    const tasks = files.map(file => async () => {
      const result = await runTest(file, ctx.nexBinary, timeout_ms, ctx.cap, ctx.llyBinary, jsPlugin)
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
