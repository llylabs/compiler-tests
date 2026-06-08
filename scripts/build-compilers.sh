#!/usr/bin/env bash
# Build machineroom (Rust workspace) + oldies/nex (JS-Compiler) from source.
# Expects the source trees to be checked out alongside this repo as siblings:
#   $GITHUB_WORKSPACE/compiler-tests/   <- this repo
#   $GITHUB_WORKSPACE/machineroom/      <- machineroom checkout
#   $GITHUB_WORKSPACE/oldies-nex/       <- oldies/nex checkout
#
# Resulting binaries land under compiler-tests/bin/:
#   bin/lly           — main CLI
#   bin/nex           — Legacy JS compiler (for test262, nex-stdlib)
#   bin/lly-nextjs    — Next.js plugin
#   bin/lly-deploy    — Deploy plugin
#   bin/farm-plugins/ — c-plugin, cpp-plugin etc (für c-brick/cpp-brick)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE="${GITHUB_WORKSPACE:-$(cd "$REPO_ROOT/.." && pwd)}"

MACHINEROOM_DIR="${MACHINEROOM_DIR:-$WORKSPACE/machineroom}"
NEX_DIR="${NEX_DIR:-$WORKSPACE/oldies-nex}"
BIN_DIR="$REPO_ROOT/bin"

mkdir -p "$BIN_DIR"

# ─── machineroom ──────────────────────────────────────────
if [ -d "$MACHINEROOM_DIR" ]; then
  echo "▸ Building machineroom from $MACHINEROOM_DIR"
  (
    cd "$MACHINEROOM_DIR"
    cargo build --release
  )

  cp "$MACHINEROOM_DIR/target/release/lly" "$BIN_DIR/lly"
  for bin in lly-nextjs lly-deploy lly-void; do
    [ -f "$MACHINEROOM_DIR/target/release/$bin" ] && cp "$MACHINEROOM_DIR/target/release/$bin" "$BIN_DIR/"
  done
  echo "  ✓ lly + plugins"
else
  echo "⚠ machineroom not found at $MACHINEROOM_DIR — skipping (suites needing it will fail)"
fi

# ─── farm plugins (c-plugin, cpp-plugin) ───────────────────
FARM_DIR="${FARM_DIR:-$WORKSPACE/farm}"
if [ -d "$FARM_DIR/plugins" ]; then
  echo "▸ Building farm plugins from $FARM_DIR/plugins"
  (
    cd "$FARM_DIR/plugins"
    cargo build --release
  )
  mkdir -p "$BIN_DIR/farm-plugins"
  cp "$FARM_DIR/plugins/target/release/"*-plugin "$BIN_DIR/farm-plugins/" 2>/dev/null || true
  echo "  ✓ farm plugins"
else
  echo "⚠ farm/plugins not found — c-brick/cpp-brick suites may fail"
fi

# ─── oldies/nex (Legacy JS-Compiler) ───────────────────────
if [ -d "$NEX_DIR" ]; then
  echo "▸ Building oldies/nex from $NEX_DIR"
  (
    cd "$NEX_DIR"
    CARGO_TARGET_DIR="/tmp/nex-build" cargo build --release --bin nex --features no-auth
  )
  cp /tmp/nex-build/release/nex "$BIN_DIR/nex"
  echo "  ✓ nex"
else
  echo "⚠ oldies/nex not found at $NEX_DIR — test262/nex-stdlib suites will fail"
fi

# ─── Summary ────────────────────────────────────────────────
echo ""
echo "Built binaries in $BIN_DIR:"
ls -lh "$BIN_DIR/"
[ -d "$BIN_DIR/farm-plugins" ] && ls -lh "$BIN_DIR/farm-plugins/"

# Print versions for the run log
echo ""
echo "Versions:"
[ -x "$BIN_DIR/lly" ] && "$BIN_DIR/lly" --version 2>&1 | head -1 || true
[ -x "$BIN_DIR/nex" ] && "$BIN_DIR/nex" --version 2>&1 | head -1 || true
