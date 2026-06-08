# compiler-tests

Test-Suiten für den Lily Labs Polyglot-Compiler. Pullt die **aktuelle
veröffentlichte `lly`-Version vom RC** (Release Channel) und führt die
Testsuiten dagegen aus. Kein Source-Build, keine Submodule, kein
SSH-Key-Setup.

## Wie es funktioniert

```
┌─────────────────────────┐
│  rc.lilylabs.io         │   ← latest lly + plugins live hier
│  (RC / Release Channel) │
└──────────┬──────────────┘
           │ curl install.sh | bash
           ▼
┌─────────────────────────┐
│  GitHub Actions Runner  │
│  ├ lly (vom RC)         │
│  ├ plugins (via lly     │
│  │   plugin install)    │
│  └ testbench (TS)       │
└──────────┬──────────────┘
           │
           ▼
  Test-Suiten laufen, Pass-Rate
  pro Suite wird gemessen,
  Result-JSON ins Repo committed
```

## Was hier drin ist

```
.
├── .github/workflows/
│   └── test-compiler.yml     # manual + nightly + on-push
├── scripts/
│   ├── install-from-rc.sh    # curl install.sh + lly plugin install
│   └── run-suites.sh         # orchestriert testbench, emittiert summary
├── testbench/                # TS-Harness (kopiert aus prod/bench/testbench)
│   ├── src/                  # 29 Suite-Runner
│   ├── tests/                # eigene Fixtures (~60 MB)
│   ├── testbench.json        # Default-Config (für lokale Nutzung)
│   └── testbench.ci.json     # CI-Config — nutzt installiertes lly
├── results/                  # historische JSON-Reports (committed)
└── docs/                     # Platzhalter für Trend-Charts
```

## Welche Suiten laufen

| Suite | Was es prüft | Externes Korpus | Aktivierbar in CI |
|---|---|---|---|
| `c-brick` | C → WASM-Brick Roundtrip | — | ✅ default |
| `cpp-brick` | C++ → WASM-Brick Roundtrip | — | ✅ default |
| `brick-format` | Brick-Manifest-Validierung | — | ✅ default |
| `realworld-build` | Echte C/C++ Programme | — | ✅ default |
| `c-testsuite` | C-Korrektheit (c-testsuite/c-testsuite) | wird gepullt | ⏸ on-demand |
| `gcc-torture` | GCC C-Torture-Tests | gcc-mirror | ⏸ on-demand |
| `gcc-dg-cpp` | GCC C++-Diagnostics | gcc-mirror | ⏸ on-demand |
| `llvm-single` | LLVM single-source | llvm/llvm-test-suite | ⏸ on-demand |

**Nicht in CI (V1):** `test262`, `nex-stdlib` — die nutzen den
Legacy `nex`-Binary (oldies/nex), der nicht über RC verteilt wird.
Können nur lokal gegen einen selbst gebauten `nex` laufen. Wenn der
JS-Frontend nach machineroom migriert ist (geplant: M13), kommen sie
in die CI rein.

## Triggers

Auf GitHub manuell triggerbar (`Actions → Test Compiler → Run workflow`)
oder per CLI:

```bash
gh workflow run test-compiler.yml \
  --field suites="c-brick,cpp-brick,brick-format" \
  --field plugins="c cpp brick-format" \
  --field rc_url="https://rc.lilylabs.io"
```

**Inputs:**

| Input | Default | Bedeutung |
|---|---|---|
| `suites` | `c-brick,cpp-brick,brick-format,realworld-build` | Komma-separierte Suite-IDs oder `all` |
| `plugins` | `c cpp nextjs deploy brick-format` | Welche Plugins via `lly plugin install` geholt werden |
| `rc_url` | `https://rc.lilylabs.io` | Override für RC-Origin (z.B. Staging-RC) |

**Automatische Triggers:**
- `schedule '0 2 * * *'` — nightly um 02:00 UTC volle Suite
- `push` auf `main` wenn `testbench/`, `scripts/` oder Workflow geändert werden

## Workflow-Ablauf

1. Checkout dieses Repos
2. `apt install jq zstd curl`
3. Node 20 setup
4. `scripts/install-from-rc.sh`:
   - `curl rc.lilylabs.io/install.sh | bash` → `lly` Binary
   - `lly plugin install c cpp …` → Plugins in `~/.lly/plugins/`
   - Schreibt `bin/version.json` mit installed versions
5. Korpora-Cache wiederherstellen (test262, gcc, etc. werden nicht
   bei jedem Run frisch geklont)
6. `npm install` im testbench
7. `scripts/run-suites.sh` mit Suite-Liste
8. Report als Artefakt hochladen (90 Tage Retention)
9. Bei nightly/manual: `results/<YYYY-MM-DD>.json` ins Repo committen
10. Bei Test-Fail: Workflow rot

## Versionierung — was wird wirklich getestet?

Jeder Run schreibt am Anfang `bin/version.json`:

```json
{
  "lly_version": "lly 0.42.1 (920f...)",
  "rc_url": "https://rc.lilylabs.io",
  "plugins_requested": "c cpp nextjs deploy brick-format",
  "plugins_installed": "c=0.42.0 cpp=0.42.0 nextjs=0.41.3 ...",
  "installed_at": "2026-06-08T20:30:00Z"
}
```

Das wird dann mit der Result-Summary kombiniert ins `results/<date>.json`
geschrieben — du siehst also für jeden historischen Run sowohl
**welche Versionen** als auch **welche Ergebnisse**.

## Trend-Tracking

`results/<YYYY-MM-DD>.json` enthält Pass-Rate pro Suite. Geplant für
Phase 2:
- README-Badges mit aktueller Pass-Rate
- `docs/trend.html` (chart.js gegen die Historie)
- Auto-Issue bei Drop > 0.5 pp

## Lokales Setup (zum Testen vor Push)

```bash
# install.sh selbst ausführen
curl -fsSL https://rc.lilylabs.io/install.sh | bash -s -- \
  --install-dir ./bin

# Plugins holen
./bin/lly plugin install c cpp brick-format

# Testbench laufen lassen
cd testbench
npm install
PATH="../bin:$PATH" npm start -- --config testbench.ci.json --suite c-brick
```

## Sekrete (aktuell keine nötig)

Im Gegensatz zu Source-Build-CI brauchst du **keine** SSH-Deploy-Keys.
RC ist öffentlich erreichbar. Die einzigen optionalen Secrets:

| Name | Wofür |
|---|---|
| `SLACK_WEBHOOK_URL` | Failure-Alerts an Slack/Discord (optional) |

## Was die V1 nicht macht

- ❌ Spezifische lly-Version pinnen — install.sh holt immer "latest"
  pro Target. Wenn Version-Pin nötig: RC-Side eine Manifest-Datei
  pflegen und install.sh erweitern
- ❌ Legacy nex-Suiten (test262, nex-stdlib) — siehe oben
- ❌ Multi-Architektur-Tests (heute nur x86_64-linux; aarch64-macos läge
  in einem zweiten Job)
- ❌ Trend-Charts (Phase 2)
- ❌ Backbench-Integration (Phase 3 — Failures werden manuell ins
  Backbench übernommen)
