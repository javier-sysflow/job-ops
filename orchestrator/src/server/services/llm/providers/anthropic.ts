import type { LlmMessageContent, LlmRequestOptions } from "../types";
import { getLlmMessageText } from "../types";
import { buildHeaders, joinUrl } from "../utils/http";
import { getNestedValue } from "../utils/object";
import { createProviderStrategy } from "./factory";

// Current Claude models think before answering and thinking tokens count
// toward max_tokens, so a small cap truncates long outputs (tailored CVs,
// Japanese text) mid-JSON. 16000 stays well under non-streaming timeouts.
const DEFAULT_MAX_TOKENS = 16000;

const SERVER_SIDE_FALLBACK_BETA = "server-side-fallback-2026-07-01";

// Models that accept the server-side `fallbacks` parameter, which reroutes a
// request Claude's safety classifiers decline instead of failing it.
const SERVER_SIDE_FALLBACK_MODELS = new Set([
  "claude-fable-5-2",
  "claude-fable-5-1",
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
]);

type AnthropicEffort = "low" | "medium" | "high" | "xhigh" | "max";
const ANTHROPIC_EFFORT_VALUES = new Set<AnthropicEffort>([
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

function readEnv(name: string): string | undefined {
  return typeof process !== "undefined"
    ? process.env[name]?.trim() || undefined
    : undefined;
}

function parseClaudeModel(
  model: string,
): { family: string; major: number; minor: number } | null {
  const match = model
    .trim()
    .toLowerCase()
    .match(/^claude-(opus|sonnet|haiku|fable|mythos)-(\d+)(?:-(\d+))?/);
  if (!match) return null;
  return {
    family: match[1],
    major: Number(match[2]),
    minor: match[3] ? Number(match[3]) : 0,
  };
}

/**
 * Effort steers how much a model thinks. Sonnet/Haiku handle the high-volume
 * routine work here (job scoring, email sorting), where `low` keeps cost down;
 * Opus-class models keep their own default. Older models without effort
 * support (e.g. Haiku 4.5, Sonnet 4.5) get no effort field at all.
 */
export function resolveAnthropicEffort(
  model: string,
): AnthropicEffort | undefined {
  const parsed = parseClaudeModel(model);
  if (!parsed) return undefined;
  const supportsEffort =
    parsed.major >= 5 ||
    (parsed.major === 4 && parsed.minor >= 6 && parsed.family !== "haiku");
  if (!supportsEffort) return undefined;
  if (parsed.family !== "sonnet" && parsed.family !== "haiku") return undefined;

  const configured = readEnv("ANTHROPIC_ROUTINE_EFFORT")?.toLowerCase();
  if (
    configured &&
    ANTHROPIC_EFFORT_VALUES.has(configured as AnthropicEffort)
  ) {
    return configured as AnthropicEffort;
  }
  return "low";
}

export function usesServerSideFallback(model: string): boolean {
  if (readEnv("ANTHROPIC_SERVER_FALLBACKS")?.toLowerCase() === "false") {
    return false;
  }
  return SERVER_SIDE_FALLBACK_MODELS.has(model.trim().toLowerCase());
}

/**
 * Anthropic's structured output (`output_config.format.schema`) only supports a
 * subset of JSON Schema. Validation/constraint keywords such as `maxItems`
 * cause a 400 (e.g. "For 'array' type, property 'maxItems' is not supported").
 * Schemas in this codebase are authored to work across providers (OpenAI /
 * OpenRouter accept these keywords), so strip the unsupported keywords before
 * sending to Anthropic instead of maintaining a separate schema per provider.
 */
const ANTHROPIC_UNSUPPORTED_SCHEMA_KEYWORDS = new Set([
  "minItems",
  "maxItems",
  "uniqueItems",
  "minLength",
  "maxLength",
  "pattern",
  "format",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minProperties",
  "maxProperties",
]);

// Keys whose values are maps of (arbitrary) names to nested schemas. Their keys
// must be preserved verbatim and only their values sanitized, so a property
// legitimately named e.g. "format" or "pattern" is never dropped.
const SCHEMA_NAME_MAP_KEYS = new Set([
  "properties",
  "patternProperties",
  "$defs",
  "definitions",
]);

function sanitizeAnthropicSchema(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(sanitizeAnthropicSchema);
  }
  if (!node || typeof node !== "object") {
    return node;
  }

  const source = node as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (ANTHROPIC_UNSUPPORTED_SCHEMA_KEYWORDS.has(key)) {
      continue;
    }

    if (
      SCHEMA_NAME_MAP_KEYS.has(key) &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      const nested: Record<string, unknown> = {};
      for (const [name, schema] of Object.entries(
        value as Record<string, unknown>,
      )) {
        nested[name] = sanitizeAnthropicSchema(schema);
      }
      result[key] = nested;
      continue;
    }

    result[key] = sanitizeAnthropicSchema(value);
  }

  return result;
}

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: AnthropicImageSource;
    };

