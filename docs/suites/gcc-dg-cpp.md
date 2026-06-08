# gcc-dg-cpp — GCC's C++ Diagnostics Tests

## What it tests

The C++ diagnostics portion of GCC's test suite
([gcc-mirror/gcc:gcc/testsuite/g++.dg](https://github.com/gcc-mirror/gcc/tree/master/gcc/testsuite/g%2B%2B.dg)).

These tests use the **DejaGNU** harness — they include
inline directives that tell the test runner what the
compiler is *expected* to do (warnings, errors at
specific lines, optimization hints).

A test passes if the compiler's diagnostic output
matches the expected directives.

## Why it matters

Beyond "does it compile", this measures **how
faithfully our C++ frontend reports problems**.
Are we issuing errors on the right line numbers? Are
we warning where GCC warns? Are we silent where GCC
is silent?

For a polyglot compiler trying to be a drop-in for
GCC users, diagnostic compatibility is a serious
trust signal.

## What's in the corpus

1158 test files in g++.dg:

| Subdir | What |
|---|---|
| `template/` | template instantiation diagnostics |
| `inherit/` | inheritance / virtual / RTTI errors |
| `parse/` | grammar error recovery |
| `warn/` | -W flag-driven warnings |
| `cpp1[14579]/` | per-C++-standard features |
| `cpp2[023]/` | C++20/23 features |
| `ext/` | GCC C++ extensions |
| etc. |

Files contain DejaGNU directives like:
```cpp
int x = "foo"; // { dg-error "cannot convert" }
```

The runner extracts these expectations and matches
them against our compiler's actual output.

## Current pass rate

**83.9% (971/1158)** at last nightly run.

The 187 failures concentrate in:
- `ext/`: GCC-specific extensions (~60 failures)
- `cpp20/`, `cpp23/`: modern C++ we haven't fully
  implemented (~50 failures)
- `template/`: template error message differences
  (~30 failures — often just different wording,
  same error)
- `warn/`: warning categories we don't implement
  yet (~25 failures)

## How it runs

Uses our custom DejaGNU directive parser
(`testbench/src/dg-parser.ts`). For each test file:

```
1. Parse { dg-* } directives
2. Run lly cpp build $file, capture stderr
3. Match each directive against captured output
4. Pass if all directives match, fail otherwise
```

Concurrency: 8 parallel jobs.

## Current pass rate caveat

The "real" pass rate is hard to compare with GCC's
own — GCC obviously passes its own tests by
construction (the tests are written for GCC's exact
output). 83.9% means we get the same conclusion
83.9% of the time, even though our exact wording may
differ.

We don't normalize wording — if GCC says "error: X"
and we say "error: X-thing-not-found", that counts
as a mismatch.

## Reproducing locally

```bash
curl -fsSL https://rc.lilylabs.io/install.sh | bash
lly plugin install cpp
git clone https://github.com/lilylabs/compiler-tests
cd compiler-tests/testbench && npm install
npm start -- --config testbench.ci.json --suite gcc-dg-cpp
```

## Sources & license

- Test corpus: **gcc-mirror/gcc** g++.dg under GPL-3
  (cloned at runtime, not redistributed).
- DejaGNU directive parser: MIT, this repo.
