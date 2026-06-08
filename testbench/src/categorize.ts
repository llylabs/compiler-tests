import type { CaseFailure } from "./runner.js"
import type { CategoryMap, ErrorCategory } from "./history.js"

export function categorize(failure: CaseFailure): ErrorCategory {
  const msg = failure.message ?? ""

  if (/timed out/i.test(msg)) return "timeout"

  // missing libc symbol
  const libcMatch = msg.match(/unknown import[^`]*`env::(\w+)`/)
  if (libcMatch) return `missing-libc: ${libcMatch[1]}`

  // missing include file
  const includeMatch = msg.match(/#include\s+[<"]([^>"]+)[>"]/)
  if (includeMatch && /error generated|errors generated/.test(msg)) {
    return `missing-include: ${includeMatch[1]}`
  }

  // WASM compilation failure
  if (
    /WASM compilation failed/i.test(msg) ||
    /Failed to compile WASM/i.test(msg) ||
    /failed to parse WebAssembly/i.test(msg) ||
    /failed to compile: wasm/i.test(msg) ||
    /wasm-ld: error/i.test(msg)
  ) return "wasm-compile-fail"

  // runtime crash
  if (
    /wasm backtrace/i.test(msg) ||
    /Failed to execute brick/i.test(msg) ||
    /Wasm exception/i.test(msg) ||
    /Failed to instantiate brick/i.test(msg) ||
    /Execution failed/i.test(msg) ||
    /entry call failed/i.test(msg)
  ) return "runtime-crash"

  // unsupported syntax — extract specific type
  const syntaxMatch = msg.match(/Unsupported syntax:\s*(.+?)(?:\s*\||\n|$)/)
  if (syntaxMatch) return `unsupported-syntax: ${syntaxMatch[1].trim().slice(0, 60)}`

  // bundler errors
  if (/Bundler error/i.test(msg)) return "bundler-error"
  if (/Cannot resolve import/i.test(msg)) return "bundler-resolve-fail"

  // output mismatch
  if (/expected:/.test(msg) || /\ngot:/.test(msg) || /dg-output mismatch/i.test(msg)) {
    return "output-mismatch"
  }

  // debug output leaked into stdout
  if (/\[DEBUG\]/.test(msg) || /\[FRONTEND/.test(msg)) return "debug-output-leak"

  // too many errors (complex file)
  if (/too many errors emitted/i.test(msg)) return "too-many-errors"

  // C++ modules not supported
  if (/import\s+\w+;|module\s+\w+;/.test(msg) && /error generated/.test(msg)) {
    return "unsupported-syntax: C++ modules"
  }

  return "unknown"
}

export function categorizeSuite(failures: CaseFailure[]): CategoryMap {
  const map: CategoryMap = {}
  for (const f of failures) {
    const cat = categorize(f)
    map[cat] = (map[cat] ?? 0) + 1
  }
  return map
}
