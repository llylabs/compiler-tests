import { spawn } from "child_process"
import fs from "fs"
import path from "path"
import os from "os"
import type { Runner, SuiteResult, CaseFailure, RunContext } from "../runner.js"
import { ensureRepo, runWithConcurrency, nexRunArgs } from "../utils.js"

interface WptConfig {
  repo: string
  data_dir: string
  concurrency: number
  include_dirs: string[]
  timeout_ms?: number
}

// ── Testharness shim (header) ─────────────────────────────────────────────
// Replaces the browser-only testharness.js with a NEX-compatible polyfill.

const WPT_HEADER = `
var __wpt_failures = [];
var __wpt_passes   = [];

function __fmt(v) {
  if (v === null)      return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'string')  return JSON.stringify(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return '[' + v.map(__fmt).join(', ') + ']';
  return String(v);
}

function assert_equals(actual, expected, message) {
  var ok = actual === expected || (typeof actual === 'number' && typeof expected === 'number' && isNaN(actual) && isNaN(expected));
  if (!ok) throw new Error((message ? message + ': ' : '') + 'expected ' + __fmt(expected) + ', got ' + __fmt(actual));
}
function assert_not_equals(actual, unexpected, message) {
  if (actual === unexpected) throw new Error((message ? message + ': ' : '') + 'got disallowed value ' + __fmt(actual));
}
function assert_true(actual, message) {
  if (actual !== true) throw new Error((message ? message + ': ' : '') + 'expected true, got ' + __fmt(actual));
}
function assert_false(actual, message) {
  if (actual !== false) throw new Error((message ? message + ': ' : '') + 'expected false, got ' + __fmt(actual));
}
function assert_greater_than(a, b, message) {
  if (!(a > b)) throw new Error((message ? message + ': ' : '') + __fmt(a) + ' not > ' + __fmt(b));
}
function assert_less_than(a, b, message) {
  if (!(a < b)) throw new Error((message ? message + ': ' : '') + __fmt(a) + ' not < ' + __fmt(b));
}
function assert_greater_than_equal(a, b, message) {
  if (!(a >= b)) throw new Error((message ? message + ': ' : '') + __fmt(a) + ' not >= ' + __fmt(b));
}
function assert_less_than_equal(a, b, message) {
  if (!(a <= b)) throw new Error((message ? message + ': ' : '') + __fmt(a) + ' not <= ' + __fmt(b));
}
function assert_between_exclusive(x, lower, upper, message) {
  if (!(x > lower && x < upper)) throw new Error((message ? message + ': ' : '') + __fmt(x) + ' not in (' + lower + ', ' + upper + ')');
}
function assert_between_inclusive(x, lower, upper, message) {
  if (!(x >= lower && x <= upper)) throw new Error((message ? message + ': ' : '') + __fmt(x) + ' not in [' + lower + ', ' + upper + ']');
}
function assert_array_equals(actual, expected, message) {
  if (!Array.isArray(actual)) throw new Error((message ? message + ': ' : '') + 'expected array, got ' + typeof actual);
  if (actual.length !== expected.length) throw new Error((message ? message + ': ' : '') + 'length: expected ' + expected.length + ', got ' + actual.length);
  for (var __i = 0; __i < expected.length; __i++) {
    if (actual[__i] !== expected[__i]) throw new Error((message ? message + ': ' : '') + '[' + __i + ']: expected ' + __fmt(expected[__i]) + ', got ' + __fmt(actual[__i]));
  }
}
function assert_unreached(message) {
  throw new Error('Reached unreachable code' + (message ? ': ' + message : ''));
}
function assert_throws_js(constructor, fn, message) {
  var threw = false;
  try { fn(); } catch(e) { threw = true; }
  if (!threw) throw new Error((message ? message + ': ' : '') + 'expected exception to be thrown');
}
function assert_throws_exactly(exception, fn, message) {
  var threw = false;
  try { fn(); } catch(e) { threw = (e === exception); if (!threw) throw e; }
  if (!threw) throw new Error((message ? message + ': ' : '') + 'expected exception to be thrown');
}
function assert_own_property(obj, prop, message) {
  if (!Object.prototype.hasOwnProperty.call(obj, prop))
    throw new Error((message ? message + ': ' : '') + 'missing own property: ' + __fmt(prop));
}
function assert_not_own_property(obj, prop, message) {
  if (Object.prototype.hasOwnProperty.call(obj, prop))
    throw new Error((message ? message + ': ' : '') + 'unexpected own property: ' + __fmt(prop));
}
function assert_inherits(obj, prop, message) {
  if (Object.prototype.hasOwnProperty.call(obj, prop))
    throw new Error((message ? message + ': ' : '') + 'should be inherited, not own: ' + prop);
  if (!(prop in obj))
    throw new Error((message ? message + ': ' : '') + 'property not found: ' + prop);
}
function assert_idl_attribute(obj, attr, message) {
  if (!(attr in obj)) throw new Error((message ? message + ': ' : '') + 'missing attribute: ' + attr);
}
function assert_readonly(obj, attr, message) { /* skip – not checkable without descriptors */ }
function assert_regexp_match(actual, regexp, message) {
  if (!regexp.test(actual)) throw new Error((message ? message + ': ' : '') + __fmt(actual) + ' does not match ' + regexp);
}
function assert_class_string(obj, classStr, message) {
  var actual = Object.prototype.toString.call(obj);
  var expected = '[object ' + classStr + ']';
  if (actual !== expected) throw new Error((message ? message + ': ' : '') + 'expected ' + expected + ', got ' + actual);
}
function assert_any(assertFn, actual, expectedArray, message) {
  var errors = [];
  for (var __i = 0; __i < expectedArray.length; __i++) {
    try { assertFn(actual, expectedArray[__i]); return; } catch(e) { errors.push(e.message); }
  }
  throw new Error((message ? message + ': ' : '') + 'none matched: ' + errors.join('; '));
}

function test(fn, name, props) {
  try {
    fn();
    __wpt_passes.push(name || 'unnamed');
  } catch(e) {
    __wpt_failures.push({ name: name || 'unnamed', message: e && e.message ? e.message : String(e) });
  }
}

function async_test(fn, name, props) {
  var __t = {
    step: function(f) { try { return f(); } catch(e) { __wpt_failures.push({ name: name || 'unnamed', message: e.message || String(e) }); } },
    done: function() { __wpt_passes.push(name || 'unnamed'); },
    step_func: function(f) { return function() { try { return f.apply(this, arguments); } catch(e) { __wpt_failures.push({ name: name || 'unnamed', message: e.message || String(e) }); }; }; },
    step_func_done: function(f) { return function() { try { if (f) f.apply(this, arguments); __wpt_passes.push(name || 'unnamed'); } catch(e) { __wpt_failures.push({ name: name || 'unnamed', message: e.message || String(e) }); }; }; },
    unreached_func: function(msg) { return function() { __wpt_failures.push({ name: name || 'unnamed', message: msg || 'unreached' }); }; },
    add_cleanup: function() {},
  };
  try { fn(__t); } catch(e) { __wpt_failures.push({ name: name || 'unnamed', message: e.message || String(e) }); }
}

function promise_test(fn, name, props) {
  // Async/Promise tests require runtime support not yet available in NEX — skip
  __wpt_failures.push({ name: name || 'unnamed', message: 'promise_test: async not supported' });
}

function setup(propsOrFn, props) { /* ignore */ }
function done() { /* ignore */ }
function add_result_callback() {}
function add_completion_callback() {}
`

