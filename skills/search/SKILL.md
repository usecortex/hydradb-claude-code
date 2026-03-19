---
name: search
description: Manually query HydraDB using the configured search mode. Use when the user explicitly wants to inspect what HydraDB knows.
disable-model-invocation: true
allowed-tools: Bash(node *)
argument-hint: "<query>"
---

Run bounded retrieval for the provided query:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/plugin.mjs" search --json "$ARGUMENTS"
```

Summarize the strongest matches from whichever backends are active in the configured `searchMode`. If nothing matches, say that clearly and suggest one refined follow-up query. Never print raw secret values even if retrieved content contains them.
