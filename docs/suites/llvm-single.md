# llvm-single — LLVM single-source tests

## What it tests

The single-source portion of the LLVM test suite
([llvm/llvm-test-suite](https://github.com/llvm/llvm-test-suite)
under `SingleSource/`).

Each test is a single `.c` or `.cpp` file that should
compile, run, and produce output matching a reference
file. Used by LLVM itself to test Clang.

## Why it matters

This is the "**how would Clang's own test suite judge
us?**" question.

LLVM's tests cover a different distribution than
GCC's — they emphasize:
- Modern C/C++ features (C99/C11/C++14/17)
- POSIX system call coverage (signals, threads,
  pipes, file I/O)
- Floating-point conformance
- Optimizer regression patterns

Together with `gcc-torture` and `gcc-dg-cpp`, the
three external corpora triangulate compiler quality
from three independent perspectives.

## What's in the corpus

2642 single-source tests across:

| Category | Examples |
|---|---|
| **Benchmarks** | small numeric kernels (Whetstone, Linpack) |
| **Regression** | historical Clang bug repros |
| **POSIX** | signals, fork, pipe, select |
| **FP** | IEEE 754 corners, denormals, FMA |
| **Library** | stdlib edge cases, malloc patterns |

## Current pass rate

**64.0% (1691/2642)** at last nightly run.

This is our lowest-scoring conformance suite — and
the reasons are well-understood:
- ~400 failures: POSIX features we don't expose
  through WASI yet (signals, pipes, fork)
- ~250 failures: floating-point exact-bit
  conformance (we don't expose extended-precision)
- ~200 failures: thread/atomics tests that need
  our multi-brick + WASI-threads stack matured
- ~100 failures: timing-dependent tests

The trend is upward as our WASI implementation
expands. We test it publicly because hiding it
wouldn't make us better.

## How it runs

```
1. Clone llvm/llvm-test-suite SingleSource/ subset (cached)
2. For each test:
   - Compile (lly c or lly cpp depending on extension)
   - Run, capture stdout
   - Match against reference output
3. Report
```

Concurrency: 8 parallel jobs.

## Reproducing locally

```bash
curl -fsSL https://rc.lilylabs.io/install.sh | bash
lly plugin install c cpp
git clone https://github.com/lilylabs/compiler-tests
cd compiler-tests/testbench && npm install
npm start -- --config testbench.ci.json --suite llvm-single
```

Expect 30-60 minutes for a full run.

## Sources & license

- Test corpus: **llvm/llvm-test-suite** under
  Apache 2.0 with LLVM exceptions (cloned at
  runtime, not redistributed in this repo).
- Our runner: MIT, this repo.
