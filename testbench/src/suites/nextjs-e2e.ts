/**
 * Next.js E2E Integration Suite
 *
 * Starts `nex next dev` on the test project, curls endpoints,
 * and validates responses against .expect files.
 *
 * This tests the full stack: JS Engine → React SSR → Routing → HTTP Server.
 *
 * Uses the same .expect file format as nextjs-compat:
 *   STATUS: 200
 *   CONTAINS: expected text
 *   NOT-CONTAINS: error text
 */

import fs from "fs"
import path from "path"
import { spawn, ChildProcess } from "child_process"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { findFreePort, waitForPort, parseExpectFile } from "../utils.js"

interface NextjsE2eConfig {
  tests_dir: string
  timeout_ms?: number
}

// ── Expect file loader (same pattern as nextjs-compat) ────────────────────

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
    .filter(f => f.endsWith(".expect") && !f.startsWith("._"))
    .map(f => {
      const base = f.replace(".expect", "")
      const [method, ...rest] = base.split("_")

      // Special: "robots.txt" → single segment with dot
      const urlPath = rest.length === 0 || (rest.length === 1 && rest[0] === "slash")
        ? "/"
        : "/" + rest.join("/")

      const content = fs.readFileSync(path.join(expectDir, f), "utf-8")
      return {
        file: f,
        method: method.toUpperCase(),
        urlPath,
        expect: parseExpectFile(content),
      }
    })
}

// ── Runner ────────────────────────────────────────────────────────────────

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const { tests_dir, timeout_ms = 30_000 } = config as unknown as NextjsE2eConfig

    const start = Date.now()
    const id = "nextjs-e2e"
    const label = "Next.js E2E Integration"

    // Prefer the new `lly nextjs dev` pipeline; fall back to legacy `nex next dev`.
    const useLly = fs.existsSync(ctx.llyBinary)
    const binary = useLly ? ctx.llyBinary : ctx.nexBinary
    const subcmd = useLly ? ["nextjs", "dev"] : ["next", "dev"]
    if (!fs.existsSync(binary)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: 0, failures: [], error: `binary not found: ${binary}` }
    }

    // tests_dir is relative to benchDir (parent of ctx.testsDir which is "<bench>/tests")
    const benchDir = path.dirname(ctx.testsDir)
    const projectDir = path.resolve(benchDir, tests_dir)
    if (!fs.existsSync(path.join(projectDir, "app"))) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: `app/ directory not found in ${projectDir}` }
    }

    const allExpects = loadExpects(projectDir)
    if (allExpects.length === 0) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: "No .expect files found" }
    }

    // BOOT-01: honor --pathFilter so workers can run a subset of fixtures
    // per task instead of the full ~200 endpoints every commit. Matches
    // the urlPath as a substring (case-sensitive).
    const expects = ctx.pathFilter
      ? allExpects.filter(e => e.urlPath.includes(ctx.pathFilter!) || e.file.includes(ctx.pathFilter!))
      : allExpects
    const skippedByFilter = allExpects.length - expects.length

    if (expects.length === 0) {
      return { id, label, passed: 0, failed: 0, skipped: skippedByFilter, duration_ms: Date.now() - start, failures: [], error: `No endpoints matched --pathFilter "${ctx.pathFilter}"` }
    }

    console.log(`  ${expects.length} endpoint tests${skippedByFilter ? ` (${skippedByFilter} filtered out)` : ""}...`)

    const port = await findFreePort()
    let proc: ChildProcess | null = null
    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []

    try {
      // Start `lly nextjs dev` (new) or fall back to `nex next dev` (legacy).
      proc = spawn(binary, [...subcmd, projectDir, "--port", String(port)], {
        stdio: ["ignore", "pipe", "pipe"],
      })

      // Wait for server to be ready
      const ready = await waitForPort(port, Math.min(timeout_ms, 15_000))
      if (!ready) {
        return {
          id, label, passed: 0, failed: expects.length, skipped: 0,
          duration_ms: Date.now() - start,
          failures: [{ name: "server-start", message: `Server did not start within 15s on port ${port}` }],
        }
      }

      // Test each endpoint
      for (const ep of expects) {
        const url = `http://127.0.0.1:${port}${ep.urlPath}`
        const testName = `${ep.method} ${ep.urlPath}`

        // Cold-cache full-suite runs occasionally trip node fetch's
        // socket-reuse path on `Connection: close` responses — retry up to
        // twice with a short backoff before declaring a hard failure.
        let res: Response | null = null
        let lastErr: any = null
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            res = await fetch(url, {
              method: ep.method,
              redirect: ep.expect.redirect ?? "follow",
              signal: AbortSignal.timeout(timeout_ms),
            })
            break
          } catch (e: any) {
            lastErr = e
            await new Promise((r) => setTimeout(r, 150 * (attempt + 1)))
          }
        }
        if (!res) {
          failed++
          failures.push({ name: testName, message: `fetch error: ${lastErr?.message ?? "unknown"}` })
          continue
        }

        const body = await res.text()
        const testFailures: string[] = []

        // Check status
        if (res.status !== ep.expect.status) {
          testFailures.push(`status ${res.status} ≠ ${ep.expect.status}`)
        }

        // Check CONTAINS
        for (const s of ep.expect.contains) {
          if (!body.includes(s)) {
            testFailures.push(`missing: ${JSON.stringify(s)}`)
          }
        }

        // Check NOT-CONTAINS
        for (const s of ep.expect.notContains) {
          if (body.includes(s)) {
            testFailures.push(`unexpected: ${JSON.stringify(s)}`)
          }
        }

        // Check HEADER assertions
        for (const h of ep.expect.headers) {
          const actual = res.headers.get(h.name)
          if (actual === null || !actual.toLowerCase().includes(h.value.toLowerCase())) {
            testFailures.push(`header ${h.name}: got ${JSON.stringify(actual)} expected to contain ${JSON.stringify(h.value)}`)
          }
        }

        if (testFailures.length === 0) {
          passed++
          process.stdout.write(`  ✓ ${testName}\n`)
        } else {
          failed++
          failures.push({ name: testName, message: testFailures.join(" | ") })
          process.stdout.write(`  ✗ ${testName}: ${testFailures[0]}\n`)
        }
      }
    } finally {
      proc?.kill()
    }

    // BOOT-01: emit a per-endpoint NDJSON sidecar so external tools
    // (tools/bench-quick.sh, baselines diff) can compare runs without
    // re-parsing the aggregate report.json.  One JSON object per line:
    //   {"endpoint":"/foo","method":"GET","status":"PASS"|"FAIL","detail":"…"}
    try {
      const ndjsonLines: string[] = []
      for (const ep of expects) {
        const failure = failures.find(f => f.name === `${ep.method} ${ep.urlPath}`)
        ndjsonLines.push(JSON.stringify({
          endpoint: ep.urlPath,
          method: ep.method,
          file: ep.file,
          status: failure ? "FAIL" : "PASS",
          detail: failure?.message ?? "",
        }))
      }
      const ndjsonOut = process.env.TESTBENCH_NDJSON_OUT
        ?? path.resolve(ctx.testsDir, "..", "output", "latest-nextjs-e2e.ndjson")
      fs.mkdirSync(path.dirname(ndjsonOut), { recursive: true })
      fs.writeFileSync(ndjsonOut, ndjsonLines.join("\n") + "\n")
    } catch (e) {
      // NDJSON emission is best-effort; never break the suite over it.
      console.error(`  (ndjson sidecar emission failed: ${(e as Error).message})`)
    }

    return { id, label, passed, failed, skipped: skippedByFilter, duration_ms: Date.now() - start, failures }
  },
}
