# Real-World C/C++ Build Suite

This suite compiles real-world C/C++ projects through `nex-cc` (the
`c-compiler` plugin) and verifies four things per program:

1. **build**  — brick comes out of the compiler
2. **format** — manifest.json is valid, .wasm files are well-formed
3. **caps**   — the brick declares the expected `syscall_caps`
4. **smoke**  — running the brick produces the expected stdout/exit

## Layout

```
tests/realworld/<id>/
  program.json       # config (sources, defines, smoke expectations)
  driver.c           # optional main() if the project is a library
  <stub-headers>.h   # optional header stubs (e.g. miniz_export.h)
```

Sources are either pre-cached via `source.local_dir` or fetched on demand
into `.data/realworld/<id>/` (sha256-pinned).

## Run

```bash
# All programs
npm start -- --suite realworld-build

# Subset
REALWORLD_ONLY=bzip2,miniz npm start -- --suite realworld-build
```

## Current Status (2026-04-28)

| Program     | Status | Notes |
|-------------|--------|-------|
| bzip2 1.0.8 | ✅ 4/4 | round-trip compress/decompress |
| miniz 3.0.2 | ✅ 4/4 | mz_compress/mz_uncompress round-trip |
| cjson 1.7.18 | ❌ build | strlen import-module mismatch (libc vs env) |
| lua 5.4.6   | ❌ build | machineroom static stdio.h missing freopen/_IONBF/tmpfile/etc. |
| sqlite-cli  | ❌ build | strlen mismatch + os_unix.c needs `struct flock`/FILENAME_MAX |

## Known Issues (M9 follow-ups)

### 1. strlen / fputs `import_module` mismatch (cjson, sqlite-cli)

`machineroom/static/include/string.h` declares
`__attribute__((import_module("libc"))) strlen(...)`. The wasi-sysroot's
`libc.a` (`__wasilibc_real.o`, `fputs.o`) however imports `strlen` from
module `env`. When wrapper.o (libc-namespaced) and fputs.o (env-namespaced)
both end up in the link, wasm-ld errors:

```
wasm-ld: error: import module mismatch for symbol: strlen
>>> defined as libc in /tmp/wrapper-XXX.o
>>> defined as env in /home/leon/wasi-sdk/.../libc.a(fputs.o)
```

bzip2 happens to work because its `printf` calls use no `%s` and don't
pull in `fputs.o`. cjson's `cJSON_PrintUnformatted` and sqlite's stdio
paths do.

**Fix direction:** unify the import module across the static-includes and
the wasi-sysroot-linked archives — either drop the libc-namespaced
overrides for functions that wasi-sysroot already provides, or post-link
rewrite imports to a single namespace.

### 2. machineroom static stdio is incomplete (lua)

`stdio.h` is missing: `freopen`, `tmpfile`, `popen`, `pclose`, `setvbuf`,
`_IONBF`, `_IOFBF`, `_IOLBF`, `BUFSIZ` is fine but the buffering knobs
aren't there. `string.h` is missing `strpbrk`. `time.h` is missing
`gmtime_r`, `localtime_r`. lua 5.4's `loslib.c`, `liolib.c`, `lauxlib.c`
need these.

**Fix direction:** complete the stub headers under
`machineroom/static/include/` to forward-declare these as `import_module
"libc"` shims that the runtime resolves (they already exist as builtins
or POSIX-layer in M2).

### 3. SQLite os_unix.c needs unix-only types (sqlite-cli)

Even with `SQLITE_OS_OTHER=1`, sqlite3.c amalgamation still compiles
`os_unix.c` paths that reference `struct flock` (fcntl locking) and
`FILENAME_MAX`. wasi-sysroot doesn't expose `struct flock`.

**Fix direction:** apply more focused `SQLITE_OS_OTHER` gating, or
provide a custom VFS in driver.c (sqlite needs explicit
`sqlite3_vfs_register` when OS_OTHER=1).

## Architecture Note

The `c-compiler` plugin only accepts a single `--source` argument, so this
suite generates a `wrapper.c` that `#include`s every project source file
(amalgamation-style). Defines are emitted as `#define X Y` at the top.
`driver_file` (when present) is appended raw — it's the
`main()` for libraries that don't ship one.

Debug artifacts on build failure land in `.data/realworld/_debug/<id>/`
(wrapper.c + compile_stderr.log).
