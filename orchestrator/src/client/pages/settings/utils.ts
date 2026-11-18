/**
 * Settings page helpers.
 */

import i18n from "@client/i18n";
import { mapGlmProviderAlias } from "@shared/settings-registry";
import type { ResumeProjectsSettings } from "@shared/types";
import { arraysEqual } from "@/lib/utils";

export function resumeProjectsEqual(
  a: ResumeProjectsSettings,
  b: ResumeProjectsSettings,
) {
  return (
    a.maxProjects === b.maxProjects &&
    arraysEqual(a.lockedProjectIds, b.lockedProjectIds) &&
    arraysEqual(a.aiSelectableProjectIds, b.aiSelectableProjectIds)
  );
}

export const formatSecretHint = (hint: string | null) =>
  hint ? `${hint}********` : i18n.t("settings:shared.notSet");

export const LLM_PROVIDERS = [
  "atlascloud",
  "litellm",
  "openrouter",
  "orcarouter",
  "requesty",
  "api_route",
  "lmstudio",
  "ollama",
  "openai",
  "anthropic",
  "openai_compatible",
  "glm",
  "gemini",
  "gemini_cli",
  "claude_cli",
  "codex",
] as const;

export type LlmProviderId = (typeof LLM_PROVIDERS)[number];
export const LLM_MODEL_SUGGESTION_PROVIDERS = [
  "atlascloud",
  "litellm",
  "openai",
  "anthropic",
  "glm",
  "gemini",
  "gemini_cli",
  "claude_cli",
  "ollama",
  "requesty",
  "api_route",
  "orcarouter",
] as const;

export const LLM_PROVIDER_LABELS: Record<LlmProviderId, string> = {
  atlascloud: "Atlas Cloud",
  litellm: "LiteLLM",
  openrouter: "OpenRouter",
  orcarouter: "OrcaRouter",
  requesty: "Requesty",
  api_route: "API Route",
  lmstudio: "LM Studio",
  ollama: "Ollama",
  openai: "OpenAI",
  anthropic: "Claude (Anthropic)",
  openai_compatible: "OpenAI-compatible",
  glm: "GLM",
  gemini: "Gemini",
  gemini_cli: "Gemini (CLI)",
  claude_cli: "Claude (CLI)",
  codex: "Codex",
};

/** Provider name for the UI; only the generic "OpenAI-compatible" is translated. */
export function getLlmProviderLabel(provider: LlmProviderId): string {
  return provider === "openai_compatible"
    ? i18n.t("settings:llm.providers.openaiCompatible")
    : LLM_PROVIDER_LABELS[provider];
}

const PROVIDERS_WITH_API_KEY = new Set<LlmProviderId>([
  "atlascloud",
  "openrouter",
  "orcarouter",
  "requesty",
  "api_route",
  "openai",
  "anthropic",
  "openai_compatible",
  "glm",
  "gemini",
]);

const PROVIDERS_WITH_OPTIONAL_API_KEY = new Set<LlmProviderId>([
  "litellm",
  "ollama",
]);

const PROVIDERS_WITH_BASE_URL = new Set<LlmProviderId>([
  "litellm",
  "lmstudio",
  "ollama",
  "openai_compatible",
  "glm",
]);

// Provider hints and API-key helper texts are translated through
// settings:llm.providerHints.<provider> and settings:llm.keyHelpers.<provider>.
const PROVIDER_KEY_HELPER_HREFS: Partial<Record<LlmProviderId, string>> = {
  atlascloud: "https://www.atlascloud.ai/console/api-keys",
  litellm: "https://docs.litellm.ai/docs/proxy/virtual_keys",
  openrouter: "https://openrouter.ai/keys",
  orcarouter: "https://www.orcarouter.ai/console",
  requesty: "https://app.requesty.ai/api-keys",
  api_route: "https://www.api-route.com/api-keys",
  openai: "https://platform.openai.com/api-keys",
  anthropic: "https://platform.claude.com/settings/keys",
  glm: "https://z.ai/manage-apikey/apikey-list",
  gemini: "https://aistudio.google.com/app/apikey",
};

const BASE_URL_PROVIDERS = [
  "litellm",
  "lmstudio",
  "ollama",
  "openai_compatible",
  "glm",
] as const;
type BaseUrlProviderId = (typeof BASE_URL_PROVIDERS)[number];

const PROVIDER_BASE_URLS: Record<BaseUrlProviderId, string> = {
  litellm: "http://localhost:4000",
  lmstudio: "http://localhost:1234",
  ollama: "http://localhost:11434",
  openai_compatible: "https://api.example.com/v1/chat/completions",
  glm: "https://api.z.ai/api/paas/v4",
};

export function normalizeLlmProvider(
  value: string | null | undefined,
): LlmProviderId {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "openrouter";
  const normalizedId = normalized.replace(/[-.]/g, "_");
  if (normalizedId === "claude") return "anthropic";
  if (normalizedId === "openai_compatible") return "openai_compatible";
  const mapped = mapGlmProviderAlias(normalizedId);
  return (LLM_PROVIDERS as readonly string[]).includes(mapped)
    ? (mapped as LlmProviderId)
    : "openrouter";
}

export function supportsLlmModelSuggestions(
  provider: string | null | undefined,
): boolean {
  const normalizedProvider = normalizeLlmProvider(provider);
  return (LLM_MODEL_SUGGESTION_PROVIDERS as readonly string[]).includes(
    normalizedProvider,
  );
}

export function getLlmProviderConfig(provider: string | null | undefined) {
  const normalizedProvider = normalizeLlmProvider(provider);
  const requiresApiKey = PROVIDERS_WITH_API_KEY.has(normalizedProvider);
  const showApiKey =
    requiresApiKey || PROVIDERS_WITH_OPTIONAL_API_KEY.has(normalizedProvider);
  const showBaseUrl = PROVIDERS_WITH_BASE_URL.has(normalizedProvider);
  const baseUrlPlaceholder = showBaseUrl
    ? PROVIDER_BASE_URLS[normalizedProvider as BaseUrlProviderId]
    : "";
  const baseUrlHelper = showBaseUrl
    ? normalizedProvider === "openai_compatible"
      ? i18n.t("settings:llm.baseUrlHelpers.openaiCompatible")
      : normalizedProvider === "litellm"
        ? i18n.t("settings:llm.baseUrlHelpers.litellm")
        : normalizedProvider === "ollama"
          ? i18n.t("settings:llm.baseUrlHelpers.ollama")
          : i18n.t("settings:llm.baseUrlHelpers.default", {
              url: baseUrlPlaceholder,
            })
    : "";
  const providerHint = i18n.t(
    `settings:llm.providerHints.${normalizedProvider}`,
  );

  return {
    normalizedProvider,
    label: getLlmProviderLabel(normalizedProvider),
    showApiKey,
    showBaseUrl,
    requiresApiKey,
    baseUrlPlaceholder,
    baseUrlHelper,
    providerHint,
    keyHelperText: i18n.t(`settings:llm.keyHelpers.${normalizedProvider}`),
    keyHelperHref: PROVIDER_KEY_HELPER_HREFS[normalizedProvider] ?? null,
  };
}
