import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { redactSecrets } from "./sanitize.mjs";

const SKIPPED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  ".venv",
  "venv",
  "target",
  "vendor"
]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function globToRegExp(glob) {
  const escaped = toPosix(glob)
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "§§DOUBLE_STAR_DIR§§")
    .replace(/\*\*/g, "§§DOUBLE_STAR§§")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".");

  return new RegExp(
    `^${escaped
      .replace(/§§DOUBLE_STAR_DIR§§/g, "(?:.*/)?")
      .replace(/§§DOUBLE_STAR§§/g, ".*")}$`
  );
}

function matchAny(relPath, patterns) {
  return patterns.some((pattern) => globToRegExp(toPosix(pattern)).test(relPath));
}

function likelySensitive(relPath) {
  const lowered = relPath.toLowerCase();
  return (
    lowered.includes("/secrets/") ||
    lowered.includes("/private/") ||
    lowered.endsWith(".pem") ||
    lowered.endsWith(".key") ||
    lowered.endsWith(".crt") ||
    lowered.endsWith(".cer") ||
    lowered.endsWith(".p12") ||
    lowered.endsWith(".pfx") ||
    lowered.includes(".env")
  );
}

function looksBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 2048));
  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 0) {
      return true;
    }
    if (byte < 9 || (byte > 13 && byte < 32)) {
      suspicious += 1;
    }
  }
  return suspicious > sample.length * 0.15;
}

async function walk(rootDir, collector, prefix = "") {
  const entries = await fs.readdir(path.join(rootDir, prefix), { withFileTypes: true });

  for (const entry of entries) {
    const relPath = prefix ? path.posix.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      await walk(rootDir, collector, relPath);
      continue;
    }
    if (entry.isFile()) {
      collector.push(relPath);
    }
  }
}

function fileSourceId(projectRoot, relPath) {
  return `claude-file:${crypto
    .createHash("sha1")
    .update(`${projectRoot}:${relPath}`)
    .digest("hex")}`;
}

function normalizeText(value) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function extractPathsFromToolInput(toolInput, cwd) {
  if (!toolInput || typeof toolInput !== "object") {
    return [];
  }

  const candidates = [];
  for (const key of ["file_path", "path", "notebook_path", "target_file"]) {
    if (typeof toolInput[key] === "string" && toolInput[key]) {
      candidates.push(toolInput[key]);
    }
  }

  if (Array.isArray(toolInput.paths)) {
    candidates.push(...toolInput.paths.filter((entry) => typeof entry === "string"));
  }

  return [...new Set(candidates)]
    .map((entry) => (path.isAbsolute(entry) ? entry : path.join(cwd, entry)))
    .filter(Boolean);
}

async function candidateSummary(filePath, projectRoot, config) {
  const stats = await fs.stat(filePath);
  const relPath = toPosix(path.relative(projectRoot, filePath));

  if (!relPath || relPath.startsWith("../")) {
    return { eligible: false, relPath, reason: "outside-project-root" };
  }

  if (stats.size > config.maxFileSizeBytes) {
    return { eligible: false, relPath, reason: "too-large" };
  }

  if (likelySensitive(relPath)) {
    return { eligible: false, relPath, reason: "sensitive-path" };
  }

  if (!matchAny(relPath, config.includeGlobs)) {
    return { eligible: false, relPath, reason: "not-included" };
  }

  if (matchAny(relPath, config.excludeGlobs)) {
    return { eligible: false, relPath, reason: "excluded" };
  }

  const buffer = await fs.readFile(filePath);
  if (looksBinary(buffer)) {
    return { eligible: false, relPath, reason: "binary" };
  }

  const content = normalizeText(buffer.toString("utf8"));
  if (!content) {
    return { eligible: false, relPath, reason: "empty" };
  }

  if (config.ignoreMarker && content.includes(config.ignoreMarker)) {
    return { eligible: false, relPath, reason: "ignore-marker" };
  }

  const redactedContent = redactSecrets(content).trim();
  if (!redactedContent) {
    return { eligible: false, relPath, reason: "empty-after-redaction" };
  }

  const digest = crypto.createHash("sha256").update(content).digest("hex");
  return {
    eligible: true,
    relPath,
    content: redactedContent,
    digest,
    stats
  };
}

async function gatherFiles(projectRoot, config) {
  const relPaths = [];
  await walk(projectRoot, relPaths);
  return relPaths.map((relPath) => path.join(projectRoot, relPath));
}

export async function syncWorkspace({
  client,
  config,
  projectRoot,
  workspaceName,
  state,
  candidatePaths = null,
  force = false
}) {
  const filesToCheck = candidatePaths ?? (await gatherFiles(projectRoot, config));
  const summary = {
    scanned: 0,
    synced: 0,
    skipped: 0,
    errors: [],
    syncedFiles: [],
    skippedFiles: []
  };

  const staged = [];

  for (const filePath of filesToCheck) {
    summary.scanned += 1;

    try {
      const details = await candidateSummary(filePath, projectRoot, config);
      if (!details.eligible) {
        summary.skipped += 1;
        if (details.relPath) {
          summary.skippedFiles.push({ path: details.relPath, reason: details.reason });
        }
        continue;
      }

      const previous = state.files[filePath];
      if (!force && previous && previous.digest === details.digest) {
        summary.skipped += 1;
        summary.skippedFiles.push({ path: details.relPath, reason: "unchanged" });
        continue;
      }

      staged.push({
        filePath,
        relPath: details.relPath,
        content: details.content,
        digest: details.digest,
        stats: details.stats
      });
    } catch (error) {
      summary.errors.push(`${filePath}: ${error.message}`);
    }

    if (staged.length >= config.maxFilesPerSync) {
      break;
    }
  }

  for (let index = 0; index < staged.length; index += 5) {
    const batch = staged.slice(index, index + 5);
    const payload = batch.map((file) => ({
      id: fileSourceId(projectRoot, file.relPath),
      tenant_id: client.tenantId,
      sub_tenant_id: client.subTenantId,
      title: file.relPath,
      source: "claude-code-plugin",
      description: `Workspace knowledge synced from ${workspaceName}`,
      url: `file://${file.filePath}`,
      timestamp: new Date(file.stats.mtimeMs).toISOString(),
      content: {
        text: file.content
      },
      metadata: {
        workspace: workspaceName,
        relative_path: file.relPath,
        extension: path.extname(file.relPath) || "none"
      },
      additional_metadata: {
        size_bytes: file.stats.size,
        plugin: "hydradb",
        content_redacted: file.redacted
      }
    }));

    await client.uploadKnowledge(payload);

    for (const file of batch) {
      state.files[file.filePath] = {
        digest: file.digest,
        relPath: file.relPath,
        syncedAt: new Date().toISOString()
      };
      summary.synced += 1;
      summary.syncedFiles.push(file.relPath);
    }
  }

  return summary;
}
