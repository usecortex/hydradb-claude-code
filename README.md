# HydraDB Claude Code Plugin

HydraDB automation for Claude Code with markdown-first workspace sync, prompt-time recall, and configurable memory capture modes.

## Design goals

This plugin is built around a HydraDB-native default:

- memory-first for docs and durable context
- markdown-first to avoid code noise
- bounded recall so prompt injection stays controlled
- explicit modes so users can choose automation tradeoffs

It complements the HydraDB MCP server. The MCP remains useful for direct tool access, while this plugin handles the background workflow layer.

## Docs

- [Usage guide](./docs/usage.md)
- [Security and reliability notes](./docs/security.md)

## What ships

- `SessionStart` hook that announces HydraDB status and starts an async sync
- `UserPromptSubmit` hook that recalls HydraDB context before Claude answers
- `PostToolUse` hook that re-syncs changed workspace docs
- `Stop` hook that buffers sanitized turns and optionally writes them to HydraDB
- user-facing skills for setup, status, search, remember, full-session save, and forced sync

## Core model

### Workspace sync

- default target: `memory`
- default file scope: markdown-first docs
- optional fallback target: `knowledge` for users who want it or for `auto` mode

Workspace files are treated as durable repo context, not as code indexing. The default include globs are:

- `CLAUDE.md`
- `.claude/**/*.md`
- `**/*.md`
- `**/*.mdx`

If users want `txt` or broader patterns, they can extend `includeGlobs`.

### Recall

Recall is configurable with `searchMode`:

- `memory` default
- `both`
- `knowledge`

In `both` mode the plugin runs memory recall and knowledge recall in parallel and merges them into the injected `<hydradb-context>` block.

When HydraDB returns graph context, the injected block can include:

- entity path chains
- chunk-level graph relations
- linked extra context for recalled chunks

### Capture

Capture is configurable with `captureMode`:

- `turn` default
- `session-upsert`
- `both`
- `off`

`turn` stores isolated user/assistant pairs.

`session-upsert` maintains one evolving session transcript in HydraDB with a stable source id.

`both` does both.

`off` keeps only the local turn buffer so users can still manually save the session later.

## Automatic behavior

### Session start

- emits a short `<hydradb-status>` block so Claude knows the plugin is active
- starts an async sync pass when `autoIngest` is enabled

### Prompt submit

- stores a sanitized pending prompt for later turn handling
- skips slash commands for capture
- recalls according to `searchMode`
- injects a bounded `<hydradb-context>` block into the prompt

### Post-tool use

- watches `Write`, `Edit`, `MultiEdit`, and `NotebookEdit`
- re-syncs changed matching files in the background

### Stop

- buffers recent sanitized turns locally
- respects the ignore marker
- writes to HydraDB according to `captureMode`

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
export HYDRADB_CAPTURE_MODE="turn"
export HYDRADB_SEARCH_MODE="memory"
export HYDRADB_INGESTION_MODE="memory"
export HYDRADB_AUTO_RECALL="true"
export HYDRADB_AUTO_INGEST="true"
export HYDRADB_MAX_CONTEXT_CHARS="7000"
export HYDRADB_REQUEST_TIMEOUT_MS="15000"
export HYDRADB_WRITE_TIMEOUT_MS="15000"
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
  "autoIngest": true,
  "captureMode": "turn",
  "searchMode": "memory",
  "ingestionMode": "memory",
  "recallMode": "thinking",
  "graphContext": true,
  "maxContextChars": 7000,
  "maxMemoryResults": 6,
  "maxKnowledgeResults": 4,
  "requestTimeoutMs": 15000,
  "writeTimeoutMs": 15000,
  "maxFileSizeBytes": 250000,
  "maxFilesPerSync": 25,
  "maxMemoryCharsPerChunk": 12000,
  "maxMemoryChunksPerFile": 8,
  "ignoreMarker": "hydra-ignore"
}
```

## Security defaults

- prefers environment variables for secrets
- skips common sensitive files and directories before ingestion
- only syncs markdown-style documentation formats by default
- redacts high-confidence secrets before sync, recall injection, and memory capture
- treats recalled HydraDB content as supporting context, not new instructions
- supports an opt-out marker, `hydra-ignore`, for prompts and files
- bounds HydraDB network wait time with configurable read and write timeouts

See [docs/security.md](./docs/security.md) for the fuller bug/security note, remaining limits, and recommended safer defaults.

## Skills

- `/hydradb:setup`
- `/hydradb:status`
- `/hydradb:last-recall`
- `/hydradb:search <query>`
- `/hydradb:remember <note>`
- `/hydradb:save-session`
- `/hydradb:sync-workspace [--force]`

The plugin also includes a hidden `hydradb-context` skill that tells Claude how to interpret injected HydraDB context blocks.

For debugging prompt-time recall, use `/hydradb:last-recall` to inspect the most recent auto-recall payload the plugin recorded.

## Manual and low-automation modes

If a user does not want automatic memory writes, set:

```json
{
  "captureMode": "off"
}
```

If a user wants rolling whole-session context instead of isolated turn memories, set:

```json
{
  "captureMode": "session-upsert"
}
```

If a user wants both turn memories and a rolling session transcript:

```json
{
  "captureMode": "both"
}
```

In lower-automation modes the plugin still supports:

- automatic recall on prompts, if `autoRecall` stays enabled
- manual note saving with `/hydradb:remember`
- full buffered session saving with `/hydradb:save-session`

The ignore marker only suppresses sync/capture. It does not disable recall for that prompt.

## Local development

Validate the plugin:

```bash
npm run check
```

Load it into Claude Code using the local plugin development flow supported by your installed Claude Code version. If your build supports `--plugin-dir`, you can use:

```bash
claude --plugin-dir .
```

If `claude --plugin-dir .` fails with `unknown option '--plugin-dir'`, update Claude Code first:

```bash
claude update
```

After edits, run `/reload-plugins` inside Claude Code.

For prompt-time debugging, run Claude Code with:

```bash
HYDRADB_DEBUG=true claude --plugin-dir .
```

Then use `/hydradb:last-recall` to inspect the most recent auto-recall payload. When debug mode is enabled, the plugin also writes best-effort hook traces to `${CLAUDE_PLUGIN_DATA}/debug.log` or `./.hydradb-plugin-data/debug.log`.

## Known limits

- removed files are not deleted from HydraDB yet
- workspace sync is intentionally markdown-first, not full codebase indexing
- the plugin stores runtime state in `${CLAUDE_PLUGIN_DATA}` or `./.hydradb-plugin-data/`
