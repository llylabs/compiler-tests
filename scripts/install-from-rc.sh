#!/usr/bin/env bash
# Install latest published `lly` CLI from RC (Release Channel) and pull
# the plugins needed by the test suites. No Source-Build.
#
# How it works:
#   1. curl rc.lilylabs.io/install.sh | bash      → puts `lly` into $BIN_DIR
#   2. lly plugin install <name> for each needed plugin
#
# Env overrides:
#   LLY_RC_URL       — RC origin (default: https://rc.lilylabs.io)
#   LLY_INSTALL_DIR  — wo lly hin (default: ~/.local/bin in CI)
#   LLY_VERSION_PIN  — pin a specific lly SHA/version (default: latest)
#                      Note: aktuelle install.sh holt immer "latest" pro Target —
#                      Pinning würde eine RC-Erweiterung brauchen
#
# Outputs at the end:
#   $LLY_INSTALL_DIR/lly             — main CLI
#   $HOME/.lly/plugins/<name>/       — installed plugins
#   ./bin/version.json               — installed versions for the run manifest

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

LLY_RC_URL="${LLY_RC_URL:-https://rc.lilylabs.io}"
LLY_INSTALL_DIR="${LLY_INSTALL_DIR:-$HOME/.local/bin}"

# Plugins die für die Standard-Test-Suiten gebraucht werden
PLUGINS_DEFAULT="c cpp nextjs deploy brick-format"
PLUGINS="${PLUGINS:-$PLUGINS_DEFAULT}"

mkdir -p "$LLY_INSTALL_DIR"
export PATH="$LLY_INSTALL_DIR:$PATH"

echo "▸ Installing lly from $LLY_RC_URL"
echo "  Install dir: $LLY_INSTALL_DIR"
echo ""

# ─── 1. lly via install.sh ─────────────────────────────────
curl -fsSL "$LLY_RC_URL/install.sh" | \
  bash -s -- --install-dir "$LLY_INSTALL_DIR"

if ! command -v lly >/dev/null 2>&1; then
  echo "✗ lly not on PATH after install"
  echo "  Expected at: $LLY_INSTALL_DIR/lly"
  ls -la "$LLY_INSTALL_DIR/" || true
  exit 1
fi

LLY_VERSION=$(lly --version 2>&1 | head -1)
echo ""
echo "  ✓ $LLY_VERSION"
echo ""

# ─── 2. Plugins ────────────────────────────────────────────
echo "▸ Installing plugins: $PLUGINS"
PLUGIN_VERSIONS=""
for plugin in $PLUGINS; do
  if lly plugin install "$plugin" 2>&1 | tee "/tmp/plugin-$plugin.log"; then
    echo "  ✓ $plugin"
    # Try to capture installed version (plugin output format may vary)
    VER=$(grep -oE '[0-9]+\.[0-9]+\.[0-9]+|[0-9a-f]{7,40}' "/tmp/plugin-$plugin.log" | head -1 || echo "unknown")
    PLUGIN_VERSIONS="$PLUGIN_VERSIONS  $plugin=$VER"
  else
    echo "  ✗ $plugin install failed"
    cat "/tmp/plugin-$plugin.log"
    # Don't fail hard — manche Plugins existieren evtl. noch nicht im channel
  fi
done

# ─── 3. Manifest ───────────────────────────────────────────
mkdir -p "$REPO_ROOT/bin"
cat > "$REPO_ROOT/bin/version.json" <<EOF
{
  "lly_version": "$LLY_VERSION",
  "rc_url": "$LLY_RC_URL",
  "plugins_requested": "$PLUGINS",
  "plugins_installed": "$PLUGIN_VERSIONS",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "install_dir": "$LLY_INSTALL_DIR",
  "plugin_dir": "$HOME/.lly/plugins"
}
EOF

echo ""
echo "Installation summary:"
cat "$REPO_ROOT/bin/version.json"
echo ""

# ─── 4. Validate ───────────────────────────────────────────
if [ -d "$HOME/.lly/plugins" ]; then
  echo "Plugins on disk:"
  ls -la "$HOME/.lly/plugins/" | head -20
fi
