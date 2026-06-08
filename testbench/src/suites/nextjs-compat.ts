/**
 * Next.js Compatibility Suite
 *
 * Each subdirectory of tests/nextjs/ is a minimal Next.js project.
 * The runner:
 *   1. Runs `npm install` (once, cached) and `npm run build` (once, cached)
 *   2. Starts .next/standalone/server.js with `nex run`
 *   3. Polls until the HTTP server responds
 *   4. Fetches every endpoint described in expect/*.expect files
 *   5. Validates status + response body
 *   6. Kills the server
 *
 * .expect file format:
 *   STATUS: 200
 *   CONTAINS: <h1>Hello</h1>
 *   NOT-CONTAINS: error
 */

import fs from "fs"
import path from "path"
import { spawn, ChildProcess } from "child_process"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { findFreePort, waitForPort, parseExpectFile, spawnCapture } from "../utils.js"

interface NextjsCompatConfig {
  tests_dir: string
  timeout_ms?: number
  build_cache?: boolean
}

// ── Build helper ──────────────────────────────────────────────────────────

async function ensureBuild(projectDir: string): Promise<{ ok: boolean; error?: string }> {
  const serverJs = path.join(projectDir, ".next", "standalone", "server.js")

  // npm install
  if (!fs.existsSync(path.join(projectDir, "node_modules"))) {
    process.stdout.write("    npm install... ")
    const r = await spawnCapture("npm", ["install", "--prefer-offline"], {
      cwd: projectDir,
      timeout: 120_000,
    })
    if (r.code !== 0) {
      console.log("✗")
      return { ok: false, error: `npm install failed: ${r.stderr.slice(0, 200)}` }
    }
    console.log("✓")
  }

  // npm run build
  if (!fs.existsSync(serverJs)) {
    process.stdout.write("    npm run build... ")
    const r = await spawnCapture("npm", ["run", "build"], {
      cwd: projectDir,
      timeout: 180_000,
    })
    if (r.code !== 0) {
      console.log("✗")
      return { ok: false, error: `build failed: ${r.stderr.slice(0, 300)}` }
    }
    console.log("✓")
  }

  if (!fs.existsSync(serverJs)) {
    return { ok: false, error: "build succeeded but .next/standalone/server.js not found — add output: 'standalone' to next.config.js" }
  }

  return { ok: true }
}

// ── Expect files ──────────────────────────────────────────────────────────

interface EndpointExpect {
  file: string
  method: string
  urlPath: string
  expect: ReturnType<typeof parseExpectFile>
}

function loadExpects(projectDir: string): EndpointExpect[] {
  const expectDir = path.join(projectDir, "expect")
  if (!fs.existsSync(expectDir)) return []

  return fs.readdirSync(expectDir)
    .filter(f => f.endsWith(".expect"))
    .map(f => {
      // Filename: METHOD_segment1_segment2.expect  (segments become URL path parts)
      // Special segment "slash" → root /
      // e.g. GET_slash.expect        → GET /
      //      GET_api_health.expect   → GET /api/health
      //      GET_api_v2_users.expect → GET /api/v2/users
      const base = f.replace(".expect", "")
      const [method, ...rest] = base.split("_")
      const urlPath = rest.length === 0 || (rest.length === 1 && rest[0] === "slash")
        ? "/"
        : "/" + rest.join("/")

      const content = fs.readFileSync(path.join(expectDir, f), "utf-8")
      return {
        file: f,
        method: method.toUpperCase(),
        urlPath: urlPath.startsWith("/") ? urlPath : `/${urlPath}`,
        expect: parseExpectFile(content),
      }
    })
}

// ── Single project runner ─────────────────────────────────────────────────

