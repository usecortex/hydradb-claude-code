---
name: sync-workspace
description: Force a workspace sync of markdown and text knowledge files into HydraDB. Use when the user wants an immediate refresh instead of waiting for automatic sync.
disable-model-invocation: true
allowed-tools: Bash(node *)
argument-hint: "[--force]"
---

Sync the current workspace knowledge files into HydraDB:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/plugin.mjs" sync-workspace --json $ARGUMENTS
```

Report:

- how many files were scanned
- how many were synced
- how many were skipped
- any errors

If the user asks why specific files were skipped, explain it from the JSON output and the current config. Remember that the sync path may redact or skip sensitive-looking content before upload.
