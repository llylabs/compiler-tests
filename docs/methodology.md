# Methodology

How we test the Lily Labs compiler — what we measure, what
we don't, and why.

## Principles

### 1. We test the *published* compiler

The CI workflow downloads the same `lly` binary that
anyone can install with:

```bash
curl -fsSL https://rc.lilylabs.io/install.sh | bash
```

We do not build the compiler from source inside the test
workflow. We don't apply patches. We don't run against
internal development branches. The number you see is the
number a user would get if they installed today.

### 2. No mocks, no skips, no cherry-picking

Every test in every suite runs. Failures are reported as
failures. Skipped tests are documented separately and
counted toward "not run" — never folded into the pass
count.

If a test is excluded permanently (e.g. it tests a
feature we explicitly don't support), the exclusion lives
in a versioned `*-skips.md` file with a reason and a
link to the upstream issue or discussion. Excluded counts
are always shown alongside pass/fail.

### 3. Reports include the failing test names

We don't just publish pass rates. Each run produces a JSON
report listing every failing test. This is committed to
the repo, so you can `git log` the regression history of
any individual test.

### 4. Trend matters more than a single number

A 90% pass rate that drops to 89% next week is a
regression we'll investigate. A 95% pass rate that holds
steady for three months is a stronger signal than a 98%
pass rate measured once.

See [the trend page](https://lilylabs.github.io/compiler-tests/)
for the history.

## How runs work

1. **Schedule**: nightly at 02:00 UTC. Plus on-push for
   `testbench/` or `scripts/` changes, plus manual via
   `workflow_dispatch`.
2. **Compiler version**: fetched from RC at start of run.
   The exact `lly --version` output is recorded in
   `bin/version.json` and merged into the result file.
3. **Plugin versions**: each plugin downloaded from RC is
   recorded too.
4. **Corpora versions**: external test suites
   (test262, gcc, etc.) are pinned to specific commit
   SHAs in `testbench/testbench.ci.json`. The SHA is
   included in the run manifest.
5. **Environment**: GitHub-hosted `ubuntu-latest` runner.
   The runner image SHA is in the artifact upload.
6. **Result**: one JSON file per suite under
   `testbench/output/<timestamp>/`, plus an aggregate
   `results/<YYYY-MM-DD>.json` committed to the repo.

## What we deliberately don't measure (yet)

### Performance benchmarks

This repository covers **correctness only**. Our
performance / throughput / startup benchmarks live in a
separate suite (`marker`), not yet public. When it
becomes public, we'll link it from this README.

### Cross-platform variance

We test on `x86_64-linux` only. `aarch64-linux`,
`x86_64-macos`, `aarch64-macos` are tested locally
before each release but not in this public CI. Adding
multi-arch matrix is on the roadmap.

### Old compiler versions

Each nightly run tests the **currently published**
compiler. We don't run historical regressions —
instead, the `results/` directory is a sequential log
of every nightly run since the beginning, which serves
the same purpose.

### Real-world application correctness

Suites like `cap-http`, `e2e-deploy`, `react-ssr` test
the *runtime* and *cloud-stack* end-to-end, not just
compiler output. They run in their own (internal)
CI because they need infrastructure access. The pure
compiler-correctness suites are what's tested here.

## What "pass rate" means per suite

| Suite type | What "passed" means |
|---|---|
| **Compile-only** (gcc-dg-cpp diagnostics) | source compiles without unexpected diagnostics |
| **Compile + run** (most C/C++ suites) | source compiles, output binary runs, exit code 0 |
| **Compile + run + match** (c-testsuite) | exit code 0 *and* stdout matches expected file byte-for-byte |
| **Conformance** (test262, when added) | TC39 negative tests fail correctly, positive tests run without exception |

Each suite's `docs/suites/<name>.md` explains its
specific definition.

## Why some baselines are below 100%

Several reasons, all documented per suite:

- **GCC torture & gcc-dg-cpp**: many tests exercise
  GCC-specific extensions (`__attribute__((cleanup))`,
  nested functions, computed gotos) that we haven't
  implemented yet. These are tracked as features, not
  bugs.
- **LLVM single-source**: large fraction relies on
  POSIX features (mmap, signals, threading) where our
  WASI implementation is still partial.
- **test262**: 15+ pp gap to Node.js is real — we're
  catching up suite-by-suite. The trend is upward.

We could artificially boost these numbers by adding
custom skip lists. We deliberately don't, because the
gap tells the truthful story of where we are.

## How to dispute a result

If you think a test was unfairly judged (e.g. our
compiler rejected a program that should compile),
**[open an issue](../../issues/new)** with:

1. The suite name and test ID
2. The expected vs actual output
3. Ideally a minimal repro

We respond to disputes within the week.

## How to add a suite

Edit `testbench/testbench.ci.json`, add a stanza
pointing to the new test corpus. Create a runner under
`testbench/src/suites/<name>.ts` that returns a
standard result struct. Add `docs/suites/<name>.md`
explaining what and why.

The CI matrix will pick it up automatically on the
next nightly run.
