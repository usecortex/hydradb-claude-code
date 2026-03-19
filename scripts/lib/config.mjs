import fs from "node:fs/promises";
import path from "node:path";

export const PROJECT_CONFIG_FILES = [
  ".hydradb-plugin.json",
  ".hydradb-plugin.local.json"
];

const DEFAULT_INCLUDE_GLOBS = [
  "CLAUDE.md",
  ".claude/**/*.md",
  "**/*.md",
  "**/*.mdx",
  "**/*.txt",
  "**/*.rst",
  "**/*.adoc"
];

const DEFAULT_EXCLUDE_GLOBS = [
  ".git/**",
  "node_modules/**",
  "dist/**",
  "build/**",
  "coverage/**",
  ".next/**",
  ".nuxt/**",
  ".turbo/**",
  ".cache/**",
  ".venv/**",
  "venv/**",
  "target/**",
  "vendor/**",
  "**/.env*",
  ".env*",
  "**/*.lock",
  "**/*.min.*",
  "**/*.map",
  "**/*.pem",
  "**/*.key",
  "**/*.crt",
  "**/*.cer"
];

export const DEFAULTS = {
  apiBaseUrl: "https://api.hydradb.com",
  autoRecall: true,
  autoCapture: true,
  autoIngest: true,
  recallMode: "fast",
  graphContext: true,
  maxContextChars: 7000,
  maxMemoryResults: 4,
  maxKnowledgeResults: 6,
  maxFileSizeBytes: 250000,
  maxFilesPerSync: 25,
  includeGlobs: DEFAULT_INCLUDE_GLOBS,
  excludeGlobs: DEFAULT_EXCLUDE_GLOBS,
  ignoreMarker: "hydra-ignore",
  debug: false
};

const KNOWN_KEYS = new Set([
  "apiBaseUrl",
  "apiKey",
  "tenantId",
  "subTenantId",
  "userName",
  "autoRecall",
  "autoCapture",
  "autoIngest",
  "recallMode",
  "graphContext",
  "maxContextChars",
  "maxMemoryResults",
  "maxKnowledgeResults",
  "maxFileSizeBytes",
  "maxFilesPerSync",
  "includeGlobs",
  "excludeGlobs",
  "ignoreMarker",
  "debug",
  "memoryCustomInstructions"
]);

function envOrUndefined(name) {
  return process.env[name];
}

function resolveEnvString(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\$\{([^}]+)\}/g, (_, name) => {
    const resolved = envOrUndefined(name);
    if (resolved == null || resolved === "") {
      throw new Error(`environment variable ${name} is not set`);
    }
    return resolved;
  });
}

function resolveEnvObject(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => resolveEnvObject(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, resolveEnvObject(entry)])
    );
  }

  return resolveEnvString(value);
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseBoolean(value, fallback, errors, label) {
  if (value == null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  errors.push(`${label} must be a boolean`);
  return fallback;
}

function parseNumber(value, fallback, errors, label, options = {}) {
  if (value == null) {
    return fallback;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    errors.push(`${label} must be a number`);
    return fallback;
  }

  if (options.min != null && value < options.min) {
    errors.push(`${label} must be >= ${options.min}`);
    return fallback;
  }

  return value;
}

function parseStringArray(value, fallback, errors, label) {
  if (value == null) {
    return fallback;
  }

  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    errors.push(`${label} must be an array of strings`);
    return fallback;
  }

  return value;
}

function sanitizeSegment(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "workspace";
}

async function findProjectRoot(startDir) {
  let current = path.resolve(startDir);

  while (true) {
    for (const candidate of [".git", "CLAUDE.md", ...PROJECT_CONFIG_FILES]) {
      if (await fileExists(path.join(current, candidate))) {
        return current;
      }
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDir);
    }
    current = parent;
  }
}

function parseEnvBoolean(name) {
  const value = envOrUndefined(name);
  if (value == null || value === "") {
    return undefined;
  }
  return /^(1|true|yes|on)$/i.test(value);
}

