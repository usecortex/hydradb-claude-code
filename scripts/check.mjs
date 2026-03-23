#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { normalizeRetrievalResponse } from "./lib/hydra-client.mjs";

const root = process.cwd();

const scriptFiles = [
  "scripts/plugin.mjs",
  "scripts/lib/config.mjs",
  "scripts/lib/context-format.mjs",
  "scripts/lib/hydra-client.mjs",
  "scripts/lib/sanitize.mjs",
  "scripts/lib/state.mjs",
  "scripts/lib/workspace-sync.mjs"
];

const jsonFiles = [
  ".claude-plugin/plugin.json",
  "hooks/hooks.json",
  ".hydradb-plugin.json.example",
  "config.example.json"
];

for (const relativePath of scriptFiles) {
  execFileSync(process.execPath, ["--check", path.join(root, relativePath)], {
    stdio: "inherit"
  });
}

execFileSync("bash", ["-n", path.join(root, "scripts/run-plugin.sh")], {
  stdio: "inherit"
});

for (const relativePath of jsonFiles) {
  const raw = await fs.readFile(path.join(root, relativePath), "utf8");
  JSON.parse(raw);
}

const hookConfig = JSON.parse(await fs.readFile(path.join(root, "hooks/hooks.json"), "utf8"));
for (const hookName of ["SessionStart", "UserPromptSubmit", "PostToolUse", "Stop"]) {
  const entries = hookConfig.hooks?.[hookName] || [];
  assert.ok(entries.length > 0, `${hookName} should be configured`);
  const commands = entries.flatMap((entry) => entry.hooks || []).map((hook) => hook.command || "");
  assert.ok(
    commands.some((command) => command.includes("scripts/run-plugin.sh")),
    `${hookName} should use the hook runner wrapper`
  );
}

const normalizedRecall = normalizeRetrievalResponse({
  chunks: [
    {
      chunk_uuid: "chunk-1",
      chunk_content: "HydraDB plugin overview",
      source_title: "README.md"
    }
  ]
});

assert.equal(normalizedRecall.chunks.length, 1);
assert.equal(normalizedRecall.chunks[0].text, "HydraDB plugin overview");
assert.equal(normalizedRecall.chunks[0].sourceTitle, "README.md");

const tempDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "hydradb-plugin-check-"));
const baseEnv = {
  ...process.env,
  CLAUDE_PLUGIN_DATA: tempDataDir
};

const sessionStartRaw = execFileSync(process.execPath, [path.join(root, "scripts/plugin.mjs"), "session-start"], {
  env: baseEnv,
  encoding: "utf8"
}).trim();
const sessionStartOutput = JSON.parse(sessionStartRaw);
assert.equal(sessionStartOutput.hookSpecificOutput?.hookEventName, "SessionStart");
assert.match(sessionStartOutput.hookSpecificOutput?.additionalContext || "", /<hydradb-status>/);

execFileSync(process.execPath, [path.join(root, "scripts/plugin.mjs"), "user-prompt-submit"], {
  env: baseEnv,
  input: JSON.stringify({
    session_id: "check-session",
    prompt: "what is hydradb plugin"
  }),
  encoding: "utf8"
});

const lastRecallRaw = execFileSync(
  process.execPath,
  [path.join(root, "scripts/plugin.mjs"), "last-recall", "--json"],
  {
    env: baseEnv,
    encoding: "utf8"
  }
).trim();
const lastRecall = JSON.parse(lastRecallRaw);
assert.equal(lastRecall.sessionId, "check-session");
assert.equal(lastRecall.skipped, true);
assert.equal(lastRecall.reason, "not-configured");

await fs.writeFile(
  path.join(tempDataDir, "config.json"),
  JSON.stringify(
    {
      apiKey: "test-key",
      tenantId: "tenant-123",
      subTenantId: ""
    },
    null,
    2
  ),
  "utf8"
);

const statusRaw = execFileSync(process.execPath, [path.join(root, "scripts/plugin.mjs"), "status", "--json"], {
  env: baseEnv,
  encoding: "utf8"
}).trim();
const status = JSON.parse(statusRaw);
assert.equal(status.configured, true);
assert.equal(status.resolvedConfig.subTenantId, "");
assert.equal(status.resolvedConfig.captureMode, "session-upsert");

process.stdout.write(
  `Validated ${scriptFiles.length} core scripts, ${jsonFiles.length} JSON files, recall normalization, hook output, last-recall state, and config defaults.\n`
);
