/**
 * E2E Deploy Suite
 *
 * Tests the full lifecycle:
 *   1. Compile & run locally → verify output
 *   2. Deploy to Cap OS → service starts
 *   3. Probe endpoints repeatedly over a duration
 *   4. Verify status, body, stability (no crashes over time)
 *   5. Cleanup: stop service
 *
 * Test files use directive comments:
 *   // @local-run            — also test locally before deploying (optional)
 *   // @port: 8090           — service port
 *   // @probe: GET /path     — endpoint to test
 *   // @expect-status: 200
 *   // @expect-body-contains: some text
 *   // @probe-count: 10      — how many times to probe (default 5)
 *   // @probe-interval: 2000 — ms between probes (default 1000)
 *   // @probe: POST /path    — additional endpoint (multiple allowed)
 *   // @post-body: {"key":"value"}  — body for POST probe
 *   // @expect-status: 200
 *   // @expect-body-contains: result
 *   // @timeout: 60000       — deploy timeout in ms (default 60000)
 *   // @language: js          — js, ts, c, cpp (default: auto from extension)
 */

import fs from "fs"
import path from "path"
import * as http from "http"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { spawnCapture, findFreePort, waitForPort, stripNexHeaders, nexRunArgs } from "../utils.js"

// ── Directive Parsing ─────────────────────────────────────────────────────

interface ProbeSpec {
  method: string
  path: string
  postBody?: string
  expectStatus: number
  expectBodyContains: string[]
}

interface TestSpec {
  file: string
  name: string
  localRun: boolean
  port: number
  probes: ProbeSpec[]
  probeCount: number
  probeInterval: number
  timeout: number
}

function parseTestFile(filePath: string): TestSpec {
  const source = fs.readFileSync(filePath, "utf-8")
  const lines = source.split("\n")

  let localRun = false
  let port = 8080
  let probeCount = 5
  let probeInterval = 1000
  let timeout = 60_000

  const probes: ProbeSpec[] = []
  let currentProbe: ProbeSpec | null = null

  function flushProbe() {
    if (currentProbe) probes.push(currentProbe)
    currentProbe = null
  }

  for (const line of lines) {
    const localMatch = line.match(/\/\/\s*@local-run/)
    if (localMatch) { localRun = true; continue }

    const portMatch = line.match(/\/\/\s*@port:\s*(\d+)/)
    if (portMatch) { port = parseInt(portMatch[1]); continue }

    const probeMatch = line.match(/\/\/\s*@probe:\s*(GET|POST|PUT|DELETE|PATCH)\s+(.+)/)
    if (probeMatch) {
      flushProbe()
      currentProbe = {
        method: probeMatch[1],
        path: probeMatch[2].trim(),
        expectStatus: 200,
        expectBodyContains: [],
      }
      continue
    }

    const postBodyMatch = line.match(/\/\/\s*@post-body:\s*(.+)/)
    if (postBodyMatch && currentProbe) {
      currentProbe.postBody = postBodyMatch[1].trim()
      continue
    }

    const statusMatch = line.match(/\/\/\s*@expect-status:\s*(\d+)/)
    if (statusMatch && currentProbe) {
      currentProbe.expectStatus = parseInt(statusMatch[1])
      continue
    }

    const bodyMatch = line.match(/\/\/\s*@expect-body-contains:\s*(.+)/)
    if (bodyMatch && currentProbe) {
      currentProbe.expectBodyContains.push(bodyMatch[1].trim())
      continue
    }

    const countMatch = line.match(/\/\/\s*@probe-count:\s*(\d+)/)
    if (countMatch) { probeCount = parseInt(countMatch[1]); continue }

    const intervalMatch = line.match(/\/\/\s*@probe-interval:\s*(\d+)/)
    if (intervalMatch) { probeInterval = parseInt(intervalMatch[1]); continue }

    const timeoutMatch = line.match(/\/\/\s*@timeout:\s*(\d+)/)
    if (timeoutMatch) { timeout = parseInt(timeoutMatch[1]); continue }
  }

  flushProbe()

  return {
    file: filePath,
    name: path.basename(filePath),
    localRun,
    port,
    probes,
    probeCount,
    probeInterval,
    timeout,
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────

function httpRequest(
  url: string,
  method: string,
  body?: string,
  timeoutMs: number = 10_000,
): Promise<{ status: number; body: string; latencyMs: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const timer = setTimeout(() => reject(new Error(`HTTP ${method} ${url} timed out (${timeoutMs}ms)`)), timeoutMs)
    const parsed = new URL(url)

    const options: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parseInt(parsed.port),
      path: parsed.pathname + parsed.search,
      method,
      headers: body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {},
    }

    const req = http.request(options, (res) => {
      let data = ""
      res.on("data", (d) => (data += d.toString()))
      res.on("end", () => {
        clearTimeout(timer)
        resolve({ status: res.statusCode ?? 0, body: data, latencyMs: Date.now() - start })
      })
    })

    req.on("error", (e) => {
      clearTimeout(timer)
      reject(e)
    })

    if (body) req.write(body)
    req.end()
  })
}

