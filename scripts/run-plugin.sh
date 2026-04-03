#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
NODE_BIN=""

if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
elif [[ -n "${CLAUDE_CODE_NODE:-}" && -x "${CLAUDE_CODE_NODE}" ]]; then
  NODE_BIN="${CLAUDE_CODE_NODE}"
elif [[ -n "${NVM_BIN:-}" && -x "${NVM_BIN}/node" ]]; then
  NODE_BIN="${NVM_BIN}/node"
else
  for candidate in \
    "$HOME"/.nvm/versions/node/*/bin/node \
    /opt/homebrew/bin/node \
    /usr/local/bin/node \
    /usr/bin/node
  do
    if [[ -x "$candidate" ]]; then
      NODE_BIN="$candidate"
      break
    fi
  done
fi

if [[ -z "$NODE_BIN" ]]; then
  echo "HydraDB plugin error: unable to locate a node executable for hook execution." >&2
  exit 127
fi

exec "$NODE_BIN" "${PLUGIN_ROOT}/scripts/plugin.mjs" "$@"
