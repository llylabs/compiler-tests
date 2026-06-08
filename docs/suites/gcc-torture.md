# gcc-torture — GCC's own C Torture Tests

## What it tests

The C-Torture portion of the GCC test suite
([gcc-mirror/gcc:gcc/testsuite/gcc.c-torture](https://github.com/gcc-mirror/gcc/tree/master/gcc/testsuite/gcc.c-torture)).

These are the C programs GCC's own developers use to
torture-test GCC. They cover edge cases that have
historically broken GCC over decades — and now they
torture us.

## Why it matters

If you tell a compiler-aware engineer "we pass 85% of
the GCC torture suite", they immediately know
- you're a serious compiler project
- you've shipped enough to hit the same edge-cases
  GCC's authors have catalogued
- your remaining 15% is probably weird-corner-case
  language features (and indeed it is)

## What's in the corpus

1908 test programs in three subdirectories:

| Subdir | What |
|---|---|
| `compile/` | should compile (we ignore output) |
| `execute/` | should compile + run + exit 0 |
| `unsorted/` | mixed |

Notable categories that drive most of our failures:
- **GCC extensions**: `__attribute__((cleanup))`,
  computed gotos, nested functions, statement
  expressions
- **Floating-point edge cases**: extended-precision,
  NaN payloads, IEEE 754 corners
- **Inline assembly**: `__asm__` blocks
- **Wide-character / locale-dependent**: depend on
  exact libc behavior we don't fully match

## Current pass rate

**85.6% (1634/1908)** at last nightly run.

The 274 failures break down roughly:
- ~120 use GCC extensions we don't support
- ~80 hit floating-point edge cases (FP-stack
  rounding behavior, denormalized handling)
- ~50 inline assembly
- ~24 require POSIX features (signals, mmap) where
  our WASI is partial

We don't artificially skip these. They're counted as
failures and the gap is visible in the trend chart.

## How it runs

```
1. Sparse-clone gcc-mirror/gcc with only
   gcc/testsuite/gcc.c-torture (cached, ~80 MB)
2. For each *.c in the corpus:
   - Try to compile (varies by subdir)
   - For execute/: also run, check exit code
3. Report pass/fail counts
```

Concurrency: 8 parallel jobs.

## Pinned version

GCC mirror commit pinned in
`testbench/testbench.ci.json`. We re-pin every ~6
months and document movement in the commit.

## Reproducing locally

```bash
curl -fsSL https://rc.lilylabs.io/install.sh | bash
lly plugin install c
git clone https://github.com/llylabs/compiler-tests
cd compiler-tests/testbench && npm install
# First run: ~80 MB sparse-clone of gcc mirror (cached)
npm start -- --config testbench.ci.json --suite gcc-torture
```

Expect 10-30 minutes for a full run on a modern
machine.

## Sources & license

- Test corpus: **gcc-mirror/gcc** under GPL-3 (we use
  the tests as test data, not redistribute them in
  this repo; they're cloned at run time).
- Our runner: MIT, this repo.
