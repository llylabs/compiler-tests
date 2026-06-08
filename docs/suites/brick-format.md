# brick-format — Brick Manifest Format Validation

## What it tests

Every `.brick` file the compiler emits gets validated
against the format specification:
- Manifest schema (JSON-fields, types, required vs
  optional)
- WASM module is well-formed (parseable by wasmtime)
- Declared exports actually exist
- Declared imports are all satisfiable
- No undeclared host-function dependencies

## Why it matters

The brick format is the **contract** between compiler
and runtime. If the compiler produces bricks the
runtime can't load — or vice versa — nothing else
works.

This suite is intentionally fast and self-contained;
it should always pass and serves as a smoke-check
that the compiler's output structure isn't drifting.

## Current pass rate

**100%** at every nightly run since inception.

## What "validation" includes

```yaml
manifest:
  - schema_version: present, valid integer
  - bricks: array of brick descriptors
  - each brick:
    - id: kebab-case, unique within manifest
    - type: "static" | "dynamic"
    - wasm: filename present in archive
    - exports: every listed export exists in the WASM
    - imports: every WASM import is either host-known
        or declared in the manifest

wasm_validation:
  - parses cleanly with wasmtime::Module::new()
  - all referenced types are well-formed
  - all referenced functions have matching signatures

cross_reference:
  - manifest.exports ⊆ wasm exports
  - wasm imports ⊆ (host_imports ∪ manifest.bricks[*].exports)
```

If any check fails, the test fails — and a P0 issue
opens automatically.

## Reproducing locally

```bash
curl -fsSL https://rc.lilylabs.io/install.sh | bash
lly plugin install brick-format
git clone https://github.com/lilylabs/compiler-tests
cd compiler-tests/testbench && npm install
npm start -- --config testbench.ci.json --suite brick-format
```

## Sources & license

Self-written, MIT, this repo.