function parseEnvNumber(name) {
  const value = envOrUndefined(name);
  if (value == null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function applyKnownKeys(baseConfig, incoming, sourceLabel, errors) {
  const next = { ...baseConfig };

  for (const key of Object.keys(incoming)) {
    if (!KNOWN_KEYS.has(key)) {
      errors.push(`${sourceLabel}: unknown config key "${key}" was ignored`);
      continue;
    }
    next[key] = incoming[key];
  }

  return next;
}

export async function loadConfig(cwd, dataDir) {
  const projectRoot = await findProjectRoot(cwd);
  const workspaceName = path.basename(projectRoot);
  const dataConfigPath = path.join(dataDir, "config.json");
  const explicitConfig = envOrUndefined("HYDRADB_PLUGIN_CONFIG");
  const candidateFiles = [];

  if (explicitConfig) {
    candidateFiles.push(path.isAbsolute(explicitConfig) ? explicitConfig : path.join(cwd, explicitConfig));
  }

  candidateFiles.push(dataConfigPath);
  for (const name of PROJECT_CONFIG_FILES) {
    candidateFiles.push(path.join(projectRoot, name));
  }

  let merged = { ...DEFAULTS };
  const sources = [];
  const errors = [];

  for (const filePath of candidateFiles) {
    if (!(await fileExists(filePath))) {
      continue;
    }

    try {
      const parsed = resolveEnvObject(await readJsonFile(filePath));
      merged = applyKnownKeys(merged, parsed, filePath, errors);
      sources.push(filePath);
    } catch (error) {
      errors.push(`${filePath}: ${error.message}`);
    }
  }

  const envOverrides = {
    apiBaseUrl: envOrUndefined("HYDRADB_BASE_URL"),
    apiKey: envOrUndefined("HYDRADB_API_KEY"),
    tenantId: envOrUndefined("HYDRADB_TENANT_ID"),
    subTenantId: envOrUndefined("HYDRADB_SUB_TENANT_ID"),
    userName: envOrUndefined("HYDRADB_USER_NAME"),
    recallMode: envOrUndefined("HYDRADB_RECALL_MODE"),
    ignoreMarker: envOrUndefined("HYDRADB_IGNORE_MARKER"),
    memoryCustomInstructions: envOrUndefined("HYDRADB_MEMORY_CUSTOM_INSTRUCTIONS"),
    autoRecall: parseEnvBoolean("HYDRADB_AUTO_RECALL"),
    autoCapture: parseEnvBoolean("HYDRADB_AUTO_CAPTURE"),
    autoIngest: parseEnvBoolean("HYDRADB_AUTO_INGEST"),
    graphContext: parseEnvBoolean("HYDRADB_GRAPH_CONTEXT"),
    debug: parseEnvBoolean("HYDRADB_DEBUG"),
    maxContextChars: parseEnvNumber("HYDRADB_MAX_CONTEXT_CHARS"),
    maxMemoryResults: parseEnvNumber("HYDRADB_MAX_MEMORY_RESULTS"),
    maxKnowledgeResults: parseEnvNumber("HYDRADB_MAX_KNOWLEDGE_RESULTS"),
    maxFileSizeBytes: parseEnvNumber("HYDRADB_MAX_FILE_SIZE_BYTES"),
    maxFilesPerSync: parseEnvNumber("HYDRADB_MAX_FILES_PER_SYNC")
  };

  merged = applyKnownKeys(
    merged,
    Object.fromEntries(
      Object.entries(envOverrides).filter(([, value]) => value != null && value !== "")
    ),
    "environment",
    errors
  );

  const config = {
    apiBaseUrl:
      typeof merged.apiBaseUrl === "string" && merged.apiBaseUrl
        ? merged.apiBaseUrl.replace(/\/+$/g, "")
        : DEFAULTS.apiBaseUrl,
    apiKey: typeof merged.apiKey === "string" && merged.apiKey ? merged.apiKey : "",
    tenantId: typeof merged.tenantId === "string" && merged.tenantId ? merged.tenantId : "",
    subTenantId:
      typeof merged.subTenantId === "string" && merged.subTenantId
        ? merged.subTenantId
        : `claude-${sanitizeSegment(workspaceName)}`,
    userName: typeof merged.userName === "string" ? merged.userName : "",
    autoRecall: parseBoolean(merged.autoRecall, DEFAULTS.autoRecall, errors, "autoRecall"),
    autoCapture: parseBoolean(merged.autoCapture, DEFAULTS.autoCapture, errors, "autoCapture"),
    autoIngest: parseBoolean(merged.autoIngest, DEFAULTS.autoIngest, errors, "autoIngest"),
    recallMode: merged.recallMode === "thinking" ? "thinking" : "fast",
    graphContext: parseBoolean(merged.graphContext, DEFAULTS.graphContext, errors, "graphContext"),
    maxContextChars: parseNumber(
      merged.maxContextChars,
      DEFAULTS.maxContextChars,
      errors,
      "maxContextChars",
      { min: 512 }
    ),
    maxMemoryResults: parseNumber(
      merged.maxMemoryResults,
      DEFAULTS.maxMemoryResults,
      errors,
      "maxMemoryResults",
      { min: 1 }
    ),
    maxKnowledgeResults: parseNumber(
      merged.maxKnowledgeResults,
      DEFAULTS.maxKnowledgeResults,
      errors,
      "maxKnowledgeResults",
      { min: 1 }
    ),
    maxFileSizeBytes: parseNumber(
      merged.maxFileSizeBytes,
      DEFAULTS.maxFileSizeBytes,
      errors,
      "maxFileSizeBytes",
      { min: 1024 }
    ),
    maxFilesPerSync: parseNumber(
      merged.maxFilesPerSync,
      DEFAULTS.maxFilesPerSync,
      errors,
      "maxFilesPerSync",
      { min: 1 }
    ),
    includeGlobs: parseStringArray(
      merged.includeGlobs,
      DEFAULTS.includeGlobs,
      errors,
      "includeGlobs"
    ),
    excludeGlobs: parseStringArray(
      merged.excludeGlobs,
      DEFAULTS.excludeGlobs,
      errors,
      "excludeGlobs"
    ),
    ignoreMarker:
      typeof merged.ignoreMarker === "string" && merged.ignoreMarker
        ? merged.ignoreMarker
        : DEFAULTS.ignoreMarker,
    debug: parseBoolean(merged.debug, DEFAULTS.debug, errors, "debug"),
    memoryCustomInstructions:
      typeof merged.memoryCustomInstructions === "string"
        ? merged.memoryCustomInstructions
        : ""
  };

  return {
    configured: Boolean(config.apiKey && config.tenantId),
    config,
    projectRoot,
    workspaceName,
    dataDir,
    dataConfigPath,
    sources,
    errors
  };
}

export function formatStatus(configResult, state) {
  const { configured, config, projectRoot, workspaceName, dataConfigPath, sources, errors } = configResult;
  const trackedFiles = Object.keys(state.files ?? {}).length;
  const trackedSessions = Object.keys(state.sessions ?? {}).length;

  return {
    configured,
    workspaceName,
    projectRoot,
    dataConfigPath,
    configSources: sources,
    errors,
    resolvedConfig: {
      apiBaseUrl: config.apiBaseUrl,
      tenantId: config.tenantId || "",
      subTenantId: config.subTenantId,
      userName: config.userName || "",
      autoRecall: config.autoRecall,
      autoCapture: config.autoCapture,
      autoIngest: config.autoIngest,
      recallMode: config.recallMode,
      graphContext: config.graphContext,
      maxContextChars: config.maxContextChars,
      maxMemoryResults: config.maxMemoryResults,
      maxKnowledgeResults: config.maxKnowledgeResults,
      maxFileSizeBytes: config.maxFileSizeBytes,
      maxFilesPerSync: config.maxFilesPerSync,
      ignoreMarker: config.ignoreMarker,
      includeGlobs: config.includeGlobs,
      excludeGlobs: config.excludeGlobs,
      debug: config.debug
    },
    stateSummary: {
      trackedFiles,
      trackedSessions
    }
  };
}
