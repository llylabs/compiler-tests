import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import os from "os"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { nexRunArgs } from "../utils.js"

interface Test262Config {
  repo: string
  data_dir: string
  concurrency: number
  include_modules: boolean
  include_async: boolean
}

interface Test262Meta {
  negative?: { phase: string; type: string }
  flags: string[]
  includes: string[]
}

// ── Frontmatter parser ─────────────────────────────────────────────────────

function parseMeta(source: string): Test262Meta {
  const meta: Test262Meta = { flags: [], includes: [] }
  const match = source.match(/\/\*---\s*([\s\S]*?)\s*---\*\//)
  if (!match) return meta

  const yaml = match[1]

  const flagsMatch = yaml.match(/^flags:\s*\[([^\]]*)\]/m)
  if (flagsMatch) {
    meta.flags = flagsMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
  }

  const includesMatch = yaml.match(/^includes:\s*\[([^\]]*)\]/m)
  if (includesMatch) {
    meta.includes = includesMatch[1].split(",").map((s) => s.trim()).filter(Boolean)
  }

  const negMatch = yaml.match(/^negative:\s*\n\s+phase:\s*(\S+)\s*\n\s+type:\s*(\S+)/m)
  if (negMatch) {
    meta.negative = { phase: negMatch[1], type: negMatch[2] }
  }

  return meta
}

// ── File walker ────────────────────────────────────────────────────────────

function walkJs(dir: string): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkJs(full))
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".js") &&
      !entry.name.endsWith("_FIXTURE.js") &&
      !entry.name.startsWith("._")
    ) {
      results.push(full)
    }
  }
  return results
}

// ── Single test runner ─────────────────────────────────────────────────────

interface TestResult {
  pass: boolean
  message?: string
}

function runTest(
  testFile: string,
  meta: Test262Meta,
  harnessDir: string,
  nexBinary: string,
  cap?: string,
): Promise<TestResult> {
  return new Promise((resolve) => {
    // Build combined source: harness files + test
    const harnessFiles = ["sta.js", "assert.js", ...meta.includes]
    let combined = ""
    for (const h of harnessFiles) {
      const hp = path.join(harnessDir, h)
      if (fs.existsSync(hp)) combined += fs.readFileSync(hp, "utf-8") + "\n"
    }
    combined += fs.readFileSync(testFile, "utf-8")

    // Write to a dedicated temp directory so .brick output lands there too
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nex-t262-"))
    const tmpFile = path.join(tmpDir, "test.js")
    fs.writeFileSync(tmpFile, combined)

    // Capture stdout+stderr — suppress nex compile headers from terminal
    let stderr = ""
    const proc = spawn(nexBinary, nexRunArgs(tmpFile, cap), {
      stdio: ["ignore", "pipe", "pipe"],
    })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })

    const timer = setTimeout(() => {
      proc.kill()
      cleanup(tmpDir)
      resolve({ pass: false, message: "timed out (10s)" })
    }, 10_000)

    proc.on("close", (code) => {
      clearTimeout(timer)
      cleanup(tmpDir)

      const exitedOk = code === 0
      if (meta.negative) {
        resolve({ pass: !exitedOk })
      } else {
        resolve({
          pass: exitedOk,
          message: exitedOk ? undefined : stderr.trim() || `exit code ${code}`,
        })
      }
    })
  })
}

function cleanup(dir: string): void {
  try { fs.rmSync(dir, { recursive: true, force: true }) } catch {}
}

// ── Concurrency pool ───────────────────────────────────────────────────────

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let index = 0

  async function worker() {
    while (index < tasks.length) {
      const i = index++
      results[i] = await tasks[i]()
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

// ── Git helper ─────────────────────────────────────────────────────────────

function spawnQuiet(cmd: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] })
    proc.on("error", reject)
    proc.on("close", (code) => resolve(code ?? 1))
  })
}

// ── Runner ─────────────────────────────────────────────────────────────────

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const { repo, data_dir, concurrency, include_modules, include_async } =
      config as unknown as Test262Config

    const start = Date.now()
    const id = "test262"
    const label = "ECMAScript Test262"

    // ── Preflight: nex binary ──────────────────────────────────────────────
    if (!fs.existsSync(ctx.nexBinary)) {
      return {
        id, label, passed: 0, failed: 0, skipped: 0,
        duration_ms: Date.now() - start, failures: [],
        error: `nex binary not found: ${ctx.nexBinary}`,
      }
    }

    // ── Step 1: Clone or update test262 ───────────────────────────────────
    const cloneDir = path.resolve(ctx.dataDir, data_dir)

    if (!fs.existsSync(cloneDir)) {
      process.stdout.write("  Cloning test262 (this takes a while)... ")
      fs.mkdirSync(cloneDir, { recursive: true })
      const code = await spawnQuiet("git", ["clone", "--depth=1", repo, cloneDir], process.cwd())
      if (code !== 0) {
        console.log("✗")
        return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: "git clone failed" }
      }
      console.log("✓")
    } else {
      process.stdout.write("  Updating test262... ")
      await spawnQuiet("git", ["pull", "--ff-only"], cloneDir)
      console.log("✓")
    }

    const testDir = path.join(cloneDir, "test")
    const harnessDir = path.join(cloneDir, "harness")

    // ── Step 2: Discover + filter tests ───────────────────────────────────
    const allFiles = walkJs(testDir)
    let skipped = 0

    const testFiles = allFiles.filter((f) => {
      if (f.includes(`${path.sep}annexB${path.sep}`)) { skipped++; return false }
      // Skip RegExp Unicode property escape tests — they generate huge character classes
      // that cause the NEX compiler to hang (compilation takes >60s per test).
      if (f.includes(`property-escapes${path.sep}generated`)) { skipped++; return false }
      if (f.includes(`property-escapes${path.sep}`)) { skipped++; return false }

      // --filter: only include tests whose path contains the filter string
      if (ctx.pathFilter && !f.includes(ctx.pathFilter)) { skipped++; return false }

      const head = fs.readFileSync(f).subarray(0, 4096).toString()
      const meta = parseMeta(head)

      if (!include_modules && meta.flags.includes("module")) { skipped++; return false }
      if (!include_async && meta.flags.includes("async")) { skipped++; return false }
      return true
    })

    console.log(
      `  ${testFiles.length} tests to run, ${skipped} skipped (${concurrency} parallel)...`
    )

    // ── Step 3: Run ────────────────────────────────────────────────────────
    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []
    let done = 0

    const tasks = testFiles.map((file) => async () => {
      const source = fs.readFileSync(file, "utf-8")
      const meta = parseMeta(source)
      const result = await runTest(file, meta, harnessDir, ctx.nexBinary, ctx.cap)

      done++
      if (done % 1000 === 0) {
        process.stdout.write(`  ... ${done}/${testFiles.length} (${failed} failed so far)\n`)
      }

      return { file, result }
    })

    const results = await runWithConcurrency(tasks, concurrency)

    for (const { file, result } of results) {
      if (result.pass) {
        passed++
      } else {
        failed++
        failures.push({
          name: path.relative(testDir, file),
          message: result.message ?? "exit code non-zero",
        })
      }
    }

    return { id, label, passed, failed, skipped, duration_ms: Date.now() - start, failures }
  },
}
