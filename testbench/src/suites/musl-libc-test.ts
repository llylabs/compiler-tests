/**
 * musl libc-test Suite
 *
 * Tests C standard library conformance using the musl libc-test suite.
 * Runs WASM-compatible tests from src/functional/, src/math/, and
 * src/regression/. Skips tests requiring pthreads, signals, fork,
 * dlopen, or other WASM-incompatible features.
 *
 * Tests use test.h with t_error()/t_status. Exit code 0 = pass.
 */

import fs from "fs"
import path from "path"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { ensureRepo, walkFiles, runWithConcurrency, runNexC } from "../utils.js"

interface MuslConfig {
  repo: string
  data_dir: string
  concurrency: number
  timeout_ms?: number
}

// Tests that are known to be WASM-incompatible (pthreads, signals, fork,
// dlopen, TLS, setjmp, advanced FS, IPC, sockets, crypt, etc.)
const SKIP_TESTS = new Set([
  // pthreads
  "pthread_cancel.c",
  "pthread_cancel-points.c",
  "pthread_cond.c",
  "pthread_mutex.c",
  "pthread_robust.c",
  "pthread_tsd.c",
  // semaphores / IPC
  "sem_init.c",
  "sem_open.c",
  "ipc_msg.c",
  "ipc_sem.c",
  "ipc_shm.c",
  // process
  "popen.c",
  "spawn.c",
  "vfork.c",
  // signals / setjmp
  "setjmp.c",
  "sigaltstack.c",
  "sigreturn.c",
  // dlopen / TLS
  "dlopen.c",
  "tls_init.c",
  "tls_local_exec.c",
  "tls_align.c",
  "tls_get_new-dtv.c",
  "tls_init_dso.c",
  "tls_local_exec_dso.c",
  "tls_align_dso.c",
  "dlopen_dso.c",
  // sockets / network
  "socket.c",
  // crypt
  "crypt.c",
  // filesystem features not in WASM
  "fcntl.c",
  "stat.c",
  "flock.c",
  // clock_gettime with clock IDs not in WASM
  "clock_gettime.c",
  // mmap
  "mmap.c",
  // utime
  "utime.c",
  // dn_expand
  "dn_expand.c",
  // pleval (musl internal)
  "pleval.c",
])

// Regression tests known to need pthreads/signals/fork/advanced features
const SKIP_REGRESSION = new Set([
  "pthread_atfork-errno-clobber.c",
  "pthread_condattr_setclock.c",
  "pthread_cond-smasher.c",
  "pthread_create-oom.c",
  "pthread_cancel-sem_wait.c",
  "pthread_exit-cancel.c",
  "pthread_exit-dtor.c",
  "pthread_once-deadlock.c",
  "pthread_rwlock-ebusy.c",
  "raise-race.c",
  "sigprocmask-internal.c",
  "sigreturn.c",
  "statvfs.c",
  "syscall-sign-extend.c",
  "tls_get_new-dtv.c",
  "flockfile-list.c",
  "ftello-unflushed-append.c",
  "rlimit-open-files.c",
  "daemon-failure.c",
  "getpwnam_r-crash.c",
  "getpwnam_r-errno.c",
  "inet_ntop-v4mapped.c",
  "inet_pton-empty-last-field.c",
  "mkdtemp-failure.c",
  "mkstemp-failure.c",
  "sigbus.c",
])

function shouldSkip(filePath: string): boolean {
  const name = path.basename(filePath)
  if (SKIP_TESTS.has(name)) return true
  if (SKIP_REGRESSION.has(name)) return true
  // Skip DSO helper files (not tests)
  if (name.endsWith("_dso.c")) return true
  return false
}

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const {
      repo = "https://github.com/nicowilliams/libc-test",
      data_dir,
      concurrency = 8,
      timeout_ms = 30_000,
    } = config as unknown as MuslConfig
    const start = Date.now()
    const id = "musl-libc-test"
    const label = "musl libc-test"

    const cloneDir = path.resolve(ctx.dataDir, data_dir)
    const repoResult = await ensureRepo(repo, cloneDir, ["src"])
    if (!repoResult.ok) {
      return { id, label, passed: 0, failed: 0, skipped: 0, duration_ms: Date.now() - start, failures: [], error: repoResult.error }
    }

    // Discover test files from the three WASM-safe directories
    const srcDir = path.join(cloneDir, "src")
    const dirs = ["functional", "math", "regression"].map((d) => path.join(srcDir, d))
    let allFiles: string[] = []
    for (const d of dirs) {
      if (fs.existsSync(d)) allFiles.push(...walkFiles(d, ".c"))
    }

    // Filter
    let skipped = 0
    const runnable = allFiles.filter((f) => {
      if (shouldSkip(f)) { skipped++; return false }
      return true
    }).sort()

    console.log(`  ${runnable.length} tests to run, ${skipped} skipped (${concurrency} parallel)...`)

    let passed = 0
    let failed = 0
    const failures: CaseFailure[] = []
    let done = 0

    // Include path: src/common/ for test.h
    const commonDir = path.join(srcDir, "common")

    const tasks = runnable.map((file) => async () => {
      const result = await runNexC(file, ctx.nexBinary, {
        timeout: timeout_ms,
        includePaths: [commonDir, path.dirname(file)],
        cap: ctx.cap,
      })
      done++
      if (done % 50 === 0) process.stdout.write(`  ... ${done}/${runnable.length} (${failed} failed)\n`)
      return { file, result }
    })

    const results = await runWithConcurrency(tasks, concurrency)

    for (const { file, result } of results) {
      if (result.pass) {
        passed++
      } else {
        failed++
        failures.push({ name: path.relative(srcDir, file), message: result.message ?? "failed" })
      }
    }

    return { id, label, passed, failed, skipped, duration_ms: Date.now() - start, failures }
  },
}