async function probeWithRetry(
  url: string,
  method: string,
  body?: string,
  retries: number = 15,
  delayMs: number = 1000,
): Promise<{ status: number; body: string; latencyMs: number }> {
  for (let i = 0; i < retries; i++) {
    try {
      return await httpRequest(url, method, body)
    } catch {
      if (i === retries - 1) throw new Error(`Service not reachable after ${retries} attempts: ${url}`)
      await sleep(delayMs)
    }
  }
  throw new Error("unreachable")
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Cap host resolution ───────────────────────────────────────────────────

async function getCapHost(capName: string): Promise<string> {
  const homedir = process.env.HOME ?? "/root"
  const configPath = path.join(homedir, ".nex", "caps.json")

  try {
    const content = fs.readFileSync(configPath, "utf-8")
    const config = JSON.parse(content)
    const cap = config.caps?.find((c: any) => c.name === capName)
    if (cap) return cap.host
  } catch {}

  throw new Error(`Cap '${capName}' not found in ~/.nex/caps.json`)
}

// ── Single test execution ─────────────────────────────────────────────────

interface TestResult {
  name: string
  passed: boolean
  message?: string
  phases: PhaseResult[]
}

interface PhaseResult {
  phase: string
  ok: boolean
  durationMs: number
  detail?: string
}

async function runSingleTest(
  spec: TestSpec,
  nexBinary: string,
  cap: string,
): Promise<TestResult> {
  const phases: PhaseResult[] = []
  const errors: string[] = []

  // ── Phase 1: Local run (optional) ──────────────────────────────────

  if (spec.localRun) {
    const phaseStart = Date.now()
    const port = await findFreePort()

    // Start locally
    const localProc = await spawnCapture(nexBinary, ["run", spec.file], {
      timeout: 15_000,
      env: { ...process.env, PORT: String(port) },
    })

    if (localProc.code !== 0 && !localProc.timedOut) {
      const msg = `local run failed (exit ${localProc.code}): ${localProc.stderr.trim().split("\n").slice(-3).join(" | ")}`
      phases.push({ phase: "local-run", ok: false, durationMs: Date.now() - phaseStart, detail: msg })
      return { name: spec.name, passed: false, message: msg, phases }
    }

    phases.push({ phase: "local-run", ok: true, durationMs: Date.now() - phaseStart })
  }

  // ── Phase 2: Deploy to Cap ─────────────────────────────────────────

  const deployStart = Date.now()
  const deployResult = await spawnCapture(
    nexBinary,
    ["deploy", spec.file, "--cap", cap],
    { timeout: spec.timeout },
  )

  if (deployResult.code !== 0) {
    const msg = `deploy failed (exit ${deployResult.code}): ${deployResult.stderr.trim().split("\n").slice(-3).join(" | ")}`
    phases.push({ phase: "deploy", ok: false, durationMs: Date.now() - deployStart, detail: msg })
    return { name: spec.name, passed: false, message: msg, phases }
  }

  // Extract service ID
  const allOutput = deployResult.stdout + deployResult.stderr
  const svcMatch = allOutput.match(/svc_\d+/)
  const serviceId = svcMatch ? svcMatch[0] : null

  phases.push({
    phase: "deploy",
    ok: true,
    durationMs: Date.now() - deployStart,
    detail: serviceId ? `service=${serviceId}` : "no service ID found",
  })

  // ── Phase 3: Initial probe (wait for service to be ready) ──────────

  let host: string
  try {
    host = await getCapHost(cap)
  } catch (e: any) {
    phases.push({ phase: "resolve-host", ok: false, durationMs: 0, detail: e.message })
    return { name: spec.name, passed: false, message: e.message, phases }
  }

  if (spec.probes.length === 0) {
    // No probes defined — just check deploy succeeded
    if (serviceId) {
      await spawnCapture(nexBinary, ["stop", "--cap", cap, serviceId], { timeout: 10_000 })
    }
    return { name: spec.name, passed: true, phases }
  }

  const firstProbe = spec.probes[0]
  const baseUrl = `http://${host}:${spec.port}`
  const initStart = Date.now()

  try {
    await probeWithRetry(
      `${baseUrl}${firstProbe.path}`,
      firstProbe.method,
      firstProbe.postBody,
    )
    phases.push({ phase: "service-ready", ok: true, durationMs: Date.now() - initStart })
  } catch (e: any) {
    phases.push({ phase: "service-ready", ok: false, durationMs: Date.now() - initStart, detail: e.message })
    if (serviceId) {
      await spawnCapture(nexBinary, ["stop", "--cap", cap, serviceId], { timeout: 10_000 })
    }
    return { name: spec.name, passed: false, message: `Service did not become ready: ${e.message}`, phases }
  }

  // ── Phase 4: Sustained probing ─────────────────────────────────────

  const sustainStart = Date.now()
  let totalRequests = 0
  let totalOk = 0
  let totalFailed = 0
  const latencies: number[] = []
  const probeErrors: string[] = []

  for (let round = 0; round < spec.probeCount; round++) {
    for (const probe of spec.probes) {
      const url = `${baseUrl}${probe.path}`
      totalRequests++

      try {
        const resp = await httpRequest(url, probe.method, probe.postBody)
        latencies.push(resp.latencyMs)

        const roundErrors: string[] = []

        if (resp.status !== probe.expectStatus) {
          roundErrors.push(`${probe.method} ${probe.path}: status ${resp.status} != ${probe.expectStatus}`)
        }

        for (const expected of probe.expectBodyContains) {
          if (!resp.body.includes(expected)) {
            roundErrors.push(`${probe.method} ${probe.path}: body missing "${expected}"`)
          }
        }

        if (roundErrors.length > 0) {
          totalFailed++
          probeErrors.push(`round ${round + 1}: ${roundErrors.join("; ")}`)
        } else {
          totalOk++
        }
      } catch (e: any) {
        totalFailed++
        probeErrors.push(`round ${round + 1}: ${probe.method} ${probe.path}: ${e.message}`)
      }
    }

    // Wait between rounds (except after last)
    if (round < spec.probeCount - 1) {
      await sleep(spec.probeInterval)
    }
  }

  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0

  const sustainDetail = [
    `${totalOk}/${totalRequests} ok`,
    `avg ${avgLatency}ms`,
    `max ${maxLatency}ms`,
    `over ${((Date.now() - sustainStart) / 1000).toFixed(1)}s`,
  ].join(", ")

  phases.push({
    phase: "sustained-probe",
    ok: totalFailed === 0,
    durationMs: Date.now() - sustainStart,
    detail: sustainDetail,
  })

  if (probeErrors.length > 0) {
    errors.push(...probeErrors.slice(0, 10))
  }

  // ── Phase 5: Cleanup ───────────────────────────────────────────────

  if (serviceId) {
    const stopStart = Date.now()
    const stopResult = await spawnCapture(
      nexBinary,
      ["stop", "--cap", cap, serviceId],
      { timeout: 10_000 },
    )
    phases.push({
      phase: "cleanup",
      ok: stopResult.code === 0,
      durationMs: Date.now() - stopStart,
      detail: stopResult.code !== 0 ? `stop failed (exit ${stopResult.code})` : undefined,
    })
  }

  // ── Result ─────────────────────────────────────────────────────────

  const passed = totalFailed === 0 && errors.length === 0
  const message = passed
    ? undefined
    : `${totalFailed}/${totalRequests} probes failed:\n${errors.join("\n")}`

  return { name: spec.name, passed, message, phases }
}

// ── Suite Runner ──────────────────────────────────────────────────────────

interface E2eDeployConfig {
  tests_dir: string
  concurrency?: number
  timeout_ms?: number
}

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const { tests_dir, concurrency = 2, timeout_ms = 90_000 } = config as unknown as E2eDeployConfig
    const start = Date.now()
    const id = "e2e-deploy"
    const label = "E2E Deploy (Local → Cap → Service)"

    // Require --cap flag
    if (!ctx.cap) {
      return {
        id, label,
        passed: 0, failed: 0, skipped: 0,
        duration_ms: 0, failures: [],
        error: "This suite requires --cap <name> (no cap target specified)",
      }
    }

    if (!fs.existsSync(ctx.nexBinary)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: 0, failures: [], error: `nex binary not found: ${ctx.nexBinary}` }
    }

    const testsDir = path.resolve(ctx.dataDir, tests_dir)
    if (!fs.existsSync(testsDir)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: `tests_dir not found: ${testsDir}` }
    }

    // Discover test files
    const extensions = [".js", ".ts", ".c", ".cpp", ".cc"]
    const files = fs.readdirSync(testsDir)
      .filter(f => extensions.some(ext => f.endsWith(ext)))
      .filter(f => !f.endsWith(".d.ts"))
      .sort()
      .map(f => path.join(testsDir, f))

    if (files.length === 0) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: "No test files found" }
    }

    // Parse all test specs
    const specs = files.map(f => parseTestFile(f))

    console.log(`  ${specs.length} tests (sequential deploy, ${ctx.cap})...`)

    let passed = 0
    let failed = 0
    let skipped = 0
    const failures: CaseFailure[] = []

    // Run tests sequentially — deploy tests are inherently sequential
    // (port conflicts, shared cap resources)
    for (const spec of specs) {
      if (spec.probes.length === 0 && !spec.localRun) {
        skipped++
        continue
      }

      process.stdout.write(`  ${spec.name}... `)

      const result = await runSingleTest(spec, ctx.nexBinary, ctx.cap)

      if (result.passed) {
        passed++
        const phaseInfo = result.phases.map(p => `${p.phase}:${p.durationMs}ms`).join(" → ")
        process.stdout.write(`✓ (${phaseInfo})\n`)
      } else {
        failed++
        failures.push({ name: spec.name, message: result.message ?? "failed" })
        const failPhase = result.phases.find(p => !p.ok)
        process.stdout.write(`✗ ${failPhase?.phase ?? "unknown"}: ${result.message?.split("\n")[0] ?? "failed"}\n`)
      }

      // Log phase details
      for (const phase of result.phases) {
        const icon = phase.ok ? "  ✓" : "  ✗"
        const detail = phase.detail ? ` — ${phase.detail}` : ""
        console.log(`    ${icon} ${phase.phase} (${phase.durationMs}ms)${detail}`)
      }
    }

    return { id, label, passed, failed, skipped, duration_ms: Date.now() - start, failures }
  },
}
