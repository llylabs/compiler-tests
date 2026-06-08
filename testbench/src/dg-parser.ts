/**
 * Parser for GCC DejaGnu test directives (dg-do, dg-output).
 */

export interface DgMeta {
  action: "run" | "compile" | "skip";
  outputPattern?: RegExp;
}

/**
 * Parse dg-do and dg-output from GCC test source.
 * Used by gcc-torture and gcc-dg suites.
 */
export function parseDgSimple(source: string): DgMeta {
  const doMatch = source.match(/\{\s*dg-do\s+(\w+)/);
  const action = doMatch?.[1];
  if (action && action !== "run" && action !== "compile" && action !== "link")
    return { action: "skip" };

  const outMatch = source.match(
    /\{\s*dg-output\s+"((?:[^"\\]|\\.)*)"\s*\}/
  );
  const outputPattern = outMatch
    ? buildSimplePattern(outMatch[1])
    : undefined;

  return {
    action: !action || action === "run" ? "run" : "compile",
    outputPattern,
  };
}

/**
 * Set of C/C++ headers available.
 *
 * In ServerGrade mode (WASI SDK + libc++), the full C++ standard library is
 * available.  This set is used for informational purposes; actual availability
 * is determined by the include paths and sysroot at compile time.
 */
const NEX_AVAILABLE_HEADERS = new Set([
  // C headers
  "assert.h", "complex.h", "ctype.h", "errno.h", "fcntl.h", "fenv.h",
  "float.h", "inttypes.h", "limits.h", "locale.h", "malloc.h", "math.h",
  "memory.h", "setjmp.h", "signal.h", "stdarg.h", "stdbool.h", "stddef.h",
  "stdint.h", "stdio.h", "stdlib.h", "string.h", "strings.h", "time.h",
  "unistd.h", "wchar.h",
  "sys/types.h", "sys/stat.h",
  // C++ wrappers
  "cassert", "cerrno", "climits", "cmath", "cstdarg", "cstddef", "cstdint",
  "cstdio", "cstdlib", "cstring",
  // C++ standard library (available via libc++ in ServerGrade mode)
  "algorithm", "any", "array", "bitset", "chrono", "concepts", "deque",
  "exception", "forward_list", "functional", "initializer_list", "iomanip",
  "ios", "iostream", "istream", "iterator", "limits", "list", "locale",
  "map", "memory", "new", "numeric", "optional", "ostream", "queue",
  "random", "ranges", "ratio", "regex", "set", "span", "sstream",
  "stack", "stdexcept", "streambuf", "string", "string_view",
  "system_error", "tuple", "type_traits", "typeinfo", "unordered_map",
  "unordered_set", "utility", "valarray", "variant", "vector",
  "fstream", "numbers",
]);

/**
 * C++ standard headers unavailable on WASM (platform limitations).
 *
 * When WASI SDK is available (ServerGrade mode), most STL headers work via
 * libc++.  Only headers requiring OS features that WASM lacks are skipped.
 *
 * NOTE: If WASI_SDK_PATH is not set, the test runner falls back to Legacy
 * mode where NO STL headers are available.  The filter below assumes
 * ServerGrade is the default test target.
 */
const STL_HEADERS_UNAVAILABLE = new Set([
  // Threading — WASM is single-threaded
  "thread", "mutex", "condition_variable", "shared_mutex",
  "future", "barrier", "latch", "semaphore", "atomic",
  // Filesystem — WASI Preview 1 has limited FS support
  "filesystem",
  // Coroutines — not yet supported in the NEX WASM backend
  "coroutine", "generator",
  // C++23/26 — not yet available in WASI SDK libc++
  "format", "print", "expected", "mdspan",
  // Source location — requires compiler support not available for WASM
  "source_location",
]);

/**
 * Check if a C++ test should be executed.
 * Aggressive filtering for WASM-unsupported features.
 */