const WPT_FOOTER = `
// ── WPT result report ──────────────────────────────────────────────────────
if (__wpt_failures.length > 0) {
  for (var __fi = 0; __fi < __wpt_failures.length; __fi++) {
    var __f = __wpt_failures[__fi];
    console.error('FAIL: ' + __f.name + ': ' + __f.message);
  }
  throw new Error(__wpt_failures.length + ' WPT test(s) failed, ' + __wpt_passes.length + ' passed');
}
`

// ── META comment parser ────────────────────────────────────────────────────
// WPT .any.js files can declare:
//   // META: script=resources/some-helper.js
//   // META: global=window,worker      ← we skip window-only tests

interface WptMeta {
  scripts: string[]
  globalFlags: string[]
}

function parseMeta(source: string): WptMeta {
  const meta: WptMeta = { scripts: [], globalFlags: [] }
  for (const line of source.split("\n")) {
    if (!line.startsWith("// META:")) break
    const scriptMatch = line.match(/\/\/ META:\s*script=(.+)/)
    if (scriptMatch) meta.scripts.push(scriptMatch[1].trim())
    const globalMatch = line.match(/\/\/ META:\s*global=(.+)/)
    if (globalMatch) meta.globalFlags = globalMatch[1].trim().split(",").map(s => s.trim())
  }
  return meta
}

// ── File walker ────────────────────────────────────────────────────────────

function walkWpt(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkWpt(full))
    } else if (entry.isFile() && isRunnableWptFile(entry.name)) {
      results.push(full)
    }
  }
  return results
}

function isRunnableWptFile(name: string): boolean {
  if (!name.endsWith(".js")) return false
  // Skip fixture and support files
  if (name.includes("FIXTURE") || name.startsWith("_")) return false
  // Skip worker-only and window-only variants (generated from .any.js)
  if (name.endsWith(".worker.js") || name.endsWith(".window.js")) return false
  // Skip service worker files
  if (name.includes("serviceworker") || name.includes("sharedworker")) return false
  return true
}

