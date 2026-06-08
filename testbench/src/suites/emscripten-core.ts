/**
 * Emscripten Core Test Suite (portable subset)
 *
 * Runs portable C/C++ tests from the Emscripten test suite's test/core/
 * and test/stdio/, test/math/ directories. Only includes tests that are
 * standard C/C++ without emscripten-specific APIs.
 *
 * Pass/fail is determined by comparing stdout against paired .out files.
 */

import fs from "fs"
import path from "path"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { ensureRepo, walkFiles, runWithConcurrency, runNexC } from "../utils.js"

interface EmscriptenConfig {
  repo: string
  data_dir: string
  concurrency: number
  timeout_ms?: number
}

/**
 * Check if a source file is portable (no emscripten-specific dependencies).
 * Returns true if the file can be compiled with a standard C/C++ compiler.
 */
function isPortable(source: string): boolean {
  // Reject emscripten-specific includes and APIs
  if (/#include\s*[<"]emscripten/.test(source)) return false
  if (/EM_ASM|EM_JS|EMSCRIPTEN_KEEPALIVE/.test(source)) return false
  if (/emscripten_/.test(source)) return false
  // Reject WASM-specific attributes
  if (/__attribute__\(\(import_module/.test(source)) return false
  // Reject asyncify
  if (/asyncify/.test(source)) return false
  // Reject pthreads
  if (/#include\s*[<"]pthread\.h/.test(source)) return false
  // Reject OpenGL / WebGL
  if (/#include\s*[<"]GL\//.test(source)) return false
  if (/#include\s*[<"]GLES/.test(source)) return false
  // Reject SDL
  if (/#include\s*[<"]SDL/.test(source)) return false
  return true
}

/**
 * Find .out file for a given source file.
 * Emscripten convention: test_foo.c → test_foo.out (same directory)
 */
function findOutFile(sourceFile: string): string | null {
  const base = sourceFile.replace(/\.(c|cpp|cc)$/, ".out")
  if (fs.existsSync(base)) return base
  return null
}

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const {
      repo = "https://github.com/emscripten-core/emscripten",
      data_dir,
      concurrency = 8,
      timeout_ms = 30_000,
    } = config as unknown as EmscriptenConfig
    const start = Date.now()
    const id = "emscripten-core"
    const label = "Emscripten Core (portable)"

    const cloneDir = path.resolve(ctx.dataDir, data_dir)
    const repoResult = await ensureRepo(repo, cloneDir, [
      "test/core",
      "test/stdio",
      "test/math",
      "test/va_arg",
      "test/dirent",
      "test/fcntl",
      "test/third_party/sha1.c",
      "test/third_party/fannkuch.c",
      "test/third_party/whets.c",
    ])
    if (!repoResult.ok) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: repoResult.error }
    }

    // Discover test files from portable directories
    const testBase = path.join(cloneDir, "test")
    const searchDirs = ["core", "stdio", "math", "va_arg"].map((d) => path.join(testBase, d))

    let allFiles: string[] = []
    for (const d of searchDirs) {
      if (fs.existsSync(d)) {
        allFiles.push(...walkFiles(d, ".c"))
        allFiles.push(...walkFiles(d, ".cpp"))
      }
    }

    // Filter: must have .out file + must be portable + must not use emscripten APIs
    let skipped = 0
    const runnable: Array<{ file: string; expected: string }> = []

    for (const file of allFiles) {
      const outFile = findOutFile(file)
      if (!outFile) { skipped++; continue }

      let source: string
      try {
        source = fs.readFileSync(file, "utf-8")
      } catch {
        skipped++
        continue
      }

      if (!isPortable(source)) { skipped++; continue }

      const expected = fs.readFileSync(outFile, "utf-8").trim()
      runnable.push({ file, expected })
    }

    runnable.sort((a, b) => a.file.localeCompare(b.file))

    console.log(`  ${runnable.length} tests to run, ${skipped} skipped (${concurrency} parallel)...`)

    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []
    let done = 0

    const tasks = runnable.map((tc) => async () => {
      const result = await runNexC(tc.file, ctx.nexBinary, {
        expectedOutput: tc.expected,
        timeout: timeout_ms,
        includePaths: [path.dirname(tc.file), testBase],
        cap: ctx.cap,
      })
      done++
      if (done % 20 === 0) process.stdout.write(`  ... ${done}/${runnable.length} (${failed} failed)\n`)
      return { tc, result }
    })

    const results = await runWithConcurrency(tasks, concurrency)

    for (const { tc, result } of results) {
      const name = path.relative(testBase, tc.file)
      if (result.pass) {
        passed++
      } else {
        failed++
        failures.push({ name, message: result.message ?? "failed" })
      }
    }

    return { id, label, passed, failed, skipped, duration_ms: Date.now() - start, failures }
  },
}
