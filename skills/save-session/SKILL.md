---
name: save-session
description: Save the current Claude Code session into HydraDB as one evolving session memory. Use when the user explicitly asks to save the whole conversation, the current session, or everything discussed so far to HydraDB.
allowed-tools: Bash(node *)
argument-hint: "[session-id]"
---

Save the current buffered session into HydraDB:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/plugin.mjs" save-session --json "$ARGUMENTS"
```

If no session id is provided, use the most recently active session tracked by the plugin. Confirm how many turns were saved, and explain that repeated saves for the same session upsert a single session-level memory in HydraDB.
