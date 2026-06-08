# c-testsuite Skip-Audit

**Status (2026-04-28):** 218/220 (99.1%) passing, **0 skipped**, 2 echte Failures.

## Zusammenfassung

Die zuvor "98 skipped" waren **alle** Kategorie C (fälschlicherweise geskippt).

Ursache: `bench/testbench/src/suites/c-testsuite.ts` filterte Tests mit dem
Tag `needs-cpp` heraus unter der falschen Annahme, das stehe für "needs C++".

Tatsächlich definiert das Upstream-README
(`.data/c-testsuite/README.md`) den Tag explizit:

> `needs-cpp` — Test relies on the preprocessor

Es geht um den **C-Preprocessor**, nicht um C++. Alle 98 Tests sind reguläres C
und müssen ausgeführt werden. Filter wurde entfernt
(`c-testsuite.ts:28-39`, Audit-Kommentar verbleibt im Code).

## Resultat nach Filter-Entfernung

| Vor Audit | Nach Audit |
|---|---|
| 122/220 passed, 98 skipped | 218/220 passed, 0 skipped |
| Behauptete Pass-Rate: 100% (122/122) | Echte Pass-Rate: 99.1% (218/220) |

96 zuvor versteckte Tests laufen grün durch. 2 sind echte Bugs.

## Verbleibende Failures (Kategorie A — Compiler/Sysroot-Bug)

### 00179.c — strlen Linker-Modulkonflikt

**Symptom:**
```
wasm-ld: error: import module mismatch for symbol: strlen
>>> defined as libc in /tmp/00179-XXXXXX.o
>>> defined as env in wasi-sysroot/lib/wasm32-wasi/libc.a(fputs.o)
>>> defined as env in wasi-sysroot/lib/wasm32-wasi/libc.a(strchrnul.o)
```

**Kategorie:** A — Compiler/Linker-Konfigurations-Bug.

**Diagnose:** Unser Code generiert `strlen` als Import aus Modul `libc`,
während wasi-sysroot dasselbe Symbol als Import aus `env` verlangt.
Modul-Naming-Inkonsistenz zwischen unseren libc-Stubs und wasi-libc.

**Tracking:** `bench/backbench/workspaces/machineroom/c-testsuite-00179-strlen-modconflict`

### 00204.c — `long double` in HFA-Struktur

**Symptom:** exit 1, Trap in `fa_hfa31`.

```c
struct hfa31 { long double a; } hfa31 = { 31.1 };
void fa_hfa31(struct hfa31 a) { printf("%.1Lf\n", a.a); }
```

**Kategorie:** A — Compiler-Feature-Lücke (long double / Homogeneous-FP-Aggregate).

**Diagnose:** Test ist im Header explizit als arm64-spezifisch markiert
("designed to test some arm64-specific things, such as the calling
convention"). wasm32 hat eigene Calling-Convention für aggregierte
Floating-Point-Typen; `long double` (i128 / fp128) Struct-Übergabe ist
nicht voll implementiert. Trap im `printf "%.1Lf"`-Pfad.

**Tracking:** `bench/backbench/workspaces/machineroom/c-testsuite-00204-long-double-hfa`

## Kategorisierung gemäß M8 Phase 3

| Kategorie | Definition | Anzahl |
|---|---|---|
| A_compiler_bug | Echte Compiler/Runtime/Sysroot-Lücke, Backbench-Eintrag erforderlich | 2 |
| B_unsupported_external | Tests benötigen externe Tools/OS-Features, die wir bewusst nicht unterstützen | 0 |
| C_wrongly_skipped | Tests die ohne Grund geskippt wurden, müssen regulär laufen | 98 (alle entfernt) |

## Verifikation

```bash
cd /home/leon/prod/bench/testbench
npm start -- --suite c-testsuite
# Erwartet: 218/220 passed, 0 skipped, 2 failed
# Failures: 00179.c, 00204.c
```

Letzter Run: `output/2026-04-28T06-50-16/report.json` — passed=218, failed=2, skipped=0.
