# compiler-tests

Test-Suiten für den Lily Labs Polyglot-Compiler (`machineroom`) und die
Legacy JS-Frontend (`oldies/nex`). Eine einzige Pipeline die alle
Konformitäts- und Regressions-Tests durchläuft.

## Was hier drin ist

```
.
├── .github/workflows/
│   └── test-compiler.yml    # CI workflow (manual + nightly + on-push)
├── scripts/
│   ├── build-compilers.sh   # baut machineroom + oldies/nex aus Source
│   ├── install-corpora.sh   # pre-pullt externe Korpora nach .data/
│   └── run-suites.sh        # ruft testbench mit Suite-Liste auf
├── testbench/               # der TS-Harness (kopiert aus bench/testbench)
│   ├── src/                 # Runner pro Suite-Type
│   ├── tests/               # eigene Test-Fixtures (~40 MB)
│   ├── testbench.json       # Default-Suite-Config (lokal verwendbar)
│   └── testbench.ci.json    # CI-Variante mit angepassten Pfaden
├── results/                 # historische JSON-Reports (committed)
└── docs/                    # rendered trend pages (github-pages target)
```

## Welche Suiten gibt es

Stand der lokalen Baseline (siehe `CLAUDE.md` im prod-monorepo):

| Suite | Compiler | Baseline | Externes Korpus |
|---|---|---|---|
| `c-brick` | machineroom (C) | 100% (163/163) | — |
| `cpp-brick` | machineroom (C++) | 100% (204/204) | — |
| `nex-stdlib` | oldies-nex (JS) | 100% (53/53) | — |
| `realworld-build` | machineroom | 100% (20/20) | — |
| `c-testsuite` | machineroom | 99.5% (219/220) | c-testsuite/c-testsuite |
| `cpp-brick` (gcc-dg-cpp) | machineroom | 83.9% (971/1158) | gcc-mirror/gcc |
| `gcc-torture` | machineroom | 85.6% (1634/1908) | gcc-mirror/gcc |
| `llvm-single` | machineroom | 64.0% (1691/2642) | llvm test-suite Subset |
| `test262` | oldies-nex (JS) | 79.33% (35836/45171) | tc39/test262 |
| `brick-format` | machineroom | — | — |
| `pthread` | machineroom (M6 DoD) | — | — |
| `m7` | machineroom (Rust+Go DoD) | — | — |
| `react-ssr`, `cap-http`, `e2e-deploy` | end-to-end | — | — |

Die volle Liste steht in [`testbench/testbench.json`](testbench/testbench.json).

## Lokal laufen lassen

Setzt voraus: `nex` (Legacy JS-Compiler) und `lly` Binary unter
`$HOME/.local/bin/lly`, Plugins gebaut in
`../../farm/plugins/target/release/`.

```bash
cd testbench
npm install
npm start -- --suite c-brick
npm start -- --suite cpp-brick
npm start -- --suite c-testsuite
```

Pfade werden über `testbench.json` aufgelöst. Wenn die Pfade nicht
passen, eine eigene Config-Datei nutzen:

```bash
npm start -- --config ../my-config.json --suite c-brick
```

## CI-Workflow

Auf GitHub manuell triggerbar (`Actions → Test Compiler → Run workflow`)
oder per `workflow_dispatch` aus der CLI:

```bash
gh workflow run test-compiler.yml \
  --field suites="c-brick,cpp-brick,nex-stdlib" \
  --field machineroom_ref="main"
```

Inputs:
- `suites` — Komma-separierte Suite-IDs (oder `all` für alle aktivierten)
- `machineroom_ref` — Branch/SHA von `machineroom` (default: `main`)
- `nex_ref` — Branch/SHA von `oldies/nex` (default: `main`)

Was die CI macht:
1. Checkout dieses Repos
2. Checkout `machineroom` (SSH-Deploy-Key in Secrets)
3. Checkout `oldies/nex` (SSH-Deploy-Key in Secrets)
4. Rust-Toolchain mit Cache → Build der Compiler
5. Node 20 → `npm ci` im testbench
6. External Korpora aus Cache wiederherstellen
7. Selektierte Suiten laufen lassen
8. Report als Artefakt uploaden
9. `results/<date>.json` ins Repo committen
10. Bei Regression: GitHub-Issue öffnen

## Sekret-Setup auf GitHub

In Repo-Settings → Secrets and variables → Actions:

| Name | Inhalt |
|---|---|
| `MACHINEROOM_DEPLOY_KEY` | SSH-Privatkey mit Read-Access auf `machineroom`-Repo |
| `NEX_DEPLOY_KEY` | SSH-Privatkey mit Read-Access auf `oldies/nex`-Repo |
| `SLACK_WEBHOOK_URL` *(optional)* | Webhook für Failure-Alerts |

Anleitung zum Generieren:

```bash
# Auf jeder Source-Repo-Seite (z.B. gitlab.lily1/machineroom):
ssh-keygen -t ed25519 -f /tmp/machineroom-deploy -N ''
# → Private Key in MACHINEROOM_DEPLOY_KEY auf GitHub einfügen
# → Public Key als Deploy-Key auf GitLab-Repo einfügen (read-only)
```

## Trend-Tracking

Jeder erfolgreiche Lauf committed `results/<YYYY-MM-DD>.json` ins Repo.
Aus diesem CSV wird automatisch:
- README-Badges für die Top-Suiten aktualisiert
- `docs/trend.html` neu generiert (chart.js gegen die history)
- Bei Pass-Rate-Drop > 0.5 pp: GitHub-Issue mit Label
  `regression auto-found`

## Was fehlt (Roadmap)

- [ ] Backbench-Integration: Failure-Cluster → Auto-Bug-Vorschläge
- [ ] Matrix-Strategie für test262 (5 parallele Shards)
- [ ] PR-Smoke separate vom Nightly (heute alles ein Workflow)
- [ ] Compiler-Build-Artefakt cachen für Re-Runs gleicher SHA
- [ ] Optional: Compiler-Binaries von RC pullen statt selbst bauen