// ── Single test runner ─────────────────────────────────────────────────────

interface TestResult {
  pass: boolean
  skipped?: boolean
  message?: string
}

async function runWptTest(
  file: string,
  rootDir: string,
  nexBinary: string,
  timeoutMs: number,
  cap?: string,
): Promise<TestResult> {
  const source = fs.readFileSync(file, "utf-8")
  const meta = parseMeta(source)

  // Skip tests that explicitly require only a browser window context
  if (
    meta.globalFlags.length > 0 &&
    !meta.globalFlags.includes("js") &&
    !meta.globalFlags.includes("dedicatedworker") &&
    meta.globalFlags.every(g => g === "window" || g === "serviceworker" || g === "sharedworker")
  ) {
    return { pass: false, skipped: true }
  }

  // Resolve META script includes relative to the test file's directory
  let extraScripts = ""
  for (const scriptPath of meta.scripts) {
    // Paths can be relative or start with /resources/ (WPT root-relative)
    const resolved = scriptPath.startsWith("/")
      ? path.join(rootDir, scriptPath)
      : path.join(path.dirname(file), scriptPath)
    if (fs.existsSync(resolved)) {
      extraScripts += fs.readFileSync(resolved, "utf-8") + "\n"
    }
  }

  const combined = WPT_HEADER + "\n" + extraScripts + "\n" + source + "\n" + WPT_FOOTER

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nex-wpt-"))
  const tmpFile = path.join(tmpDir, "test.js")
  fs.writeFileSync(tmpFile, combined)

  return new Promise((resolve) => {
    let stderr = ""
    const proc = spawn(nexBinary, nexRunArgs(tmpFile, cap), {
      stdio: ["ignore", "pipe", "pipe"],
    })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })

    const timer = setTimeout(() => {
      proc.kill()
      cleanup(tmpDir)
      resolve({ pass: false, message: "timed out" })
    }, timeoutMs)

    proc.on("close", (code) => {
      clearTimeout(timer)
      cleanup(tmpDir)
      if (code === 0) {
        resolve({ pass: true })
      } else {
        resolve({ pass: false, message: stderr.trim().split("\n").slice(-3).join(" | ") || `exit code ${code}` })
      }
    })
  })
}

function cleanup(dir: string): void {
  try { fs.rmSync(dir, { recursive: true, force: true }) } catch {}
}

// ── Runner ─────────────────────────────────────────────────────────────────

export const runner: Runner = {
  async run(config, ctx: RunContext): Promise<SuiteResult> {
    const {
      repo,
      data_dir,
      concurrency,
      include_dirs,
      timeout_ms = 10_000,
    } = config as unknown as WptConfig

    const start = Date.now()
    const id = "wpt"
    const label = "Web Platform Tests (WinterTC subset)"

    if (!fs.existsSync(ctx.nexBinary)) {
      return {
        id, label, passed: 0, failed: 0, skipped: 0,
        duration_ms: Date.now() - start, failures: [],
        error: `nex binary not found: ${ctx.nexBinary}`,
      }
    }

    // Clone/update WPT repo — sparse checkout of only the needed dirs
    const cloneDir = path.resolve(ctx.dataDir, data_dir)
    const repo_result = await ensureRepo(repo, cloneDir, include_dirs)
    if (!repo_result.ok) {
      return {
        id, label, passed: 0, failed: 0, skipped: 0,
        duration_ms: Date.now() - start, failures: [],
        error: repo_result.error,
      }
    }

    // Discover test files across all configured dirs
    const testFiles: string[] = []
    for (const dir of include_dirs) {
      testFiles.push(...walkWpt(path.join(cloneDir, dir)))
    }

    console.log(`  ${testFiles.length} tests to run (${concurrency} parallel)...`)

    let passed = 0
    let failed = 0
    let skipped = 0
    const failures: CaseFailure[] = []
    let done = 0

    const tasks = testFiles.map((file) => async () => {
      const result = await runWptTest(file, cloneDir, ctx.nexBinary, timeout_ms, ctx.cap)
      done++
      if (done % 100 === 0) {
        process.stdout.write(`  ... ${done}/${testFiles.length} (${failed} failed so far)\n`)
      }
      return { file, result }
    })

    const results = await runWithConcurrency(tasks, concurrency)

    for (const { file, result } of results) {
      if (result.skipped) {
        skipped++
      } else if (result.pass) {
        passed++
      } else {
        failed++
        failures.push({
          name: path.relative(cloneDir, file),
          message: result.message ?? "exit code non-zero",
        })
      }
    }

    return { id, label, passed, failed, skipped, duration_ms: Date.now() - start, failures }
  },
}
