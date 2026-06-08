/**
 * chibicc Test Suite
 *
 * Tests C11 language features using the chibicc compiler's test suite
 * (https://github.com/rui314/chibicc). Each test file uses ASSERT(expected, expr)
 * macros and prints "OK" on success, exits with code 1 on first failure.
 *
 * The test harness (test.h + common) is provided as an include; we compile
 * each test as a single translation unit by prepending the common definitions.
 *
 * Tests requiring inline asm, TLS, VLA, alloca, or atomics are skipped
 * because they are WASM-incompatible.
 */

import fs from "fs"
import path from "path"
import os from "os"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { ensureRepo, walkFiles, runWithConcurrency, spawnCapture, stripNexHeaders, nexRunArgs } from "../utils.js"

interface ChibiccConfig {
  repo: string
  data_dir: string
  concurrency: number
  timeout_ms?: number
}

// Tests that use WASM-incompatible features
const SKIP_TESTS = new Set([
  "asm.c",       // inline assembly (x86)
  "tls.c",       // thread-local storage
  "vla.c",       // variable-length arrays (WASM stack limitation)
  "alloca.c",    // alloca (dynamic stack allocation)
  "atomic.c",    // _Atomic (requires threading)
  "driver.sh",   // CLI tests for chibicc binary itself
])

/**
 * Build a self-contained test file by providing the `common` harness
 * functions inline so NEX can compile it as a single translation unit.
 * The original `common` file defines assert(), print helpers, extern vars etc.
 * We create a simplified version that works standalone.
 */
function buildHarness(): string {
  return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>

/* chibicc test harness — simplified for NEX single-file compilation */
static void assert(int expected, int actual, char *code) {
  if (expected == actual) return;
  printf("%s => %d expected but got %d\\n", code, expected, actual);
  exit(1);
}

static void assert_float(float expected, float actual, char *code) {
  if (expected == actual) return;
  printf("%s => %f expected but got %f\\n", code, expected, actual);
  exit(1);
}

static void assert_double(double expected, double actual, char *code) {
  if (expected == actual) return;
  printf("%s => %f expected but got %f\\n", code, expected, actual);
  exit(1);
}

static void assert_long(long expected, long actual, char *code) {
  if (expected == actual) return;
  printf("%s => %ld expected but got %ld\\n", code, expected, actual);
  exit(1);
}

static int static_fn(void) { return 5; }
static int ext1 = 5;
static int ext2 = 7;
static int ext3 = 11;
static int ext_fn1(void) { return 5; }
static int ext_fn2(void) { return 7; }
static int common_ext2 = 3;
`
}

/**
 * Replace the test.h include with our harness and produce a single .c file
 * that NEX can compile directly.
 */
function prepareTestFile(testSource: string, testHarness: string): string {
  // Remove #include "test.h" and prepend our harness
  const cleaned = testSource.replace(/#include\s+"test\.h"/, "")
  return testHarness + "\n" + cleaned
}

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const {
      repo = "https://github.com/rui314/chibicc",
      data_dir,
      concurrency = 8,
      timeout_ms = 30_000,
    } = config as unknown as ChibiccConfig
    const start = Date.now()
    const id = "chibicc"
    const label = "chibicc (C11)"

    const cloneDir = path.resolve(ctx.dataDir, data_dir)
    const repoResult = await ensureRepo(repo, cloneDir, ["test", "include"])
    if (!repoResult.ok) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: repoResult.error }
    }

    const testDir = path.join(cloneDir, "test")
    if (!fs.existsSync(testDir)) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: `Test directory not found: ${testDir}` }
    }

    // Discover test files (only top-level .c files in test/)
    const allFiles = fs.readdirSync(testDir)
      .filter((f) => f.endsWith(".c"))
      .sort()

    let skipped = 0
    const runnable = allFiles.filter((f) => {
      if (SKIP_TESTS.has(f)) { skipped++; return false }
      return true
    })

    console.log(`  ${runnable.length} tests to run, ${skipped} skipped (${concurrency} parallel)...`)

    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []

    const harness = buildHarness()

    const tasks = runnable.map((file) => async () => {
      const filePath = path.join(testDir, file)
      const source = fs.readFileSync(filePath, "utf-8")

      // Check for GCC extensions that might cause issues
      const hasComputedGoto = source.includes("goto *")
      const hasBuiltinTypes = source.includes("__int128")
      if (hasComputedGoto || hasBuiltinTypes) {
        return { name: file, pass: false, message: "skipped: uses unsupported GCC extension", skip: true }
      }

      // Build a self-contained test file
      const prepared = prepareTestFile(source, harness)
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nex-chibicc-"))
      const tmpFile = path.join(tmpDir, file)

      try {
        fs.writeFileSync(tmpFile, prepared)

        // Copy any local include files the test might need
        for (const inc of ["test.h", "include1.h", "include2.h", "include3.h", "include4.h"]) {
          const incPath = path.join(testDir, inc)
          if (fs.existsSync(incPath)) fs.copyFileSync(incPath, path.join(tmpDir, inc))
        }

        const result = await spawnCapture(ctx.nexBinary, nexRunArgs(tmpFile, ctx.cap), {
          timeout: timeout_ms,
        })

        if (result.timedOut) {
          return { name: file, pass: false, message: `timed out (${timeout_ms / 1000}s)`, skip: false }
        }

        if (result.code !== 0) {
          const stdout = stripNexHeaders(result.stdout).trim()
          const stderr = result.stderr.trim().split("\n").slice(-3).join(" | ")
          const msg = stdout ? stdout.split("\n").slice(-2).join(" | ") : stderr
          return { name: file, pass: false, message: `exit ${result.code}: ${msg.slice(0, 200)}`, skip: false }
        }

        return { name: file, pass: true, message: undefined, skip: false }
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    })

    const results = await runWithConcurrency(tasks, concurrency)

    for (const r of results) {
      if ((r as any).skip) {
        skipped++
      } else if (r.pass) {
        passed++
      } else {
        failed++
        failures.push({ name: r.name, message: (r as any).message ?? "failed" })
      }
    }

    return { id, label, passed, failed, skipped, duration_ms: Date.now() - start, failures }
  },
}
