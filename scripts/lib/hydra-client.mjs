import { redactSecrets } from "./sanitize.mjs";

const DEFAULT_API_BASE = "https://api.hydradb.com";

export const DEFAULT_MEMORY_CAPTURE_INSTRUCTIONS =
  "Extract durable user preferences, working style, project decisions, recurring constraints, " +
  "team conventions, and follow-up commitments. Ignore credentials, transient tool noise, " +
  "and low-value chit-chat.";

function coerceErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function trimText(value, maxLength = 1200) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3)}...`;
}

function extractChunkText(chunk) {
  if (!chunk || typeof chunk !== "object") {
    return "";
  }

  if (typeof chunk.text === "string") {
    return chunk.text;
  }

  if (typeof chunk.chunk_text === "string") {
    return chunk.chunk_text;
  }

  if (typeof chunk.content === "string") {
    return chunk.content;
  }

  if (chunk.content && typeof chunk.content.text === "string") {
    return chunk.content.text;
  }

  if (typeof chunk.snippet === "string") {
    return chunk.snippet;
  }

  return "";
}

function extractChunkTitle(chunk) {
  if (!chunk || typeof chunk !== "object") {
    return "";
  }

  return (
    chunk.title ||
    chunk.source_title ||
    chunk.document_title ||
    chunk.source_id ||
    chunk.id ||
    chunk.metadata?.title ||
    ""
  );
}

function extractChunkRelations(chunk) {
  if (!chunk || typeof chunk !== "object") {
    return [];
  }

  const relations =
    chunk.graph_context?.chunk_relations ||
    chunk.chunk_relations ||
    chunk.relations ||
    [];

  if (!Array.isArray(relations)) {
    return [];
  }

  return relations
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }
      if (entry && typeof entry === "object") {
        return entry.relation || entry.label || JSON.stringify(entry);
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 3);
}

function extractQueryPaths(response) {
  const paths =
    response?.graph_context?.query_paths ||
    response?.query_paths ||
    response?.graph_context?.paths ||
    [];

  if (!Array.isArray(paths)) {
    return [];
  }

  return paths
    .map((entry) => {
      if (typeof entry === "string") {
        return trimText(redactSecrets(entry), 160);
      }
      if (entry && typeof entry === "object") {
        return trimText(redactSecrets(entry.path || entry.label || JSON.stringify(entry)), 160);
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeResponse(response) {
  const rawChunks = response?.chunks || response?.results || response?.context || [];
  const chunks = Array.isArray(rawChunks)
    ? rawChunks
        .map((chunk) => ({
          title: trimText(redactSecrets(extractChunkTitle(chunk)), 120),
          text: trimText(redactSecrets(extractChunkText(chunk))),
          score:
            typeof chunk?.score === "number"
              ? chunk.score
              : typeof chunk?.relevance_score === "number"
                ? chunk.relevance_score
                : undefined,
          sourceId: chunk?.source_id || chunk?.id || "",
          relations: extractChunkRelations(chunk).map((entry) =>
            trimText(redactSecrets(entry), 120)
          )
        }))
        .filter((chunk) => chunk.text)
    : [];

  return {
    chunks,
    queryPaths: extractQueryPaths(response)
  };
}

export class HydraClient {
  constructor({ apiKey, tenantId, subTenantId, baseUrl = DEFAULT_API_BASE }) {
    this.apiKey = apiKey;
    this.tenantId = tenantId;
    this.subTenantId = subTenantId;
    this.baseUrl = baseUrl.replace(/\/+$/g, "");
  }

  async request(path, body, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method || "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: body == null ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 15000)
    });

    if (!response.ok) {
      const text = trimText(await response.text().catch(() => ""));
      throw new Error(`${path} failed with ${response.status}${text ? `: ${text}` : ""}`);
    }

    if (response.status === 204) {
      return {};
    }

    return response.json();
  }

  async recallMemories(query, options = {}) {
    const payload = {
      tenant_id: this.tenantId,
      sub_tenant_id: this.subTenantId,
      query,
      mode: options.mode || "fast",
      max_results: options.maxResults || 6,
      alpha: 0.8,
      recency_bias: options.recencyBias ?? 0,
      graph_context: options.graphContext ?? true
    };

    return normalizeResponse(await this.request("/recall/recall_preferences", payload));
  }

  async recallKnowledge(query, options = {}) {
    const payload = {
      tenant_id: this.tenantId,
      sub_tenant_id: this.subTenantId,
      query,
      mode: options.mode || "fast",
      max_results: options.maxResults || 6,
      alpha: 0.8,
      recency_bias: options.recencyBias ?? 0,
      graph_context: options.graphContext ?? true
    };

    return normalizeResponse(await this.request("/recall/full_recall", payload));
  }

  async addTextMemory(text, options = {}) {
    const infer = options.infer ?? true;
    const payload = {
      memories: [
        {
          text,
          infer,
          is_markdown: options.isMarkdown ?? false,
          title: options.title || undefined,
          user_name: options.userName || undefined,
          custom_instructions:
            infer ? options.customInstructions || DEFAULT_MEMORY_CAPTURE_INSTRUCTIONS : undefined,
          source_id: options.sourceId || undefined
        }
      ],
      tenant_id: this.tenantId,
      sub_tenant_id: this.subTenantId,
      upsert: true
    };

    return this.request("/memories/add_memory", payload);
  }

  async addConversationMemory(userText, assistantText, options = {}) {
    const payload = {
      memories: [
        {
          user_assistant_pairs: [
            {
              user: userText,
              assistant: assistantText
            }
          ],
          infer: true,
          user_name: options.userName || undefined,
          custom_instructions:
            options.customInstructions || DEFAULT_MEMORY_CAPTURE_INSTRUCTIONS,
          source_id: options.sourceId || undefined
        }
      ],
      tenant_id: this.tenantId,
      sub_tenant_id: this.subTenantId,
      upsert: true
    };

    return this.request("/memories/add_memory", payload);
  }

  async uploadKnowledge(appKnowledge) {
    const payload = {
      app_knowledge: appKnowledge
    };

    return this.request("/ingestion/upload_knowledge", payload, { timeoutMs: 30000 });
  }
}

export function combineRecallErrors(results) {
  return results
    .filter((entry) => entry.status === "rejected")
    .map((entry) => coerceErrorMessage(entry.reason));
}
