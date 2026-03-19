---
name: remember
description: Store a durable note, preference, or decision in HydraDB memory. Use when the user explicitly wants Claude Code to remember something.
disable-model-invocation: true
allowed-tools: Bash(node *)
argument-hint: "<text to remember>"
---

Store the provided text in HydraDB:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/plugin.mjs" remember "$ARGUMENTS"
```

Then confirm what was stored in one sentence. If the output says sensitive tokens were redacted, mention that explicitly. If the plugin is not configured, explain that and suggest `/hydradb:setup`.