type AnthropicImageSource =
  | { type: "base64"; media_type: string; data: string }
  | { type: "url"; url: string };

export const anthropicStrategy = createProviderStrategy({
  provider: "anthropic",
  defaultBaseUrl: "https://api.anthropic.com",
  requiresApiKey: true,
  modes: ["json_schema", "json_object", "none"],
  validationPaths: ["/v1/models"],
  buildRequest: ({ mode, baseUrl, apiKey, model, messages, jsonSchema }) => {
    const { system, anthropicMessages } = toAnthropicMessages(messages);
    const body: Record<string, unknown> = {
      model,
      max_tokens: DEFAULT_MAX_TOKENS,
      messages: anthropicMessages,
    };

    if (system) {
      body.system = system;
    }

    const outputConfig: Record<string, unknown> = {};
    if (mode === "json_schema") {
      outputConfig.format = {
        type: "json_schema",
        schema: sanitizeAnthropicSchema(jsonSchema.schema),
      };
    } else if (mode === "json_object") {
      outputConfig.format = {
        type: "json_schema",
        schema: {
          type: "object",
          additionalProperties: true,
        },
      };
    }

    const effort = resolveAnthropicEffort(model);
    if (effort) {
      outputConfig.effort = effort;
    }

    if (Object.keys(outputConfig).length > 0) {
      body.output_config = outputConfig;
    }

    const headers = buildHeaders({ apiKey, provider: "anthropic" });
    if (usesServerSideFallback(model)) {
      body.fallbacks = "default";
      headers["anthropic-beta"] = SERVER_SIDE_FALLBACK_BETA;
    }

    return {
      url: joinUrl(baseUrl, "/v1/messages"),
      headers,
      body,
    };
  },
  extractText: (response) => {
    const stopReason = getNestedValue(response, ["stop_reason"]);
    if (stopReason === "refusal") {
      const category = getNestedValue(response, ["stop_details", "category"]);
      throw new Error(
        `Claude declined this request${
          typeof category === "string" ? ` (${category})` : ""
        }.`,
      );
    }
    if (stopReason === "max_tokens") {
      throw new Error(
        "Claude's reply hit the output token limit before finishing.",
      );
    }

    const content = getNestedValue(response, ["content"]);
    if (!Array.isArray(content)) return null;

    const text = content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const type = getNestedValue(part, ["type"]);
        const value = getNestedValue(part, ["text"]);
        return type === "text" && typeof value === "string" ? value : "";
      })
      .join("");

    return text || null;
  },
});

function toAnthropicMessages(
  messages: LlmRequestOptions<unknown>["messages"],
): {
  system: string | null;
  anthropicMessages: Array<{
    role: "user" | "assistant";
    content: string | AnthropicContentBlock[];
  }>;
} {
  const systemMessages: string[] = [];
  const anthropicMessages: Array<{
    role: "user" | "assistant";
    content: string | AnthropicContentBlock[];
  }> = [];

  for (const message of messages) {
    if (message.role === "system") {
      const text = getLlmMessageText(message.content).trim();
      if (text) systemMessages.push(text);
      continue;
    }

    anthropicMessages.push({
      role: message.role,
      content: toAnthropicContent(message.content),
    });
  }

  return {
    system: systemMessages.length > 0 ? systemMessages.join("\n\n") : null,
    anthropicMessages,
  };
}

function toAnthropicContent(
  content: LlmMessageContent,
): string | AnthropicContentBlock[] {
  if (typeof content === "string") return content;
  return content.map((part) => {
    if (part.type === "text") {
      return { type: "text", text: part.text };
    }

    return {
      type: "image",
      source: toAnthropicImageSource(part.imageUrl, part.mediaType),
    };
  });
}

function toAnthropicImageSource(
  imageUrl: string,
  fallbackMediaType: string,
): AnthropicImageSource {
  const match = imageUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    return { type: "url", url: imageUrl };
  }

  return {
    type: "base64",
    media_type: match[1] || fallbackMediaType,
    data: match[2],
  };
}
