# realworld-build — Real-World C/C++ Programs

## What it tests

A curated set of small but **real** C/C++ programs
(not synthesized test cases) are built and
smoke-tested.

The idea: synthetic test corpora can be passed with
clever workarounds. Real programs require the
compiler to actually work the way users expect.

## Why it matters

Synthetic tests answer "did we implement the spec?"
Real-world programs answer "did we implement the
spec in a way actual code can use?"

## What's in it

20 real-world programs covering:

| Program | Domain | What it stresses |
|---|---|---|
| `hello-world` variants | bootstrap | basic libc, printf |
| `cat` | I/O | stdin/stdout/fd handling |
| `wc` | I/O + parsing | reading streams, counting |
| `cowsay` | string processing | string formatting |
| `md5sum` | crypto | bit-twiddling, memcpy |
| `tac` | algorithm | reverse iteration |
| `factor` | math | prime factorization |
| `b64` (encode + decode) | algorithm | bit-shift loops |
| `compress` | algorithm | LZW or RLE |
| (and several more) |

Each program ships with a build-script and a
smoke-test (input + expected output).

## Current pass rate

**100% (20/20)** at last nightly run, with **5
programs additionally cap-tested** end-to-end.

## How a test is structured

```
testbench/tests/realworld/wc/
├── source.c
├── build.sh        # how to invoke lly to build it
├── smoke.sh        # what to run + expected output
└── expect.txt
```

The runner executes:
```
1. bash build.sh         → wc.brick
2. bash smoke.sh         → captured_output
3. diff expect.txt captured_output → pass if match
```

For 5 of the programs, an additional `cap-deploy`
phase runs the brick on a real CAP-VM and verifies
behavior end-to-end. This bridges from "compiler
correctness" to "platform correctness".

## Why these specific programs

We picked programs that:
1. Are **small** (build in <1 second)
2. Have **deterministic output** (no timestamps, no
   random)
3. Cover a **distinct technique** (no two test the
   same surface)
4. Are **recognizable** (a reader can verify the
   smoke-test makes sense)

This is deliberately not a benchmark suite. It's an
"is the compiler usable" suite.

## Reproducing locally

```bash
curl -fsSL https://rc.lilylabs.io/install.sh | bash
lly plugin install c cpp
git clone https://github.com/llylabs/compiler-tests
cd compiler-tests/testbench && npm install
npm start -- --config testbench.ci.json --suite realworld-build
```

## Sources & license

Most programs are short rewrites or adaptations of
public-domain Unix utilities. Where code is derived
from external sources, the file header credits the
origin and applicable license. Our test scaffolding:
MIT, this repo.
