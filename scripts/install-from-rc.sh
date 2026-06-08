#!/usr/bin/env bash
# Install latest published `lly` CLI + plugins from RC.
#
# Two authentication modes:
#
#   1. `lly` binary download is ALWAYS anonymous (install.sh on RC is
#      public — it's just the bootstrap binary).
#
#   2. Plugin downloads use GitHub Actions OIDC when running in CI.
#      The workflow requests a short-lived JWT from GitHub's OIDC
#      provider, sends it as a Bearer token to RC's
#      /ci/plugins/<target>/<name> endpoint, RC verifies the JWT
#      against GitHub's JWKS and returns the plugin binary if the
#      sub/aud claims match.
#
#      No secrets in the repo. The trust chain is:
#         GitHub signs JWT → RC trusts GitHub's signature →
#         RC checks JWT claims → grants access only to
#         repo:llylabs/compiler-tests:ref:refs/heads/main
#
# Env overrides:
#   LLY_RC_URL       — RC origin (default: https://rc.lilylabs.io)
#   LLY_INSTALL_DIR  — where to put `lly` (default: ~/.local/bin in CI)
#   PLUGINS          — space-separated list (default: c cpp brick-format)
#
# In GitHub Actions, ACTIONS_ID_TOKEN_REQUEST_TOKEN and
# ACTIONS_ID_TOKEN_REQUEST_URL are auto-injected when the workflow has
# permissions: id-token: write.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

LLY_RC_URL="${LLY_RC_URL:-https://rc.lilylabs.io}"
LLY_INSTALL_DIR="${LLY_INSTALL_DIR:-$HOME/.local/bin}"
PLUGINS="${PLUGINS:-c cpp brick-format}"
AUDIENCE="${OIDC_AUDIENCE:-rc.lilylabs.io}"
TARGET="${LLY_TARGET:-x86_64-linux}"

mkdir -p "$LLY_INSTALL_DIR" "$HOME/.lly/plugins" "$REPO_ROOT/bin"
export PATH="$LLY_INSTALL_DIR:$PATH"

# ──────────────────────────────────────────────────────────
# 1. lly Binary (anonym via install.sh — wie jeder User)
# ──────────────────────────────────────────────────────────
echo "▸ Installing lly from $LLY_RC_URL"
curl -fsSL "$LLY_RC_URL/install.sh" | \
  bash -s -- --install-dir "$LLY_INSTALL_DIR"

if ! command -v lly >/dev/null 2>&1; then
  echo "✗ lly not on PATH after install"
  ls -la "$LLY_INSTALL_DIR/" || true
  exit 1
fi

LLY_VERSION=$(lly --version 2>&1 | head -1)
echo "  ✓ $LLY_VERSION"
echo ""

# ──────────────────────────────────────────────────────────
# 2. OIDC Token von GitHub holen (für Plugin-Auth)
# ──────────────────────────────────────────────────────────
# Diese ENV-Vars werden von GitHub Actions automatisch gesetzt
# wenn der Workflow `permissions: id-token: write` hat. Außerhalb
# von GitHub Actions sind sie leer → wir fallen auf anonymous-Mode
# zurück (der heute nicht funktioniert; siehe DOC unten).

OIDC_JWT=""
if [ -n "${ACTIONS_ID_TOKEN_REQUEST_TOKEN:-}" ] && [ -n "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" ]; then
  echo "▸ Requesting OIDC token from GitHub (audience: $AUDIENCE)"
  OIDC_JWT=$(curl -fsSL \
    -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
    "${ACTIONS_ID_TOKEN_REQUEST_URL}&audience=${AUDIENCE}" | \
    jq -r '.value')

  if [ -z "$OIDC_JWT" ] || [ "$OIDC_JWT" = "null" ]; then
    echo "✗ Failed to obtain OIDC token"
    exit 1
  fi

  # Print debug info (only the public claims, never the signature)
  CLAIMS=$(echo "$OIDC_JWT" | cut -d. -f2 | base64 -d 2>/dev/null || true)
  echo "  ✓ Token obtained. Claims:"
  echo "$CLAIMS" | jq -r '"    sub: " + .sub + "\n    aud: " + .aud + "\n    iss: " + .iss' 2>/dev/null || \
    echo "    (could not parse claims for display)"
else
  echo "⚠ Not running in GitHub Actions (no OIDC token available)"
  echo "  Plugin downloads will use anonymous fallback if RC permits."
fi
echo ""

# ──────────────────────────────────────────────────────────
# 3. Plugins via OIDC-authenticated download
# ──────────────────────────────────────────────────────────
echo "▸ Installing plugins: $PLUGINS"
PLUGIN_VERSIONS=""

for plugin in $PLUGINS; do
  PLUGIN_DIR="$HOME/.lly/plugins/$plugin"
  mkdir -p "$PLUGIN_DIR"
  BIN="$PLUGIN_DIR/${plugin}-plugin"
  URL="${LLY_RC_URL}/ci/plugins/${TARGET}/${plugin}"

  if [ -n "$OIDC_JWT" ]; then
    # Authenticated download via OIDC
    if curl -fsSL \
         -H "Authorization: Bearer $OIDC_JWT" \
         -o "$BIN" "$URL"; then
      chmod +x "$BIN"
      echo "  ✓ $plugin → $BIN"

      # Try to read its version
      VER=$("$BIN" --version 2>&1 | head -1 || echo "unknown")
      PLUGIN_VERSIONS="$PLUGIN_VERSIONS  $plugin=$VER\n"
    else
      echo "  ✗ $plugin download failed (HTTP $(curl -sI -H "Authorization: Bearer $OIDC_JWT" "$URL" -o /dev/null -w '%{http_code}'))"
      echo "    URL: $URL"
      # Continue — don't fail hard on individual plugin missing
    fi
  else
    # Anonymous fallback — only works if RC permits
    if curl -fsSL -o "$BIN" "$URL"; then
      chmod +x "$BIN"
      echo "  ✓ $plugin (anonymous)"
    else
      echo "  ✗ $plugin anonymous download failed (auth required)"
    fi
  fi
done
echo ""

# ──────────────────────────────────────────────────────────
# 4. Run-Manifest schreiben
# ──────────────────────────────────────────────────────────
cat > "$REPO_ROOT/bin/version.json" <<EOF
{
  "lly_version": "$LLY_VERSION",
  "rc_url": "$LLY_RC_URL",
  "target": "$TARGET",
  "plugins_requested": "$PLUGINS",
  "plugins_installed": "$(printf '%b' "$PLUGIN_VERSIONS" | tr '\n' ' ')",
  "auth_mode": "$([ -n "$OIDC_JWT" ] && echo "oidc" || echo "anonymous")",
  "oidc_audience": "$AUDIENCE",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "github_workflow": "${GITHUB_WORKFLOW:-n/a}",
  "github_run_id": "${GITHUB_RUN_ID:-n/a}"
}
EOF

echo "Installation summary:"
jq . "$REPO_ROOT/bin/version.json"
echo ""

# Validate plugins on disk
if [ -d "$HOME/.lly/plugins" ]; then
  echo "Plugins on disk:"
  ls -la "$HOME/.lly/plugins/" 2>/dev/null | head -20
fi