async function runNextjsProject(
  projectDir: string,
  nexBinary: string,
  timeoutMs: number,
  llyBinary?: string,
): Promise<{ pass: boolean; failures: string[] }> {
  const serverJs = path.join(projectDir, ".next", "standalone", "server.js")
  const expects = loadExpects(projectDir)
  const failures: string[] = []
  const appDir = path.join(projectDir, "app")

  // Two modes:
  //   1. If `lly` is available AND the project has an app/ dir, run via
  //      `lly nextjs dev` (new pipeline). This is the canonical way to test
  //      Next.js compatibility against the lly compiler — it doesn't require
  //      the full @vercel/next standalone runtime.
  //   2. Else fall back to `nex run .next/standalone/server.js` (legacy).
  const useLly = llyBinary && fs.existsSync(llyBinary) && fs.existsSync(appDir)
  if (!useLly && !fs.existsSync(serverJs)) {
    return { pass: false, failures: [".next/standalone/server.js not found — run build first"] }
  }

  const port = await findFreePort()
  let proc: ChildProcess | null = null

  try {
    if (useLly) {
      proc = spawn(llyBinary!, ["nextjs", "dev", projectDir, "--port", String(port)], {
        stdio: ["ignore", "pipe", "pipe"],
      })
    } else {
      proc = spawn(nexBinary, ["run", serverJs], {
        env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1" },
        stdio: ["ignore", "pipe", "pipe"],
      })
    }

    // Wait for server to be ready
    const ready = await waitForPort(port, Math.min(timeoutMs, 15_000))
    if (!ready) {
      return { pass: false, failures: [`server did not start within 15s on port ${port}`] }
    }

    // No expect files → just check the server started
    if (expects.length === 0) {
      const res = await fetch(`http://127.0.0.1:${port}/`).catch(e => null)
      if (!res) return { pass: false, failures: ["server started but GET / failed"] }
      return { pass: true, failures: [] }
    }

    // Check each expected endpoint
    for (const ep of expects) {
      const url = `http://127.0.0.1:${port}${ep.urlPath}`
      let res: Response
      try {
        res = await fetch(url, { method: ep.method })
      } catch (e: any) {
        failures.push(`${ep.method} ${ep.urlPath}: fetch error: ${e.message}`)
        continue
      }

      const body = await res.text()

      if (res.status !== ep.expect.status) {
        failures.push(`${ep.method} ${ep.urlPath}: status ${res.status} ≠ ${ep.expect.status}`)
      }
      for (const s of ep.expect.contains) {
        if (!body.includes(s)) {
          failures.push(`${ep.method} ${ep.urlPath}: missing: ${JSON.stringify(s)}`)
        }
      }
      for (const s of ep.expect.notContains) {
        if (body.includes(s)) {
          failures.push(`${ep.method} ${ep.urlPath}: unexpected: ${JSON.stringify(s)}`)
        }
      }
    }
  } finally {
    proc?.kill()
  }

  return { pass: failures.length === 0, failures }
}

// ── Runner ────────────────────────────────────────────────────────────────

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const { tests_dir, timeout_ms = 30_000, build_cache = true } = config as unknown as NextjsCompatConfig

    const start = Date.now()
    const id = "nextjs-compat"
    const label = "Next.js Compatibility"

    if (!fs.existsSync(ctx.nexBinary)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: 0, failures: [], error: `nex binary not found: ${ctx.nexBinary}` }
    }

    // tests_dir is relative to benchDir (parent of ctx.testsDir which is "<bench>/tests")
    const benchDir = path.dirname(ctx.testsDir)
    const testsDir = path.resolve(benchDir, tests_dir)
    if (!fs.existsSync(testsDir)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: `tests_dir not found: ${testsDir}` }
    }

    // Each subdirectory is a Next.js project
    const projects = fs.readdirSync(testsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(e => path.join(testsDir, e.name))

    console.log(`  ${projects.length} projects...`)

    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []

    // Projects run sequentially (each uses a random port, but avoids resource contention)
    for (const projectDir of projects) {
      const name = path.basename(projectDir)
      process.stdout.write(`  ${name}... `)

      // Build step. Skip if we're going to use lly nextjs dev (the new
      // pipeline doesn't need a prebuilt .next/standalone bundle).
      const useLly = ctx.llyBinary && fs.existsSync(ctx.llyBinary) && fs.existsSync(path.join(projectDir, "app"))
      if (!useLly) {
        const build = await ensureBuild(projectDir)
        if (!build.ok) {
          console.log(`✗ build failed`)
          failed++
          failures.push({ name, message: build.error ?? "build failed" })
          continue
        }
      }

      // Run + check
      const result = await runNextjsProject(projectDir, ctx.nexBinary, timeout_ms, ctx.llyBinary)
      if (result.pass) {
        console.log("✓")
        passed++
      } else {
        console.log("✗")
        failed++
        failures.push({ name, message: result.failures.join(" | ") })
      }
    }

    return { id, label, passed, failed, skipped: 0, duration_ms: Date.now() - start, failures }
  },
}
