/**
 * Csmith generative suite.
 * Generates N random C99 programs, compiles with both `nex` and a reference
 * compiler (gcc/clang), compares output. Divergence = nex bug.
 *
 * Requires csmith installed: brew install csmith
 */
import fs from "fs"
import path from "path"
import os from "os"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { spawnCapture, stripNexHeaders, runWithConcurrency, nexRunArgs } from "../utils.js"

interface CsmithConfig {
  count: number
  reference_compiler: string  // "gcc" or "clang"
  concurrency: number
  seed?: number               // optional fixed seed for reproducibility
}

async function checkTool(name: string): Promise<boolean> {
  const r = await spawnCapture("which", [name])
  return r.code === 0
}

// Csmith's runtime header is needed for the generated programs
async function findCsmithInclude(): Promise<string | null> {
  for (const candidate of [
    "/usr/local/include/csmith-2.3.0",
    "/usr/include/csmith-2.3.0",
    "/opt/homebrew/include/csmith-2.3.0",
    "/usr/local/include",
    "/opt/homebrew/include",
  ]) {
    if (fs.existsSync(path.join(candidate, "csmith.h"))) return candidate
  }
  return null
}

async function runOneTest(
  index: number,
  seed: number,
  nexBinary: string,
  refCompiler: string,
  csmithInclude: string,
  cap?: string,
): Promise<{ pass: boolean; skipped: boolean; message?: string }> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nex-csmith-"))
  const srcFile = path.join(tmpDir, "test.c")
  const refBin   = path.join(tmpDir, "ref")

  try {
    // Generate random C program
    const gen = await spawnCapture("csmith", ["--seed", String(seed), "--no-checksum"], { timeout: 10_000 })
    if (gen.code !== 0 || gen.timedOut) return { pass: false, skipped: true }

    fs.writeFileSync(srcFile, gen.stdout)

    // Compile + run with reference compiler
    const refCompile = await spawnCapture(
      refCompiler,
      [srcFile, "-o", refBin, `-I${csmithInclude}`, "-w"],
      { timeout: 15_000 }
    )
    if (refCompile.code !== 0 || refCompile.timedOut) {
      // If reference compiler also fails, skip this test
      return { pass: false, skipped: true }
    }

    const refRun = await spawnCapture(refBin, [], { timeout: 10_000 })
    if (refRun.timedOut) return { pass: false, skipped: true }
    const refOutput = refRun.stdout.trim()

    // Run with nex
    const nexResult = await spawnCapture(nexBinary, nexRunArgs(srcFile, cap), { timeout: 15_000 })
    if (nexResult.timedOut) {
      return { pass: false, skipped: false, message: `nex timed out (seed=${seed})` }
    }
    if (nexResult.code !== 0) {
      const msg = nexResult.stderr.trim().split("\n").slice(-2).join(" | ")
      return { pass: false, skipped: false, message: `nex failed (seed=${seed}): ${msg}` }
    }

    const nexOutput = stripNexHeaders(nexResult.stdout).trim()

    if (nexOutput !== refOutput) {
      return {
        pass: false,
        skipped: false,
        message: `output mismatch (seed=${seed})\nref: ${refOutput.slice(0, 150)}\nnex: ${nexOutput.slice(0, 150)}`,
      }
    }

    return { pass: true, skipped: false }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const { count, reference_compiler, concurrency, seed: fixedSeed } =
      config as unknown as CsmithConfig

    const start = Date.now()
    const id = "csmith"
    const label = "Csmith (generative C)"

    if (!fs.existsSync(ctx.nexBinary)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: 0, failures: [], error: `nex binary not found: ${ctx.nexBinary}` }
    }

    // Preflight checks
    if (!await checkTool("csmith")) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: 0, failures: [], error: "csmith not installed — run: brew install csmith" }
    }
    if (!await checkTool(reference_compiler)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: 0, failures: [], error: `reference compiler not found: ${reference_compiler}` }
    }
    const csmithInclude = await findCsmithInclude()
    if (!csmithInclude) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: 0, failures: [], error: "csmith.h not found — check csmith installation" }
    }

    console.log(`  Generating and running ${count} random C programs vs ${reference_compiler} (${concurrency} parallel)...`)

    // Generate seeds — fixed or random
    const baseSeed = fixedSeed ?? Math.floor(Math.random() * 1_000_000)
    const seeds = Array.from({ length: count }, (_, i) => baseSeed + i)

    let passed = 0
    let failed = 0
    let skipped = 0
    const failures: CaseFailure[] = []
    let done = 0

    const tasks = seeds.map((seed, i) => async () => {
      const result = await runOneTest(i, seed, ctx.nexBinary, reference_compiler, csmithInclude, ctx.cap)

      done++
      if (done % 50 === 0) process.stdout.write(`  ... ${done}/${count} (${failed} failed)\n`)

      return result
    })

    const results = await runWithConcurrency(tasks, concurrency)

    for (const result of results) {
      if (result.skipped) { skipped++ }
      else if (result.pass) { passed++ }
      else { failed++; failures.push({ name: `seed-${failed + skipped + passed}`, message: result.message ?? "failed" }) }
    }

    return { id, label, passed, failed, skipped, duration_ms: Date.now() - start, failures }
  },
}
