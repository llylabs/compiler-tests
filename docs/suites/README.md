# Suite Documentation Index

Each test suite that runs in CI has its own
documentation page explaining:

- **What it tests** — the specific compiler behavior
  under test
- **Why it matters** — why we picked this suite as a
  signal
- **What's in it** — composition of the test corpus
- **Current pass rate** — last known good number
- **How it runs** — orchestration details
- **Reproducing locally** — exact commands
- **Sources & license** — where the tests come from

## Suites in CI (every trigger runs all of them)

| Suite | Compiler | Pass rate | Doc |
|---|---|---|---|
| `c-brick` | C frontend | 100% | [c-brick.md](c-brick.md) |
| `cpp-brick` | C++ frontend | 100% | [cpp-brick.md](cpp-brick.md) |
| `brick-format` | output format | 100% | [brick-format.md](brick-format.md) |
| `realworld-build` | C/C++ end-to-end | 100% | [realworld-build.md](realworld-build.md) |
| `c-testsuite` | C, external | 99.5% | [c-testsuite.md](c-testsuite.md) |
| `gcc-torture` | C, GCC corpus | 85.6% | [gcc-torture.md](gcc-torture.md) |
| `gcc-dg-cpp` | C++ diagnostics | 83.9% | [gcc-dg-cpp.md](gcc-dg-cpp.md) |
| `llvm-single` | C/C++ via LLVM | 64.0% | [llvm-single.md](llvm-single.md) |

## See also

- [methodology.md](../methodology.md) — what we
  measure, what we don't, and why
- [auth-architecture.md](../auth-architecture.md) — how
  the CI authenticates to RC without secrets
- [main README](../../README.md) — overview and trigger
  instructions
- [trend page](https://llylabs.github.io/compiler-tests/)
  — pass-rate history
