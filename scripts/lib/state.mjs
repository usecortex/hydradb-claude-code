import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_STATE = {
  version: 1,
  files: {},
  sessions: {},
  lastSessionId: ""
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

export async function ensureDataDir(dataDir) {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function readState(dataDir) {
  await ensureDataDir(dataDir);
  const statePath = path.join(dataDir, "state.json");

  try {
    const raw = await fs.readFile(statePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...cloneDefaultState(),
      ...parsed,
      files: parsed.files && typeof parsed.files === "object" ? parsed.files : {},
      sessions: parsed.sessions && typeof parsed.sessions === "object" ? parsed.sessions : {},
      lastSessionId: typeof parsed.lastSessionId === "string" ? parsed.lastSessionId : ""
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return cloneDefaultState();
    }
    return cloneDefaultState();
  }
}

export async function writeState(dataDir, state) {
  await ensureDataDir(dataDir);
  const statePath = path.join(dataDir, "state.json");
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
