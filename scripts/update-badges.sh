#!/usr/bin/env bash
# Update README badges + write a snapshot for the trend page.
# Idempotent — runs at the end of each successful nightly.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
README="$REPO_ROOT/README.md"
LATEST="$REPO_ROOT/results/run-summary.json"

if [ ! -f "$LATEST" ]; then
  echo "No run-summary.json — nothing to update."
  exit 0
fi

color_for() {
  local pct="$1"
  if (( $(echo "$pct >= 95" | bc -l) )); then echo "brightgreen"
  elif (( $(echo "$pct >= 80" | bc -l) )); then echo "yellow"
  else echo "orange"; fi
}

BADGE_BLOCK=""
while IFS= read -r line; do
  ID=$(echo "$line" | jq -r '.id')
  PASSED=$(echo "$line" | jq -r '.passed')
  TOTAL=$(echo "$line" | jq -r '.total')

  if [ "$TOTAL" = "0" ] || [ "$TOTAL" = "null" ]; then
    continue
  fi

  PCT=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc -l)
  COLOR=$(color_for "$PCT")
  # Escape dashes für shields.io
  ESCAPED_ID="${ID//-/--}"
  BADGE_BLOCK+="![${ID}](https://img.shields.io/badge/${ESCAPED_ID}-${PCT}%25-${COLOR})"$'\n'
done < <(jq -c '.suites[]' "$LATEST")

# Rewrite the BADGES block in README
python3 - "$README" "$BADGE_BLOCK" <<'PYEOF'
import re, sys, pathlib

readme_path = pathlib.Path(sys.argv[1])
badges = sys.argv[2]

text = readme_path.read_text()
pattern = re.compile(
    r"(<!-- BADGES:START.*?-->)(.*?)(<!-- BADGES:END -->)",
    re.DOTALL,
)
new_text, n = pattern.subn(
    lambda m: f"{m.group(1)}\n{badges}{m.group(3)}",
    text,
)
if n == 0:
    print("warning: BADGES markers not found in README", file=sys.stderr)
    sys.exit(0)

readme_path.write_text(new_text)
print(f"updated {n} BADGES block(s) in {readme_path}")
PYEOF