export function shouldRunCpp(source: string): boolean {
  const m = source.match(/\{\s*dg-do\s+run\s*(\{[^}]*\})?/);
  if (!m) return false;
  // Skip arch-specific target requirements
  if (
    m[1] &&
    /i.86|x86|ia64|arm|powerpc|aarch|mips|sparc|s390|linux|gnu|uclinux|mingw|darwin|hpux|aix/.test(
      m[1]
    )
  )
    return false;

  // Skip tests requiring C++ standards beyond c++17
  // Match target clauses like { target c++20 }, { target c++2a }, { target c++23 }, etc.
  if (m[1] && /c\+\+(2[0-9]|[2-9][a-z])\b/.test(m[1])) return false;
  // Also check dg-options for -std= flags
  const stdMatch = source.match(/dg-options\s+"[^"]*-std=c\+\+(\w+)/);
  if (stdMatch) {
    const std = stdMatch[1];
    if (/^(2[0-9]|2[a-z]|23|26)$/.test(std)) return false;
  }
  // Skip dg-require-effective-target c++20/23/26
  if (/dg-require-effective-target\s+c\+\+(2[0-9]|[2-9][a-z])/.test(source))
    return false;

  // Skip sanitizers, threading, special features
  if (
    /dg-require-effective-target\s+(asan|tsan|lsan|ubsan|hwasan)/.test(source)
  )
    return false;
  if (/dg-require-effective-target\s+(pthread|tls|threads)/.test(source))
    return false;
  if (/dg-require-effective-target\s+(dfp|dfprt|avx|float16)/.test(source))
    return false;
  if (/dg-require-(ifunc|weak|alias|visibility|profiling|dlopen)/.test(source))
    return false;
  // Skip multi-file tests
  if (/dg-additional-sources/.test(source)) return false;
  // Skip GCC-only flags and features
  if (/\-frange-for-ext-temps/.test(source)) return false;
  // VLA with initializer is not supported by clang
  if (/dg-options\s+"[^"]*-Wvla/.test(source)) return false;
  // std::set_unexpected is removed in C++17 (GCC keeps it)
  if (/set_unexpected/.test(source)) return false;
  // GCC-specific ~auto() pseudo-destructor
  if (/~auto\s*\(/.test(source)) return false;
  // Tests defining their own std::initializer_list (clang rejects non-standard layout)
  if (/struct\s+initializer_list/.test(source) && /namespace\s+std/.test(source)) return false;

  // Skip GCC-only extensions
  if (/__builtin_is_corresponding_member/.test(source)) return false;
  if (/__builtin_mul_overflow_p|__builtin_add_overflow_p|__builtin_sub_overflow_p/.test(source)) return false;
  if (/__builtin_va_arg_pack/.test(source)) return false;
  if (/__builtin_dynamic_object_size/.test(source)) return false;
  if (/\bfor\s*\.\.\.\s*\(/.test(source)) return false;
  // Skip #embed tests (C23/GCC extension, limited clang support)
  if (/#\s*embed\b/.test(source)) return false;
  // Skip tests requiring __direct_bases (GCC type trait)
  if (/__direct_bases/.test(source)) return false;
  // Skip expansion statements (GCC C++26 template for)
  if (/\btemplate\s+for\b/.test(source)) return false;

  // Skip tests that #include headers not available in NEX
  const includes = source.matchAll(/#\s*include\s*<([^>]+)>/g);
  for (const inc of includes) {
    const header = inc[1];
    if (STL_HEADERS_UNAVAILABLE.has(header)) return false;
    // Skip GCC internal headers (not available in clang/libc++)
    if (header === "ext/numeric_traits.h") return false;
  }

  return true;
}

/** Directories to skip in g++.dg (test WASM-unsupported features) */
export const CPP_SKIP_DIRS = new Set([
  "modules",       // C++20 modules — not supported yet
  "contracts",     // C++26 contracts — not available
  "plugin",        // GCC plugin API — not applicable
  "pch",           // Precompiled headers — not supported
  "asan",          // Address sanitizer — not on WASM
  "tsan",          // Thread sanitizer — not on WASM
  "hwasan",        // Hardware address sanitizer
  "ubsan",         // Undefined behavior sanitizer
  "coroutines",    // C++20 coroutines — not yet supported
  "gcov",          // Code coverage — not applicable
  "lto",           // Link-time optimization tests — GCC-specific
  "graphite",      // GCC loop optimizer
  "analyzer",      // GCC static analyzer
  "goacc",         // OpenACC — not on WASM
  "gomp",          // OpenMP — not on WASM
  "tm",            // Transactional memory — not on WASM
  "tls",           // Thread-local storage — WASM single-threaded
  "tree-prof",     // Profile-guided optimization
  "cpp23",         // C++23 features — limited support
  "cpp26",         // C++26 features — not available
  "cpp2a",         // C++20 features — limited support
]);

/**
 * Build a regex for dg-output patterns (simple variant for C torture tests).
 */
function buildSimplePattern(raw: string): RegExp {
  const pat = raw
    .replace(/\\\n/g, "")
    .replace(/[.+?^${}()|[\]\\]/g, (c) =>
      c === "." ? "\\." : "\\" + c
    )
    .replace(/\*/g, ".*");
  return new RegExp(pat);
}

/**
 * Build a regex for dg-output patterns (C++ variant with escape handling).
 */
export function parseDgOutputCpp(source: string): RegExp | undefined {
  const m = source.match(/\{\s*dg-output\s+"((?:[^"\\]|\\.)*)"\s*\}/);
  if (!m) return undefined;
  let pat = m[1].replace(/\\\n/g, ""); // line continuations

  // Convert GCC regex escapes to JS
  pat = pat
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\|/g, "|")
    .replace(/\\\./g, "\\.")
    .replace(/\\\*/g, ".*");

  // Escape remaining metacharacters
  pat = pat.replace(/[+?^${}[\]]/g, (c) => "\\" + c);
  // Normalize newlines
  pat = pat.replace(/\n/g, "(?:\\r\\n|\\n|\\r)");

  return new RegExp(pat);
}
