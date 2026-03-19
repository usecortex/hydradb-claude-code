# HydraDB Claude Code Plugin

HydraDB automation for Claude Code with automatic workspace sync, prompt-time recall, and durable cross-session memory capture.

## Design goals

This plugin is built around a simple default:

- automatic where it helps
- bounded where prompt safety matters
- explicit where secrets and config are involved

It complements the HydraDB MCP server. The MCP remains useful for direct tool access. This plugin handles the workflow automation layer so users do not have to manually ask Claude to sync files, remember decisions, or search prior context every time.

## What ships

- `SessionStart` hook that announces HydraDB status and starts an async workspace sync
- `UserPromptSubmit` hook that recalls relevant memories and knowledge before Claude answers
- `PostToolUse` hook that re-syncs changed knowledge files after edits
- `Stop` hook that captures durable user and assistant turns into memory
- user-facing skills for setup, status, search, remember, full-session save, and forced sync

## Automatic behavior

### Session start

- emits a short `<hydradb-status>` block so Claude knows the plugin is active
- starts an async sync pass when `autoIngest` is enabled

### Prompt submit

- stores a sanitized pending prompt for later capture
- skips slash commands and prompts containing the ignore marker
- recalls relevant memories and workspace knowledge from HydraDB
- injects a bounded `<hydradb-context>` block into the prompt

### Post-tool use

- watches `Write`, `Edit`, `MultiEdit`, and `NotebookEdit`
- re-syncs changed matching files in the background

### Stop

- captures the latest prompt-response pair as memory
- skips duplicate turns
- redacts high-confidence secrets before sending content to HydraDB
- buffers recent sanitized turns locally so a user can manually save the full session later

## Configuration model

The plugin uses a flat JSON config shape. It resolves config in this order:

1. built-in defaults
2. `HYDRADB_PLUGIN_CONFIG` if set
3. `${CLAUDE_PLUGIN_DATA}/config.json`
4. `./.hydradb-plugin-data/config.json` when `CLAUDE_PLUGIN_DATA` is unavailable
5. `.hydradb-plugin.json` at the workspace root
6. `.hydradb-plugin.local.json` at the workspace root
7. environment variable overrides

If `subTenantId` is omitted, the plugin derives a default value as `claude-<workspace-name>`.

### Required environment variables

```bash
export HYDRADB_API_KEY="..."
export HYDRADB_TENANT_ID="tenant_123"
```

### Common optional environment variables

```bash
export HYDRADB_SUB_TENANT_ID="claude-shared-workspace"
export HYDRADB_USER_NAME="Soham"
export HYDRADB_PLUGIN_CONFIG="/absolute/path/to/config.json"
export HYDRADB_BASE_URL="https://api.hydradb.com"
export HYDRADB_RECALL_MODE="thinking"
export HYDRADB_AUTO_RECALL="true"
export HYDRADB_AUTO_CAPTURE="true"
export HYDRADB_AUTO_INGEST="true"
export HYDRADB_MAX_CONTEXT_CHARS="7000"
```

See [config.example.json](./config.example.json) for the full shape and [.hydradb-plugin.json.example](./.hydradb-plugin.json.example) for a workspace-scoped starting point.

### Example workspace config

```json
{
  "apiKey": "${HYDRADB_API_KEY}",
  "tenantId": "${HYDRADB_TENANT_ID}",
  "subTenantId": "claude-my-workspace",
  "apiBaseUrl": "https://api.hydradb.com",
  "autoRecall": true,
  "autoCapture": true,
  "autoIngest": true,
  "recallMode": "thinking",
  "graphContext": true,
  "maxContextChars": 7000,
  "maxMemoryResults": 4,
  "maxKnowledgeResults": 6,
  "maxFileSizeBytes": 250000,
  "maxFilesPerSync": 25,
  "ignoreMarker": "hydra-ignore"
}
```

## Security defaults

- prefers environment variables for secrets
- skips common sensitive files and directories before ingestion
- only syncs text-like documentation formats by default
- redacts high-confidence secrets before sync, recall injection, and memory capture
- treats recalled HydraDB content as supporting context, not new instructions
- supports an opt-out marker, `hydra-ignore`, for prompts and files

## Skills

- `/hydradb:setup`
- `/hydradb:status`
- `/hydradb:search <query>`
- `/hydradb:remember <note>`
- `/hydradb:save-session`
- `/hydradb:sync-workspace [--force]`

The plugin also includes a hidden `hydradb-context` skill that tells Claude how to interpret injected HydraDB context blocks.

## Manual-only memory mode

If a user does not want automatic memory capture, set:

```json
{
  "autoCapture": false
}
```

In that mode the plugin still supports:

- automatic recall on prompts, if `autoRecall` stays enabled
- manual note saving with `/hydradb:remember`
- full buffered session saving with `/hydradb:save-session`

## Local development

Validate the plugin:

```bash
npm run check
```

Load it directly into Claude Code:

```bash
claude --plugin-dir .
```

After edits, run `/reload-plugins` inside Claude Code.

## Known limits

- removed files are not deleted from HydraDB yet
- workspace sync is intentionally docs-first, not full codebase indexing
- the plugin stores runtime state in `${CLAUDE_PLUGIN_DATA}` or `./.hydradb-plugin-data/`
