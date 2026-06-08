# Test Results

Historische Ergebnisse — pro CI-Lauf wird ein `<YYYY-MM-DD>.json`
committet, das die Pass-Rates pro Suite enthält.

Schema:

```json
{
  "suites": [
    {
      "id": "c-brick",
      "status": "ok",
      "duration_s": 42,
      "passed": 163,
      "total": 163
    }
  ]
}
```

`scripts/update-trend.sh` (TODO) baut daraus `docs/trend.html` per
chart.js gegen die history. Bei einem Drop > 0.5 Prozentpunkte öffnet
die CI automatisch ein Issue mit Label `regression auto-found`.
