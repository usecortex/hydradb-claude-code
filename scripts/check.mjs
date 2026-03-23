#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
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

for (const relativePath of jsonFiles) {
  const raw = await fs.readFile(path.join(root, relativePath), "utf8");
  JSON.parse(raw);
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

process.stdout.write(
  `Validated ${scriptFiles.length} core scripts, ${jsonFiles.length} JSON files, and recall normalization.\n`
);
