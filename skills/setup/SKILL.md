---
name: setup
description: Configure the HydraDB Claude Code plugin for the current workspace. Use when the user wants to enable HydraDB memory, fix configuration, or create a workspace config file.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, MultiEdit, Bash(node *)
---

Configure the HydraDB plugin for the current workspace.

1. Check current status first:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/plugin.mjs" status --json
```

2. If HydraDB is already configured, explain which config layers are active and whether anything still needs to change.

3. If configuration is missing, prefer one of these paths:
   - `.hydradb-plugin.local.json` for machine-local overrides
   - `.hydradb-plugin.json` for shareable workspace defaults
   - `${CLAUDE_PLUGIN_DATA}/config.json` for persistent user-level plugin defaults
   - `./.hydradb-plugin-data/config.json` only when `CLAUDE_PLUGIN_DATA` is not available in the current environment

4. Use `${CLAUDE_PLUGIN_ROOT}/.hydradb-plugin.json.example` for workspace config or `${CLAUDE_PLUGIN_ROOT}/config.example.json` for the full shape. For a minimal safe setup, this is enough:

```json
{
  "apiBaseUrl": "https://api.hydradb.com",
  "apiKey": "${HYDRADB_API_KEY}",
  "tenantId": "${HYDRADB_TENANT_ID}",
  "autoRecall": true,
  "autoCapture": false,
  "autoIngest": true,
  "recallMode": "thinking",
  "graphContext": true,
  "maxContextChars": 7000,
  "ignoreMarker": "hydra-ignore"
}
```

5. Never invent secrets. Prefer environment variables for secret values:
   - `HYDRADB_API_KEY`
   - `HYDRADB_TENANT_ID`
   - optional `HYDRADB_SUB_TENANT_ID`
   - optional `HYDRADB_BASE_URL`
   - optional `HYDRADB_USER_NAME`

6. JSON config values can reference environment variables like `"${HYDRADB_API_KEY}"`. Prefer that over putting literal secrets into repo files.

7. Only put a literal API key in a file if the user explicitly asks for it. Otherwise keep secrets out of committed config.

8. After any config edit, recommend running:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/plugin.mjs" status
```

9. If the user wants manual-only memory, set `autoCapture` to `false` and point them to `/hydradb:remember` or `/hydradb:save-session`.
