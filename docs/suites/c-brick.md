# c-brick — C → WASM-Brick Roundtrip

## What it tests

Every C program in `testbench/tests/c/` is compiled by
the Lily Labs C compiler to a `.brick` (a WASM module
wrapped in our brick format), then executed by the
runtime. Output is compared byte-for-byte with the
expected output.

This is the **most basic correctness check** for the C
frontend: does our compiler produce a binary that does
what the C source says?

## Why it matters

If this suite ever turns red, our C compiler is broken.
It's the gate everything else depends on:
- `cpp-brick` builds on top of the same backend
- `c-testsuite` extends to the external corpus
- `realworld-build` exercises the same compiler with
  larger programs

Keep this green or nothing else matters.

## What's in it

163 test programs covering:

| Category | Count | Coverage |
|---|---|---|
| Arithmetic & integer types | 28 | int/long/short, signed/unsigned, overflow |
| Control flow | 22 | if/while/for/switch/goto |
| Functions | 31 | calls, recursion, varargs, function pointers |
| Pointers & arrays | 24 | indexing, arithmetic, multi-dimension |
| Structs & unions | 19 | members, nesting, bitfields |
| Preprocessor | 12 | #define, #if, #include |
| Strings & libc | 18 | printf, strlen, strcmp, memcpy |
| Edge cases | 9 | sizeof tricks, comma operator, ternary |

All tests are self-contained — no external dependencies,
no test corpus pulls, runs entirely against fixtures
checked into this repo.

## How a test is structured

```
testbench/tests/c/arithmetic/
├── source.c        # the program
├── expect.txt      # expected stdout
└── (optional)
    └── args.json   # command-line args to pass
```

Runner:
```
1. lly c build source.c → arithmetic.brick
2. lly run arithmetic.brick > actual.txt
3. diff expect.txt actual.txt   → pass if identical
```

Build flags: `-O0` (no optimization) plus
target-specific. The runner is in
`testbench/src/suites/c-brick.ts`.

## Origins

Tests in this suite come from three places:

1. **Self-written (47 tests)**: minimal programs we
   wrote to exercise specific language features. These
   live under `tests/c/handwritten/`.
2. **Adapted from c-testsuite (89 tests)**: BSD-2 licensed,
   trimmed down to programs that exercise core C without
   depending on libc features we don't fully implement
   yet. Provenance comment in each file.
3. **Real-world snippets (27 tests)**: small algorithms
   (binary search, sorting, hash, parsing) that should
   look identical to how a real codebase would write them.

## Current pass rate

**100% (163/163)** at last nightly run.

This is one of the suites we hold to a strict zero-failure
standard. If it drops, the nightly workflow opens a P0
issue automatically.

## Known limitations

- No floating-point edge-case coverage (those live in
  `gcc-torture`)
- No threading tests (those live in `pthread` suite,
  internal-only for now)
- No undefined-behavior edge cases (compiler-specific
  behavior; we don't try to match GCC bug-for-bug)

## Reproducing locally

```bash
# Install lly first (anonymously from RC)
curl -fsSL https://rc.lilylabs.io/install.sh | bash

# Install c plugin
lly plugin install c

# Clone and run
git clone https://github.com/llylabs/compiler-tests
cd compiler-tests/testbench
npm install
npm start -- --config testbench.ci.json --suite c-brick
```

You should see `[1/1] C Brick Compilation... 163/163 passed`.

## Sources & license

- Self-written tests: **MIT** (this repository)
- Adapted from c-testsuite: **BSD-2**, original at
  https://github.com/c-testsuite/c-testsuite
- Each test file has a header comment noting its origin.
