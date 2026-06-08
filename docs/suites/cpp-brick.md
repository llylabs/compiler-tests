# cpp-brick — C++ → WASM-Brick Roundtrip

## What it tests

Same model as `c-brick`, but for C++. Programs in
`testbench/tests/cpp/` are compiled, run, and their
output verified against expected files.

## Why it matters

C++ is the language with the most surface area we
support. Templates, exceptions, RTTI, the STL — all
need to round-trip through our compiler into a working
WASM-brick.

If C++ regresses, it's almost always a frontend-level
bug (template instantiation, name mangling, virtual
dispatch). Catching them early in this suite saves
hours of `gcc-dg-cpp` debugging.

## What's in it

204 test programs covering:

| Category | Coverage |
|---|---|
| **Basic OOP** | classes, inheritance, virtual functions |
| **Templates** | function templates, class templates, partial specialization |
| **STL** | vector, map, string, algorithm |
| **Exceptions** | throw/catch, stack unwinding, terminate |
| **RTTI** | typeid, dynamic_cast |
| **Modern C++** | move semantics, lambdas, auto, range-for |
| **Pre-processor** | C++-specific macros, #pragma once |

## Current pass rate

**100% (204/204)** at last nightly run.

Like `c-brick`, this is a zero-failure hold suite.

## Known limitations

- No coroutines (C++20 feature, not yet implemented)
- No modules (`import std;` etc — not yet implemented)
- No `<format>` (C++20, not yet implemented)

The advanced C++ corpus is exercised by `gcc-dg-cpp`
(below) which has a much larger feature surface and
correspondingly lower pass rate.

## Reproducing locally

```bash
curl -fsSL https://rc.lilylabs.io/install.sh | bash
lly plugin install cpp
git clone https://github.com/lilylabs/compiler-tests
cd compiler-tests/testbench && npm install
npm start -- --config testbench.ci.json --suite cpp-brick
```

## Sources & license

Self-written, **MIT** licensed. A few tests are derived
from public examples (cppreference.com), with credit in
the file header.
