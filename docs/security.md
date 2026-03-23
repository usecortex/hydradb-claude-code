# Security And Reliability Notes

This document summarizes the current safeguards in the HydraDB Claude Code plugin, plus the limits users should understand before enabling automation.

## Current safeguards

- secrets are redacted before prompt capture, manual memory save, workspace sync, and injected recall formatting
- common sensitive files and paths are excluded before sync
- markdown-style docs are synced by default, not source code
- recalled HydraDB content is wrapped as reference-only context
- prompts with the ignore marker skip HydraDB capture
- workspace knowledge fallback uses synthetic `hydradb://workspace/...` URLs instead of local absolute paths
- sync state tracks digests so unchanged files are not re-uploaded every time

## Current reliability improvements

- `captureMode`, `searchMode`, and `ingestionMode` are explicit and configurable
- config warnings now flag common ingest/recall mismatches
- invalid boolean environment variables now produce config notes instead of silently becoming `false`
- configurable HydraDB read and write timeouts keep stalled network calls from consuming the full hook budget
- session-upsert mode now keeps short turns in the local session transcript
- session state merging is timestamp-aware for prompt buffers, turn buffers, turn capture hashes, and session transcript hashes
- prompt-time context injection now preserves graph paths, chunk relations, and additional context returned by HydraDB

## Remaining limits

### Remote purge gap

The plugin now cleans up deleted or newly excluded sources during full workspace syncs when they were synced as knowledge. Memory-mode sync still has one remaining gap because the public memory delete API deletes by `memory_id`, while this plugin only tracks stable `source_id` values.

This means stale content can still remain in HydraDB when:

- a previously synced memory source is deleted locally
- a memory-synced file is later excluded
- a user lowers `maxMemoryCharsPerChunk` enough to reintroduce client-side `:chunk:n` memory tails and then a file shrinks

The default config now avoids client-side memory chunking for normal markdown files, which removes the common stale-tail case for memory sync.

### Hook overlap is reduced, not eliminated

The local session state merge is safer than before, but it is not a full locking or compare-and-swap system. Extremely overlapping hooks for the same session can still be tricky.

### Search and ingestion still need sane mode choices

The plugin now warns about mismatched `ingestionMode` and `searchMode`, but it still allows those combinations because advanced users may want them.

### Redaction is heuristic

Secret filtering catches many common tokens and key shapes, but no regex-only approach is perfect. Users should still avoid broadly syncing sensitive workspaces unless they understand the risk.

## Recommended safer defaults

For most teams, this is the safest high-automation starting point:

```json
{
  "captureMode": "session-upsert",
  "searchMode": "memory",
  "ingestionMode": "memory",
  "includeGlobs": [
    "CLAUDE.md",
    ".claude/**/*.md",
    "**/*.md",
    "**/*.mdx"
  ],
  "ignoreMarker": "hydra-ignore"
}
```

If a team wants stronger control, disable auto conversation writes:

```json
{
  "captureMode": "off"
}
```
