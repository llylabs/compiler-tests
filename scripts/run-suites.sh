#!/usr/bin/env bash
# Run the testbench against a list of suites and emit a summary JSON
# usable by the GitHub workflow.
#
# Usage:
#   run-suites.sh "c-brick,cpp-brick,nex-stdlib"
#   run-suites.sh "all"
#
# Expects binaries at $REPO_ROOT/bin/ (from build-compilers.sh) and
# the testbench under $REPO_ROOT/testbench/.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SUITES_ARG="${1:-c-brick,cpp-brick,nex-stdlib,realworld-build}"

BIN_DIR="$REPO_ROOT/bin"
TB_DIR="$REPO_ROOT/testbench"

# Export the binaries the testbench expects
export LLY_BIN="$BIN_DIR/lly"
export PATH="$BIN_DIR:$PATH"

if [ ! -x "$BIN_DIR/lly" ]; then
  echo "✗ $BIN_DIR/lly not found or not executable"
  echo "  Run scripts/build-compilers.sh first."
  exit 1
fi

# Ensure nex is on PATH (fall back to bundled binary in bin/)
if [ -x "$BIN_DIR/nex" ]; then
  # testbench.ci.json points 'nex' to this absolute path
  :
fi

# Resolve suite list
if [ "$SUITES_ARG" = "all" ]; then
  SUITES=$(jq -r '.suites[].id' "$TB_DIR/testbench.json" | tr '\n' ',' | sed 's/,$//')
else
  SUITES="$SUITES_ARG"
fi

echo "▸ Running suites: $SUITES"
echo ""

cd "$TB_DIR"

PASS=0
FAIL=0
SUMMARY_FILE="$REPO_ROOT/results/run-summary.json"
mkdir -p "$(dirname "$SUMMARY_FILE")"
echo '{"suites":[]}' > "$SUMMARY_FILE"

IFS=',' read -ra SUITE_LIST <<< "$SUITES"
for SUITE in "${SUITE_LIST[@]}"; do
  SUITE_TRIMMED=$(echo "$SUITE" | xargs)
  [ -z "$SUITE_TRIMMED" ] && continue

  echo "── $SUITE_TRIMMED ──"
  START=$(date +%s)

  if npm start -- --config testbench.ci.json --suite "$SUITE_TRIMMED" 2>&1 | tee "/tmp/$SUITE_TRIMMED.log"; then
    STATUS="ok"
    PASS=$((PASS + 1))
  else
    STATUS="fail"
    FAIL=$((FAIL + 1))
  fi
  DURATION=$(($(date +%s) - START))

  # Find the latest output dir and copy report.json out
  LATEST_OUTPUT=$(ls -td "$TB_DIR/output/"*/ 2>/dev/null | head -1)
  if [ -n "$LATEST_OUTPUT" ] && [ -f "$LATEST_OUTPUT/report.json" ]; then
    REPORT="$LATEST_OUTPUT/report.json"
    # Extract pass-rate for this suite
    PASSED=$(jq -r ".suites[] | select(.id==\"$SUITE_TRIMMED\") | .passed // 0" "$REPORT" 2>/dev/null || echo 0)
    TOTAL=$(jq -r ".suites[] | select(.id==\"$SUITE_TRIMMED\") | .total // 0" "$REPORT" 2>/dev/null || echo 0)
  else
    PASSED=0
    TOTAL=0
  fi

  # Append to summary
  jq --arg id "$SUITE_TRIMMED" \
     --arg status "$STATUS" \
     --argjson duration "$DURATION" \
     --argjson passed "$PASSED" \
     --argjson total "$TOTAL" \
     '.suites += [{id:$id, status:$status, duration_s:$duration, passed:$passed, total:$total}]' \
     "$SUMMARY_FILE" > "$SUMMARY_FILE.tmp" && mv "$SUMMARY_FILE.tmp" "$SUMMARY_FILE"

  echo "  → $STATUS in ${DURATION}s ($PASSED/$TOTAL passed)"
  echo ""
done

# Final summary
echo ""
echo "════════════════════════════════"
echo " ${PASS} suite(s) ok, ${FAIL} fail(ed)"
echo "════════════════════════════════"
jq '.' "$SUMMARY_FILE"

# Copy raw testbench outputs to results/ for artifact upload
LATEST_OUTPUT=$(ls -td "$TB_DIR/output/"*/ 2>/dev/null | head -1)
if [ -n "$LATEST_OUTPUT" ]; then
  RUN_ID="${GITHUB_RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
  cp -r "$LATEST_OUTPUT" "$REPO_ROOT/results/run-$RUN_ID"
  echo ""
  echo "Raw reports copied to results/run-$RUN_ID"
fi

# Exit non-zero only if every suite failed (single failures shouldn't
# block the whole nightly — they'll show up in the report)
[ "$FAIL" -eq "${#SUITE_LIST[@]}" ] && exit 1 || exit 0
