# c-testsuite — c-testsuite/c-testsuite

## What it tests

The established **c-testsuite** ([github.com/c-testsuite/c-testsuite](https://github.com/c-testsuite/c-testsuite))
is a portable C compiler conformance suite — designed
to be runnable against any C compiler claiming
correctness.

220 small C programs, each paired with an expected
exit code and an expected stdout. A test passes when
both match exactly.

## Why it matters

This is the **objective baseline** test suite for C
correctness. It's compiler-agnostic, lives in a separate
project, and has been used to test GCC, Clang, TCC,
chibicc, lcc, and other C compilers. When we say "we
pass 99.5% of c-testsuite", that's a number that means
something outside our own ecosystem.

Where `c-brick` is "we test our own corpus", this is
"we test ourselves with someone else's questions."

## Current pass rate

**99.5% (219/220)** at last nightly run.

The single failure is documented in
[`testbench/c-testsuite-skips.md`](../../testbench/c-testsuite-skips.md)
with a link to the upstream issue and our position.

## How it runs

```
1. Clone https://github.com/c-testsuite/c-testsuite (cached)
2. For each tests/*.c file in the corpus:
   a. lly c build $file → out.brick
   b. lly run out.brick → captured_stdout, captured_exit
   c. Match against $file.expected_stdout and $file.expected_exit
3. Report pass/fail counts + names of failing tests
```

Concurrency: 8 parallel test jobs (configurable in
testbench.ci.json).

## Pinned corpus version

The c-testsuite repo is pinned by commit SHA in the
test config. When we update the pin, we document the
diff and any pass-rate movement in the commit message.

Current pin: see `testbench/testbench.ci.json`.

## Reproducing locally

```bash
curl -fsSL https://rc.lilylabs.io/install.sh | bash
lly plugin install c
git clone https://github.com/llylabs/compiler-tests
cd compiler-tests/testbench && npm install
npm start -- --config testbench.ci.json --suite c-testsuite
```

First run: corpus gets cloned to `.data/c-testsuite/`
(~5 MB).

## Sources & license

- Test corpus: **c-testsuite/c-testsuite** under BSD-2.
- Our test runner: MIT, this repo.
