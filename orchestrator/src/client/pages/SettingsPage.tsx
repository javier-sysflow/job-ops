import * as api from "@client/api";
import { PageHeader } from "@client/components/layout";
import {
  type SectionWorkspaceBadge,
  SectionWorkspaceNav,
  SectionWorkspacePanel,
  sectionWorkspaceItemMatchesSearch,
} from "@client/components/section-workspace/SectionWorkspace";
import { useUpdateSettingsMutation } from "@client/hooks/queries/useSettingsMutation";
import { useRxResumeConfigState } from "@client/hooks/useRxResumeConfigState";
import { useTracerReadiness } from "@client/hooks/useTracerReadiness";
import {
  getRxResumeCredentialDrafts,
  getRxResumeCredentialPrecheckFailure,
  isRxResumeAvailabilityValidationFailure,
  isRxResumeBlockingValidationFailure,
  RXRESUME_PRECHECK_MESSAGES,
  toRxResumeValidationPayload,
  validateAndMaybePersistRxResumeMode,
} from "@client/lib/rxresume-config";
import { BackupSettingsSection } from "@client/pages/settings/components/BackupSettingsSection";
import { BillingSettingsSection } from "@client/pages/settings/components/BillingSettingsSection";
import { ChatSettingsSection } from "@client/pages/settings/components/ChatSettingsSection";
import { DangerZoneSection } from "@client/pages/settings/components/DangerZoneSection";
import { DisplaySettingsSection } from "@client/pages/settings/components/DisplaySettingsSection";
import { EnvironmentSettingsSection } from "@client/pages/settings/components/EnvironmentSettingsSection";
import { ModelSettingsSection } from "@client/pages/settings/components/ModelSettingsSection";
import { PromptTemplatesSection } from "@client/pages/settings/components/PromptTemplatesSection";
import { ReactiveResumeSection } from "@client/pages/settings/components/ReactiveResumeSection";
import { ScoringSettingsSection } from "@client/pages/settings/components/ScoringSettingsSection";
import { TracerLinksSettingsSection } from "@client/pages/settings/components/TracerLinksSettingsSection";
import { WebhooksSection } from "@client/pages/settings/components/WebhooksSection";
import {
  type LlmProviderId,
  normalizeLlmProvider,
  resumeProjectsEqual,
} from "@client/pages/settings/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { normalizeStringArray } from "@shared/normalize-string-array.js";
import {
  type UpdateSettingsInput,
  updateSettingsSchema,
} from "@shared/settings-schema.js";
import type {
  AppSettings,
  JobStatus,
  ResumeProjectCatalogItem,
  ResumeProjectsSettings,
  ValidationResult,
} from "@shared/types.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FormProvider,
  type Resolver,
  useForm,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useQueryErrorToast } from "@/client/hooks/useQueryErrorToast";
import { formatUserFacingError } from "@/client/lib/error-format";
import { showErrorToast } from "@/client/lib/error-toast";
import { queryKeys } from "@/client/lib/queryKeys";
import { Settings } from "@/components/icons";
import { Button } from "@/components/ui/button";

const DEFAULT_FORM_VALUES: UpdateSettingsInput = {
  model: "",
  modelScorer: "",
  modelTailoring: "",
  modelProjectSelection: "",
  llmProvider: null,
  llmBaseUrl: "",
  llmApiKey: "",
  llmPurposeOverrides: {},
  llmPurposeApiKeys: {},
  pipelineWebhookUrl: "",
  jobCompleteWebhookUrl: "",
  resumeProjects: null,
  pdfRenderer: "rxresume",
  typstTheme: "classic",
  pdfPaperSize: "auto",
  rxresumeBaseResumeId: null,
  showSponsorInfo: null,
  renderMarkdownInJobDescriptions: null,
  autoTailorOnManualImport: null,
  applicationStageStyle: "standard",
  chatStyleTone: "",
  chatStyleFormality: "",
  chatStyleConstraints: "",
  chatStyleDoNotUse: "",
  ghostwriterStopSlopEnabled: null,
  chatStyleSummaryMaxWords: null,
  chatStyleMaxKeywordsPerSkill: null,
  chatStyleLanguageMode: null,
  chatStyleManualLanguage: null,
  rxresumeUrl: "",
  rxresumeApiKey: "",
  ukvisajobsEmail: "",
  ukvisajobsPassword: "",
  adzunaAppId: "",
  adzunaAppKey: "",
  webhookSecret: "",
  backupEnabled: null,
  backupHour: null,
  backupMaxCount: null,
  penalizeMissingSalary: null,
  missingSalaryPenalty: null,
  autoSkipScoreThreshold: null,
  blockedCompanyKeywords: [],
  ghostwriterSystemPromptTemplate: "",
  tailoringPromptTemplate: "",
  scoringPromptTemplate: "",
};

type LlmProviderValue = LlmProviderId | null;
type RxResumeValidationBadgeState = {
  checked: boolean;
  valid: boolean;
  message: string | null;
  status: number | null;
};
const EMPTY_RXRESUME_VALIDATION_BADGE_STATE: RxResumeValidationBadgeState = {
  checked: false,
  valid: false,
  message: null,
  status: null,
};

type SettingsSectionId =
  | "billing"
  | "model"
  | "chat"
  | "prompt-templates"
  | "scoring"
  | "reactive-resume"
  | "webhooks"
  | "tracer-links"
  | "environment"
  | "display"
  | "backup"
  | "danger-zone";

type SettingsGroupId =
  | "account"
  | "ai"
  | "scoring"
  | "integrations"
  | "workspaces"
  | "display"
  | "backups"
  | "danger";

type SettingsSectionDescriptor = {
  id: SettingsSectionId;
  label: string;
  description: string;
  searchTerms: string[];
};

type SettingsNavGroup = {
  id: SettingsGroupId;
  items: SettingsSectionDescriptor[];
  label: string;
};

// Labels and descriptions come from settings:nav.* (see buildSettingsNavGroups).
type SettingsNavGroupDefinition = {
  id: SettingsGroupId;
  items: Array<Pick<SettingsSectionDescriptor, "id" | "searchTerms">>;
};

const SETTINGS_NAV_GROUP_DEFINITIONS: SettingsNavGroupDefinition[] = [
  {
    id: "account",
    items: [
      {
        id: "billing",
        searchTerms: ["plan", "billing", "subscription", "stripe", "pro"],
      },
    ],
  },
  {
    id: "ai",
    items: [
      {
        id: "model",
        searchTerms: [
          "llm",
          "provider",
          "openai",
          "glm",
          "gemini",
          "gemini_cli",
          "claude",
          "claude_cli",
          "ollama",
          "litellm",
          "codex",
        ],
      },
      {
        id: "chat",
        searchTerms: ["ghostwriter", "language", "tone", "formality"],
      },
      {
        id: "prompt-templates",
        searchTerms: ["prompt", "templates", "system prompt", "instructions"],
      },
    ],
  },
  {
    id: "scoring",
    items: [
      {
        id: "scoring",
        searchTerms: ["threshold", "salary", "keywords", "instructions"],
      },
    ],
  },
  {
    id: "integrations",
    items: [
      {
        id: "reactive-resume",
        searchTerms: ["rxresume", "resume", "projects", "template"],
      },
      {
        id: "webhooks",
        searchTerms: ["hooks", "notifications", "pipeline", "applied"],
      },
      {
        id: "tracer-links",
        searchTerms: ["public url", "verify", "readiness", "health"],
      },
    ],
  },
  {
    id: "workspaces",
    items: [
      {
        id: "environment",
        searchTerms: [
          "security",
          "auth",
          "adzuna",
          "ukvisajobs",
          "sso",
          "single sign-on",
          "oidc",
          "google",
          "github",
          "connected accounts",
          "password",
        ],
      },
    ],
  },
  {
    id: "display",
    items: [
      {
        id: "display",
        searchTerms: ["markdown", "sponsor", "rendering", "appearance"],
      },
    ],
  },
  {
    id: "backups",
    items: [
      {
        id: "backup",
        searchTerms: ["recovery", "database", "restore", "schedule"],
      },
    ],
  },
  {
    id: "danger",
    items: [
      {
        id: "danger-zone",
        searchTerms: ["delete", "clear", "cleanup", "destructive"],
      },
    ],
  },
];

function buildSettingsNavGroups(t: TFunction<"settings">): SettingsNavGroup[] {
  return SETTINGS_NAV_GROUP_DEFINITIONS.map((group) => ({
    ...group,
    label: t(`nav.groups.${group.id}`),
    items: group.items.map((item) => ({
      ...item,
      label: t(`nav.sections.${item.id}.label`),
      description: t(`nav.sections.${item.id}.description`),
    })),
  }));
}

const SECTION_FIELD_MAP: Record<
  SettingsSectionId,
  Array<keyof UpdateSettingsInput>
> = {
  billing: [],
  model: [
    "llmProvider",
    "llmBaseUrl",
    "llmApiKey",
    "llmPurposeOverrides",
    "llmPurposeApiKeys",
    "model",
    "modelScorer",
    "modelTailoring",
    "modelProjectSelection",
  ],
  chat: [
    "chatStyleTone",
    "chatStyleFormality",
    "chatStyleConstraints",
    "chatStyleDoNotUse",
    "ghostwriterStopSlopEnabled",
    "chatStyleLanguageMode",
    "chatStyleManualLanguage",
  ],
  "prompt-templates": [
    "ghostwriterSystemPromptTemplate",
    "tailoringPromptTemplate",
    "scoringPromptTemplate",
  ],
  scoring: [
    "penalizeMissingSalary",
    "missingSalaryPenalty",
    "autoSkipScoreThreshold",
    "blockedCompanyKeywords",
  ],
  "reactive-resume": [
    "pdfRenderer",
    "rxresumeBaseResumeId",
    "rxresumeApiKey",
    "rxresumeUrl",
    "resumeProjects",
  ],
  webhooks: ["pipelineWebhookUrl", "jobCompleteWebhookUrl", "webhookSecret"],
  "tracer-links": [],
  environment: [
    "ukvisajobsEmail",
    "ukvisajobsPassword",
    "adzunaAppId",
    "adzunaAppKey",
  ],
  display: [
    "showSponsorInfo",
    "renderMarkdownInJobDescriptions",
    "autoTailorOnManualImport",
    "applicationStageStyle",
  ],
  backup: ["backupEnabled", "backupHour", "backupMaxCount"],
  "danger-zone": [],
};

function matchesSettingsSearch(
  searchTerm: string,
  item: SettingsSectionDescriptor,
): boolean {
  return sectionWorkspaceItemMatchesSearch(searchTerm, item);
}

const getRxResumeValidationFields = (): Array<keyof UpdateSettingsInput> => [
  "rxresumeApiKey",
  "rxresumeUrl",
];
const toRxResumeValidationBadgeState = (
  validation: ValidationResult,
): RxResumeValidationBadgeState => ({
  checked: true,
  valid: validation.valid,
  message: validation.valid ? null : (validation.message ?? null),
  status: validation.valid ? null : (validation.status ?? null),
});
const isRxResumeMissingConfigValidationFailure = (
  validation: ValidationResult,
): boolean =>
  !validation.valid &&
  validation.status === 400 &&
  /not configured/i.test(validation.message ?? "");

const normalizeLlmProviderValue = (
  value: string | null | undefined,
): LlmProviderValue => (value ? normalizeLlmProvider(value) : null);

const LEGACY_MODEL_KEYS = {
  scoring: "modelScorer",
  tailoring: "modelTailoring",
  projectSelection: "modelProjectSelection",
} as const;

const mapPurposeOverridesToForm = (data: AppSettings) => {
  const overrides = { ...(data.llmPurposeOverrides.override ?? {}) };
  for (const [purpose, modelKey] of Object.entries(LEGACY_MODEL_KEYS)) {
    const typedPurpose = purpose as keyof typeof LEGACY_MODEL_KEYS;
    const legacyModel = data[modelKey].override;
    if (legacyModel && !overrides[typedPurpose]?.model) {
      overrides[typedPurpose] = {
        ...overrides[typedPurpose],
        model: legacyModel,
      };
    }
  }
  return overrides;
};

const NULL_SETTINGS_PAYLOAD: UpdateSettingsInput = {
  model: null,
  modelScorer: null,
  modelTailoring: null,
  modelProjectSelection: null,
  llmProvider: null,
  llmBaseUrl: null,
  llmApiKey: null,
  llmPurposeOverrides: null,
  llmPurposeApiKeys: null,
  pipelineWebhookUrl: null,
  jobCompleteWebhookUrl: null,
  resumeProjects: null,
  pdfRenderer: null,
  typstTheme: null,
  pdfPaperSize: null,
  rxresumeBaseResumeId: null,
  showSponsorInfo: null,
  renderMarkdownInJobDescriptions: null,
  autoTailorOnManualImport: null,
  applicationStageStyle: null,
  chatStyleTone: null,
  chatStyleFormality: null,
  chatStyleConstraints: null,
  chatStyleDoNotUse: null,
  ghostwriterStopSlopEnabled: null,
  chatStyleSummaryMaxWords: null,
  chatStyleMaxKeywordsPerSkill: null,
  chatStyleLanguageMode: null,
  chatStyleManualLanguage: null,
  rxresumeUrl: null,
  rxresumeApiKey: null,
  ukvisajobsEmail: null,
  ukvisajobsPassword: null,
  adzunaAppId: null,
  adzunaAppKey: null,
  adzunaMaxJobsPerTerm: null,
  webhookSecret: null,
  backupEnabled: null,
  backupHour: null,
  backupMaxCount: null,
  penalizeMissingSalary: null,
  missingSalaryPenalty: null,
  autoSkipScoreThreshold: null,
  blockedCompanyKeywords: null,
  ghostwriterSystemPromptTemplate: null,
  tailoringPromptTemplate: null,
  scoringPromptTemplate: null,
};

function getResetSettingsPayload(
  canEditLlmSettings: boolean,
): Partial<UpdateSettingsInput> {
  if (canEditLlmSettings) return NULL_SETTINGS_PAYLOAD;
  const payload: Partial<UpdateSettingsInput> = { ...NULL_SETTINGS_PAYLOAD };
  delete payload.model;
  delete payload.modelScorer;
  delete payload.modelTailoring;
  delete payload.modelProjectSelection;
  delete payload.llmProvider;
  delete payload.llmBaseUrl;
  delete payload.llmApiKey;
  delete payload.llmPurposeOverrides;
  delete payload.llmPurposeApiKeys;
  return payload;
}

const mapSettingsToForm = (data: AppSettings): UpdateSettingsInput => ({
  model: data.model.override ?? "",
  modelScorer: data.modelScorer.override ?? "",
  modelTailoring: data.modelTailoring.override ?? "",
  modelProjectSelection: data.modelProjectSelection.override ?? "",
  llmProvider: normalizeLlmProviderValue(
    data.llmProvider.override ?? data.llmProvider.value,
  ),
  llmBaseUrl: data.llmBaseUrl.override ?? "",
  llmApiKey: "",
  llmPurposeOverrides: mapPurposeOverridesToForm(data),
  llmPurposeApiKeys: {},
  pipelineWebhookUrl: data.pipelineWebhookUrl.override ?? "",
  jobCompleteWebhookUrl: data.jobCompleteWebhookUrl.override ?? "",
  resumeProjects: data.resumeProjects.override,
  pdfRenderer: data.pdfRenderer.override ?? data.pdfRenderer.value,
  typstTheme: data.typstTheme.override ?? data.typstTheme.value,
  pdfPaperSize: data.pdfPaperSize.override ?? data.pdfPaperSize.value,
  rxresumeBaseResumeId: data.rxresumeBaseResumeId,
  showSponsorInfo: data.showSponsorInfo.override,
  renderMarkdownInJobDescriptions:
    data.renderMarkdownInJobDescriptions.override,
  autoTailorOnManualImport: data.autoTailorOnManualImport.override,
  applicationStageStyle:
    data.applicationStageStyle.override ?? data.applicationStageStyle.value,
  chatStyleTone: data.chatStyleTone.override ?? "",
  chatStyleFormality: data.chatStyleFormality.override ?? "",
  chatStyleConstraints: data.chatStyleConstraints.override ?? "",
  chatStyleDoNotUse: data.chatStyleDoNotUse.override ?? "",
  ghostwriterStopSlopEnabled: data.ghostwriterStopSlopEnabled.override,
  chatStyleSummaryMaxWords: data.chatStyleSummaryMaxWords.override ?? null,
  chatStyleMaxKeywordsPerSkill:
    data.chatStyleMaxKeywordsPerSkill.override ?? null,
  chatStyleLanguageMode: data.chatStyleLanguageMode.override ?? null,
  chatStyleManualLanguage: data.chatStyleManualLanguage.override ?? null,
  rxresumeUrl: data.rxresumeUrl ?? "",
  rxresumeApiKey: "",
  ukvisajobsEmail: data.ukvisajobsEmail ?? "",
  ukvisajobsPassword: "",
  adzunaAppId: data.adzunaAppId ?? "",
  adzunaAppKey: "",
  webhookSecret: "",
  backupEnabled: data.backupEnabled.override,
  backupHour: data.backupHour.override,
  backupMaxCount: data.backupMaxCount.override,
  penalizeMissingSalary: data.penalizeMissingSalary.override,
  missingSalaryPenalty: data.missingSalaryPenalty.override,
  autoSkipScoreThreshold: data.autoSkipScoreThreshold.override,
  blockedCompanyKeywords: data.blockedCompanyKeywords.override ?? [],
  ghostwriterSystemPromptTemplate:
    data.ghostwriterSystemPromptTemplate.value ?? "",
  tailoringPromptTemplate: data.tailoringPromptTemplate.value ?? "",
  scoringPromptTemplate: data.scoringPromptTemplate.value ?? "",
});

const normalizeString = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizePrivateInput = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (trimmed === "") return null;
  return trimmed || undefined;
};

const normalizePurposeOverrides = (
  value: UpdateSettingsInput["llmPurposeOverrides"],
  options: { dropInheritedProviderOverrides?: boolean } = {},
) => {
  if (!value) return null;
  const out: NonNullable<UpdateSettingsInput["llmPurposeOverrides"]> = {};
  for (const purpose of Object.keys(LEGACY_MODEL_KEYS) as Array<
    keyof typeof LEGACY_MODEL_KEYS
  >) {
    const override = value[purpose];
    if (!override) continue;
    const provider = normalizeLlmProviderValue(override.provider ?? null);
    const baseUrl = normalizeString(override.baseUrl ?? null);
    const model = normalizeString(override.model ?? null);
    if (options.dropInheritedProviderOverrides && !provider) {
      continue;
    }
    if (provider || baseUrl || model) {
      out[purpose] = {
        ...(provider ? { provider } : {}),
        ...(baseUrl ? { baseUrl } : {}),
        ...(model ? { model } : {}),
      };
    }
  }
  return Object.keys(out).length > 0 ? out : null;
};

const normalizePurposeApiKeys = (
  value: UpdateSettingsInput["llmPurposeApiKeys"],
) => {
  if (!value) return null;
  const out: NonNullable<UpdateSettingsInput["llmPurposeApiKeys"]> = {};
  for (const purpose of Object.keys(LEGACY_MODEL_KEYS) as Array<
    keyof typeof LEGACY_MODEL_KEYS
  >) {
    if (!Object.hasOwn(value, purpose)) continue;
    const normalized = normalizePrivateInput(value[purpose] ?? null);
    if (typeof normalized === "string") {
      out[purpose] = normalized;
    }
  }
  return out;
};

const stringArraysEqual = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

const nullIfSame = <T,>(value: T | null | undefined, defaultValue: T) =>
  value === defaultValue ? null : (value ?? null);

const normalizeResumeProjectsForCatalog = (
  catalog: ResumeProjectCatalogItem[],
  current: ResumeProjectsSettings | null,
): ResumeProjectsSettings | null => {
  const allowed = new Set(catalog.map((project) => project.id));

  const base = current ?? {
    maxProjects: 0,
    lockedProjectIds: catalog
      .filter((project) => project.isVisibleInBase)
      .map((project) => project.id),
    aiSelectableProjectIds: [],
  };

  const lockedProjectIds = base.lockedProjectIds.filter((id) =>
    allowed.has(id),
  );
  const lockedSet = new Set(lockedProjectIds);
  const aiSelectableProjectIds = (
    current ? base.aiSelectableProjectIds : catalog.map((project) => project.id)
  )
    .filter((id) => allowed.has(id))
    .filter((id) => !lockedSet.has(id));
  const maxProjectsRaw = Number.isFinite(base.maxProjects)
    ? base.maxProjects
    : 0;
  const maxProjectsInt = Math.max(0, Math.floor(maxProjectsRaw));
  const maxProjects = Math.min(
    catalog.length,
    Math.max(lockedProjectIds.length, maxProjectsInt, 3),
  );
  return { maxProjects, lockedProjectIds, aiSelectableProjectIds };
};

const getDerivedSettings = (settings: AppSettings | null) => {
  const profileProjects = settings?.profileProjects ?? [];

  return {
    model: {
      effective: settings?.model?.value ?? "",
      default: settings?.model?.default ?? "",
      scorer: settings?.modelScorer?.value ?? "",
      tailoring: settings?.modelTailoring?.value ?? "",
      projectSelection: settings?.modelProjectSelection?.value ?? "",
      llmProvider: settings?.llmProvider?.value ?? "",
      llmBaseUrl: settings?.llmBaseUrl?.value ?? "",
      llmApiKeyHint: settings?.llmApiKeyHint ?? null,
      llmPurposeOverrides: settings?.llmPurposeOverrides?.value ?? {},
      llmPurposeApiKeyHints: settings?.llmPurposeApiKeyHints ?? {},
    },
    pipelineWebhook: {
      effective: settings?.pipelineWebhookUrl?.value ?? "",
      default: settings?.pipelineWebhookUrl?.default ?? "",
    },
    jobCompleteWebhook: {
      effective: settings?.jobCompleteWebhookUrl?.value ?? "",
      default: settings?.jobCompleteWebhookUrl?.default ?? "",
    },
    reactiveResume: {
      pdfRenderer: {
        effective: settings?.pdfRenderer?.value ?? "rxresume",
        default: settings?.pdfRenderer?.default ?? "rxresume",
      },
      typstTheme: {
        effective: settings?.typstTheme?.value ?? "classic",
        default: settings?.typstTheme?.default ?? "classic",
      },
      pdfPaperSize: {
        effective: settings?.pdfPaperSize?.value ?? "auto",
        default: settings?.pdfPaperSize?.default ?? "auto",
      },
    },
    display: {
      showSponsorInfo: {
        effective: settings?.showSponsorInfo?.value ?? true,
        default: settings?.showSponsorInfo?.default ?? true,
      },
      renderMarkdownInJobDescriptions: {
        effective: settings?.renderMarkdownInJobDescriptions?.value ?? true,
        default: settings?.renderMarkdownInJobDescriptions?.default ?? true,
      },
      autoTailorOnManualImport: {
        effective: settings?.autoTailorOnManualImport?.value ?? true,
        default: settings?.autoTailorOnManualImport?.default ?? true,
      },
      applicationStageStyle: {
        effective: settings?.applicationStageStyle?.value ?? "standard",
        default: settings?.applicationStageStyle?.default ?? "standard",
      },
    },
    chat: {
      tone: {
        effective: settings?.chatStyleTone?.value ?? "professional",
        default: settings?.chatStyleTone?.default ?? "professional",
      },
      formality: {
        effective: settings?.chatStyleFormality?.value ?? "medium",
        default: settings?.chatStyleFormality?.default ?? "medium",
      },
      constraints: {
        effective: settings?.chatStyleConstraints?.value ?? "",
        default: settings?.chatStyleConstraints?.default ?? "",
      },
      doNotUse: {
        effective: settings?.chatStyleDoNotUse?.value ?? "",
        default: settings?.chatStyleDoNotUse?.default ?? "",
      },
      stopSlopEnabled: {
        effective: settings?.ghostwriterStopSlopEnabled?.value ?? false,
        default: settings?.ghostwriterStopSlopEnabled?.default ?? false,
      },
      languageMode: {
        effective: settings?.chatStyleLanguageMode?.value ?? "manual",
        default: settings?.chatStyleLanguageMode?.default ?? "manual",
      },
      manualLanguage: {
        effective: settings?.chatStyleManualLanguage?.value ?? "english",
        default: settings?.chatStyleManualLanguage?.default ?? "english",
      },
      summaryMaxWords: {
        effective: settings?.chatStyleSummaryMaxWords?.value ?? null,
        default: settings?.chatStyleSummaryMaxWords?.default ?? null,
      },
      maxKeywordsPerSkill: {
        effective: settings?.chatStyleMaxKeywordsPerSkill?.value ?? null,
        default: settings?.chatStyleMaxKeywordsPerSkill?.default ?? null,
      },
    },
    envSettings: {
      readable: {
        ukvisajobsEmail: settings?.ukvisajobsEmail ?? "",
        adzunaAppId: settings?.adzunaAppId ?? "",
      },
      private: {
        ukvisajobsPasswordHint: settings?.ukvisajobsPasswordHint ?? null,
        adzunaAppKeyHint: settings?.adzunaAppKeyHint ?? null,
        webhookSecretHint: settings?.webhookSecretHint ?? null,
      },
    },
    defaultResumeProjects: settings?.resumeProjects?.default ?? null,

    profileProjects,
    maxProjectsTotal: profileProjects.length,

    backup: {
      backupEnabled: {
        effective: settings?.backupEnabled?.value ?? false,
        default: settings?.backupEnabled?.default ?? false,
      },
      backupHour: {
        effective: settings?.backupHour?.value ?? 2,
        default: settings?.backupHour?.default ?? 2,
      },
      backupMaxCount: {
        effective: settings?.backupMaxCount?.value ?? 5,
        default: settings?.backupMaxCount?.default ?? 5,
      },
    },
    scoring: {
      penalizeMissingSalary: {
        effective: settings?.penalizeMissingSalary?.value ?? false,
        default: settings?.penalizeMissingSalary?.default ?? false,
      },
      missingSalaryPenalty: {
        effective: settings?.missingSalaryPenalty?.value ?? 10,
        default: settings?.missingSalaryPenalty?.default ?? 10,
      },
      autoSkipScoreThreshold: {
        effective: settings?.autoSkipScoreThreshold?.value ?? null,
        default: settings?.autoSkipScoreThreshold?.default ?? null,
      },
      blockedCompanyKeywords: {
        effective: settings?.blockedCompanyKeywords?.value ?? [],
        default: settings?.blockedCompanyKeywords?.default ?? [],
      },
    },
    promptTemplates: {
      ghostwriterSystemPromptTemplate: {
        effective: settings?.ghostwriterSystemPromptTemplate?.value ?? "",
        default: settings?.ghostwriterSystemPromptTemplate?.default ?? "",
      },
      tailoringPromptTemplate: {
        effective: settings?.tailoringPromptTemplate?.value ?? "",
        default: settings?.tailoringPromptTemplate?.default ?? "",
      },
      scoringPromptTemplate: {
        effective: settings?.scoringPromptTemplate?.value ?? "",
        default: settings?.scoringPromptTemplate?.default ?? "",
      },
    },
  };
};

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation("settings");
  const settingsNavGroups = useMemo(() => buildSettingsNavGroups(t), [t]);
  const queryClient = useQueryClient();
  const location = useLocation();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeSection, setActiveSection] =
    useState<SettingsSectionId>("model");
  const [openGroups, setOpenGroups] = useState<SettingsGroupId[]>([]);

  const [settingsSearch, setSettingsSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isBillingBusy, setIsBillingBusy] = useState(false);
  const [rxresumeValidationStatus, setRxresumeValidationStatus] =
    useState<RxResumeValidationBadgeState>(
      EMPTY_RXRESUME_VALIDATION_BADGE_STATE,
    );
  const rxresumeSilentValidationAttemptedRef = useRef(false);
  const [statusesToClear, setStatusesToClear] = useState<JobStatus[]>([
    "discovered",
  ]);
  const [rxResumeBaseResumeIdDraft, setRxResumeBaseResumeIdDraft] = useState<
    string | null
  >(null);
  const [rxResumeProjectsOverride, setRxResumeProjectsOverride] = useState<
    ResumeProjectCatalogItem[] | null
  >(null);
  const [isFetchingRxResumeProjects, setIsFetchingRxResumeProjects] =
    useState(false);

  // Backup state
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isDeletingBackup, setIsDeletingBackup] = useState(false);
  const {
    readiness: tracerReadiness,
    isLoading: isTracerReadinessLoading,
    isChecking: isTracerReadinessChecking,
    refreshReadiness,
  } = useTracerReadiness();

  const methods = useForm<UpdateSettingsInput>({
    resolver: zodResolver(
      updateSettingsSchema,
    ) as Resolver<UpdateSettingsInput>,
    mode: "onChange",
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const {
    clearErrors,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    control,
    formState: { isDirty, errors, isValid, dirtyFields },
  } = methods;
  const { storedRxResume, setBaseResumeId } = useRxResumeConfigState(settings);

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.current(),
    queryFn: api.getSettings,
  });
  const appStatusQuery = useQuery({
    queryKey: queryKeys.app.status(),
    queryFn: api.getAppStatus,
  });
  const isHostedMode = appStatusQuery.data?.appMode === "hosted";
  const billingQuery = useQuery({
    queryKey: queryKeys.billing.status(),
    queryFn: api.getBillingStatus,
    enabled: isHostedMode,
  });
  const currentUserQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.getCurrentAuthUser,
    retry: false,
  });
  const backupsQuery = useQuery({
    queryKey: queryKeys.backups.list(),
    queryFn: api.getBackups,
    enabled: currentUserQuery.data?.isSystemAdmin === true,
  });
  const updateSettingsMutation = useUpdateSettingsMutation();
  const isLoading = settingsQuery.isLoading;
  const backups = backupsQuery.data?.backups ?? [];
  const nextScheduled = backupsQuery.data?.nextScheduled ?? null;
  const isLoadingBackups = backupsQuery.isLoading;
  // Fork: in self-hosted mode only system admins manage the server-wide AI
  // provider and key; regular users use the admin's configuration. When the
  // provider and key come from environment variables, nobody picks a model
  // here (admins change it in the env), so the section is hidden for all.
  const canEditLlmSettings = isHostedMode
    ? (billingQuery.data?.userEditableLlmSettings ?? false)
    : (appStatusQuery.data?.capabilities.userEditableLlmSettings ?? true) &&
      currentUserQuery.data?.isSystemAdmin !== false &&
      appStatusQuery.data?.capabilities.llmPreconfigured !== true;
  useQueryErrorToast(appStatusQuery.error, t("toasts.loadAppStatusFailed"));
  useQueryErrorToast(backupsQuery.error, t("toasts.loadBackupsFailed"));
  useQueryErrorToast(billingQuery.error, t("toasts.loadBillingFailed"));

  const openStripe = async (createSession: () => Promise<{ url: string }>) => {
    setIsBillingBusy(true);
    try {
      const { url } = await createSession();
      window.location.assign(url);
    } catch (error) {
      showErrorToast(error, t("toasts.openStripeFailed"));
      setIsBillingBusy(false);
    }
  };

  const resumeProjectsValue = useWatch({
    control,
    name: "resumeProjects",
  });
  const hasRxResumeAccess = Boolean(
    storedRxResume.hasV5 || rxresumeValidationStatus.valid,
  );

  useEffect(() => {
    if (!settingsQuery.data) return;
    setSettings(settingsQuery.data);
    reset(mapSettingsToForm(settingsQuery.data));
  }, [settingsQuery.data, reset]);

  useQueryErrorToast(settingsQuery.error, t("toasts.loadSettingsFailed"));

  useEffect(() => {
    if (!settings) return;
    const storedId = settings?.rxresumeBaseResumeId ?? null;
    setRxResumeBaseResumeIdDraft(storedId);
    setValue("rxresumeBaseResumeId", storedId, { shouldDirty: false });
    setRxResumeProjectsOverride(null);
  }, [settings, setValue]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (!rxResumeBaseResumeIdDraft) {
      setRxResumeProjectsOverride(null);
      return () => {
        isMounted = false;
        controller.abort();
      };
    }

    if (!hasRxResumeAccess)
      return () => {
        isMounted = false;
        controller.abort();
      };

    setIsFetchingRxResumeProjects(true);
    api
      .getRxResumeProjects(rxResumeBaseResumeIdDraft, controller.signal)
      .then((projects) => {
        if (!isMounted) return;
        setRxResumeProjectsOverride(projects);
        const normalized = normalizeResumeProjectsForCatalog(
          projects,
          getValues("resumeProjects") ?? null,
        );
        if (normalized) {
          setValue("resumeProjects", normalized, { shouldDirty: false });
        }
      })
      .catch((error) => {
        if (!isMounted || error.name === "AbortError") return;
        showErrorToast(error, t("toasts.loadRxResumeProjectsFailed"));
        setRxResumeProjectsOverride(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsFetchingRxResumeProjects(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [rxResumeBaseResumeIdDraft, hasRxResumeAccess, getValues, setValue, t]);

  const derived = getDerivedSettings(settings);
  const {
    model,
    pipelineWebhook,
    jobCompleteWebhook,
    reactiveResume,
    display,
    chat,
    envSettings,
    defaultResumeProjects,
    profileProjects,
    backup,
    scoring,
    promptTemplates,
  } = derived;

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await api.createManualBackup();
      toast.success(t("toasts.backupCreated"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.backups.all });
    } catch (error) {
      showErrorToast(error, t("toasts.backupCreateFailed"));
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    const confirmed = window.confirm(
      t("toasts.confirmDeleteBackup", { filename }),
    );
    if (!confirmed) {
      return;
    }
    setIsDeletingBackup(true);
    try {
      await api.deleteBackup(filename);
      toast.success(t("toasts.backupDeleted"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.backups.all });
    } catch (error) {
      showErrorToast(error, t("toasts.backupDeleteFailed"));
    } finally {
      setIsDeletingBackup(false);
    }
  };

  const handleVerifyTracerReadiness = useCallback(async () => {
    try {
      const readiness = await refreshReadiness(true);
      if (!readiness) {
        toast.error(t("toasts.tracerUnavailable"));
      } else if (readiness.canEnable) {
        toast.success(t("toasts.tracerReady"));
      } else {
        toast.error(readiness.reason ?? t("toasts.tracerUnavailable"));
      }
    } catch (error) {
      showErrorToast(error, t("toasts.tracerVerifyFailed"));
    }
  }, [refreshReadiness, t]);

  const setRxResumeValidationStatus = useCallback(
    (validation: ValidationResult) => {
      setRxresumeValidationStatus(toRxResumeValidationBadgeState(validation));
    },
    [],
  );

  const clearRxResumeValidationFeedback = useCallback(() => {
    rxresumeSilentValidationAttemptedRef.current = false;
    setRxresumeValidationStatus(EMPTY_RXRESUME_VALIDATION_BADGE_STATE);
    clearErrors(["rxresumeApiKey"]);
  }, [clearErrors]);

  const validateRxresume = useCallback(
    async (options?: { silent?: boolean; persistOnSuccess?: boolean }) => {
      const { silent = false, persistOnSuccess = true } = options ?? {};
      if (silent) {
        rxresumeSilentValidationAttemptedRef.current = true;
      }
      const notify = !silent;
      const values = getValues();
      const draftCredentials = getRxResumeCredentialDrafts(values);
      const result = await validateAndMaybePersistRxResumeMode({
        stored: storedRxResume,
        draft: draftCredentials,
        validate: api.validateRxresume,
        persist: api.updateSettings,
        persistOnSuccess,
        skipPrecheck: silent,
        getPrecheckMessage: (failure) => RXRESUME_PRECHECK_MESSAGES[failure],
        getValidationErrorMessage: (error) =>
          formatUserFacingError(error, t("rxresume.validationFailed")),
        getPersistErrorMessage: (error) =>
          formatUserFacingError(error, t("rxresume.validationFailed")),
      });

      if (
        silent &&
        isRxResumeMissingConfigValidationFailure(result.validation)
      ) {
        setRxresumeValidationStatus(EMPTY_RXRESUME_VALIDATION_BADGE_STATE);
      } else {
        setRxResumeValidationStatus(result.validation);
      }

      if (result.updatedSettings) {
        setSettings(result.updatedSettings);
        queryClient.setQueryData(
          queryKeys.settings.current(),
          result.updatedSettings,
        );
        if (notify) {
          toast.success(t("toasts.rxresumeValidationPassed"));
        }
        return;
      }

      if (!notify || result.validation.valid) {
        return;
      }

      if (result.precheckFailure) {
        toast.info(
          result.validation.message ??
            RXRESUME_PRECHECK_MESSAGES[result.precheckFailure],
        );
        return;
      }

      toast.error(
        result.validation.message || t("toasts.rxresumeValidationFailed"),
      );
    },
    [getValues, queryClient, setRxResumeValidationStatus, storedRxResume, t],
  );

  useEffect(() => {
    if (!settings) return;

    if (
      !rxresumeValidationStatus.checked &&
      !rxresumeSilentValidationAttemptedRef.current
    ) {
      void validateRxresume({ silent: true, persistOnSuccess: false });
    }
  }, [rxresumeValidationStatus, settings, validateRxresume]);

  const effectiveProfileProjects = rxResumeProjectsOverride ?? profileProjects;
  const effectiveMaxProjectsTotal = effectiveProfileProjects.length;

  const lockedCount = resumeProjectsValue?.lockedProjectIds.length ?? 0;

  const canSave = isDirty && isValid;

  const onSave = async (data: UpdateSettingsInput) => {
    if (!settings) return;
    try {
      setIsSaving(true);

      // Prepare payload: nullify if equal to default
      const resumeProjectsData = data.resumeProjects;
      const resumeProjectsOverride =
        resumeProjectsData &&
        defaultResumeProjects &&
        resumeProjectsEqual(resumeProjectsData, defaultResumeProjects)
          ? null
          : resumeProjectsData;

      const envPayload: Partial<UpdateSettingsInput> = {};

      if (dirtyFields.rxresumeUrl) {
        envPayload.rxresumeUrl = normalizeString(data.rxresumeUrl);
      }

      if (dirtyFields.ukvisajobsEmail || dirtyFields.ukvisajobsPassword) {
        envPayload.ukvisajobsEmail = normalizeString(data.ukvisajobsEmail);
      }

      if (dirtyFields.adzunaAppId || dirtyFields.adzunaAppKey) {
        envPayload.adzunaAppId = normalizeString(data.adzunaAppId);
      }

      if (canEditLlmSettings && dirtyFields.llmProvider) {
        envPayload.llmProvider = data.llmProvider ?? null;
      }

      if (canEditLlmSettings && dirtyFields.llmBaseUrl) {
        envPayload.llmBaseUrl = normalizeString(data.llmBaseUrl);
      }

      if (canEditLlmSettings && dirtyFields.llmApiKey) {
        const value = normalizePrivateInput(data.llmApiKey);
        if (value !== undefined) envPayload.llmApiKey = value;
      }

      if (dirtyFields.rxresumeApiKey) {
        const value = normalizePrivateInput(data.rxresumeApiKey);
        if (value !== undefined) envPayload.rxresumeApiKey = value;
      }

      if (dirtyFields.ukvisajobsPassword) {
        const value = normalizePrivateInput(data.ukvisajobsPassword);
        if (value !== undefined) envPayload.ukvisajobsPassword = value;
      }

      if (dirtyFields.adzunaAppKey) {
        const value = normalizePrivateInput(data.adzunaAppKey);
        if (value !== undefined) envPayload.adzunaAppKey = value;
      }

      if (dirtyFields.webhookSecret) {
        const value = normalizePrivateInput(data.webhookSecret);
        if (value !== undefined) envPayload.webhookSecret = value;
      }

      const llmPayload: Partial<UpdateSettingsInput> = canEditLlmSettings
        ? {
            model: dirtyFields.llmProvider
              ? dirtyFields.model
                ? normalizeString(data.model)
                : null
              : normalizeString(data.model),
            ...(dirtyFields.llmProvider
              ? {
                  modelScorer: null,
                  modelTailoring: null,
                  modelProjectSelection: null,
                  llmPurposeOverrides: normalizePurposeOverrides(
                    data.llmPurposeOverrides,
                    { dropInheritedProviderOverrides: true },
                  ),
                }
              : {}),
            ...(dirtyFields.llmPurposeOverrides
              ? {
                  llmPurposeOverrides: normalizePurposeOverrides(
                    data.llmPurposeOverrides,
                  ),
                  modelScorer: null,
                  modelTailoring: null,
                  modelProjectSelection: null,
                }
              : {}),
            ...(dirtyFields.llmPurposeApiKeys
              ? {
                  llmPurposeApiKeys: normalizePurposeApiKeys(
                    data.llmPurposeApiKeys,
                  ),
                }
              : {}),
          }
        : {};

      const payload: Partial<UpdateSettingsInput> = {
        ...llmPayload,
        pipelineWebhookUrl: normalizeString(data.pipelineWebhookUrl),
        jobCompleteWebhookUrl: normalizeString(data.jobCompleteWebhookUrl),
        resumeProjects: resumeProjectsOverride,
        pdfRenderer: nullIfSame(
          data.pdfRenderer,
          reactiveResume.pdfRenderer.default,
        ),
        typstTheme: nullIfSame(
          data.typstTheme,
          reactiveResume.typstTheme.default,
        ),
        pdfPaperSize: nullIfSame(
          data.pdfPaperSize,
          reactiveResume.pdfPaperSize.default,
        ),
        ...(dirtyFields.rxresumeBaseResumeId
          ? { rxresumeBaseResumeId: normalizeString(data.rxresumeBaseResumeId) }
          : {}),
        showSponsorInfo: nullIfSame(
          data.showSponsorInfo,
          display.showSponsorInfo.default,
        ),
        renderMarkdownInJobDescriptions: nullIfSame(
          data.renderMarkdownInJobDescriptions,
          display.renderMarkdownInJobDescriptions.default,
        ),
        autoTailorOnManualImport: nullIfSame(
          data.autoTailorOnManualImport,
          display.autoTailorOnManualImport.default,
        ),
        applicationStageStyle: nullIfSame(
          data.applicationStageStyle,
          display.applicationStageStyle.default,
        ),
        chatStyleTone: normalizeString(data.chatStyleTone),
        chatStyleFormality: normalizeString(data.chatStyleFormality),
        chatStyleConstraints: normalizeString(data.chatStyleConstraints),
        chatStyleDoNotUse: normalizeString(data.chatStyleDoNotUse),
        ghostwriterStopSlopEnabled: nullIfSame(
          data.ghostwriterStopSlopEnabled,
          chat.stopSlopEnabled.default,
        ),
        chatStyleSummaryMaxWords: Number.isNaN(data.chatStyleSummaryMaxWords)
          ? null
          : (data.chatStyleSummaryMaxWords ?? null),
        chatStyleMaxKeywordsPerSkill: Number.isNaN(
          data.chatStyleMaxKeywordsPerSkill,
        )
          ? null
          : (data.chatStyleMaxKeywordsPerSkill ?? null),
        chatStyleLanguageMode: data.chatStyleLanguageMode ?? null,
        chatStyleManualLanguage: data.chatStyleManualLanguage ?? null,
        backupEnabled: nullIfSame(
          data.backupEnabled,
          backup.backupEnabled.default,
        ),
        backupHour: nullIfSame(data.backupHour, backup.backupHour.default),
        backupMaxCount: nullIfSame(
          data.backupMaxCount,
          backup.backupMaxCount.default,
        ),
        penalizeMissingSalary: nullIfSame(
          data.penalizeMissingSalary,
          scoring.penalizeMissingSalary.default,
        ),
        missingSalaryPenalty: nullIfSame(
          data.missingSalaryPenalty,
          scoring.missingSalaryPenalty.default,
        ),
        autoSkipScoreThreshold: nullIfSame(
          data.autoSkipScoreThreshold,
          scoring.autoSkipScoreThreshold.default,
        ),
        blockedCompanyKeywords: (() => {
          const normalized = normalizeStringArray(data.blockedCompanyKeywords);
          const normalizedDefault = normalizeStringArray(
            scoring.blockedCompanyKeywords.default,
          );
          return stringArraysEqual(normalized, normalizedDefault)
            ? null
            : normalized;
        })(),
        ghostwriterSystemPromptTemplate: nullIfSame(
          normalizeString(data.ghostwriterSystemPromptTemplate),
          promptTemplates.ghostwriterSystemPromptTemplate.default,
        ),
        tailoringPromptTemplate: nullIfSame(
          normalizeString(data.tailoringPromptTemplate),
          promptTemplates.tailoringPromptTemplate.default,
        ),
        scoringPromptTemplate: nullIfSame(
          normalizeString(data.scoringPromptTemplate),
          promptTemplates.scoringPromptTemplate.default,
        ),
        ...envPayload,
      };

      const shouldValidateRxResumeBeforeSave = Boolean(
        dirtyFields.rxresumeUrl || dirtyFields.rxresumeApiKey,
      );
      let rxResumeSaveWarningMessage: string | null = null;

      if (shouldValidateRxResumeBeforeSave) {
        const validationDraft = getRxResumeCredentialDrafts(data);
        const precheckFailure = getRxResumeCredentialPrecheckFailure({
          stored: storedRxResume,
          draft: validationDraft,
        });

        if (!precheckFailure) {
          const preserveBlankFields = [
            ...(dirtyFields.rxresumeApiKey ? (["apiKey"] as const) : []),
            ...(dirtyFields.rxresumeUrl ? (["baseUrl"] as const) : []),
          ];
          const validation = await api.validateRxresume({
            ...toRxResumeValidationPayload(validationDraft, {
              preserveBlankFields: preserveBlankFields as Array<
                keyof ReturnType<typeof getRxResumeCredentialDrafts>
              >,
            }),
          });

          setRxResumeValidationStatus(validation);

          if (isRxResumeBlockingValidationFailure(validation)) {
            clearErrors(getRxResumeValidationFields());
            setError("rxresumeApiKey", {
              type: "manual",
              message: validation.message ?? t("toasts.rxresumeKeyInvalid"),
            });
            return;
          }

          clearErrors(getRxResumeValidationFields());
          if (isRxResumeAvailabilityValidationFailure(validation)) {
            rxResumeSaveWarningMessage = t("toasts.rxresumeSaveWarning");
          }
        }
      }

      const updated = await updateSettingsMutation.mutateAsync(payload);
      setSettings(updated);
      reset(mapSettingsToForm(updated));
      toast.success(t("toasts.settingsSaved"));
      if (rxResumeSaveWarningMessage) {
        toast.info(rxResumeSaveWarningMessage);
      }
    } catch (error) {
      showErrorToast(error, t("toasts.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDatabase = async () => {
    try {
      setIsSaving(true);
      const result = await api.clearDatabase();
      toast.success(t("toasts.databaseCleared"), {
        description: t("toasts.databaseClearedDescription", {
          number: result.jobsDeleted,
        }),
      });
    } catch (error) {
      showErrorToast(error, t("toasts.clearDatabaseFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearByStatuses = async () => {
    if (statusesToClear.length === 0) {
      toast.error(t("toasts.noStatusesSelected"));
      return;
    }
    try {
      setIsSaving(true);
      let totalDeleted = 0;
      const results: string[] = [];

      for (const status of statusesToClear) {
        const result = await api.deleteJobsByStatus(status);
        totalDeleted += result.count;
        if (result.count > 0) {
          results.push(
            t("toasts.statusCount", {
              number: result.count,
              status: t(`danger.statusNames.${status}`),
            }),
          );
        }
      }

      if (totalDeleted > 0) {
        toast.success(t("toasts.jobsCleared"), {
          description: t("toasts.jobsClearedByStatus", {
            number: totalDeleted,
            details: results.join(t("shared.listSeparator")),
          }),
        });
      } else {
        toast.info(t("toasts.noJobsFound"), {
          description: t("toasts.noJobsWithStatuses"),
        });
      }
    } catch (error) {
      showErrorToast(error, t("toasts.clearJobsFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearByScore = async (threshold: number) => {
    try {
      setIsSaving(true);
      const result = await api.deleteJobsBelowScore(threshold);

      if (result.count > 0) {
        toast.success(t("toasts.jobsCleared"), {
          description: t("toasts.jobsClearedByScore", {
            number: result.count,
            threshold,
          }),
        });
      } else {
        toast.info(t("toasts.noJobsFound"), {
          description: t("toasts.noJobsBelowScore", { threshold }),
        });
      }
    } catch (error) {
      showErrorToast(error, t("toasts.clearJobsByScoreFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatusToClear = (status: JobStatus) => {
    setStatusesToClear((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };
  const handleReset = async () => {
    try {
      setIsSaving(true);
      const updated = await updateSettingsMutation.mutateAsync(
        getResetSettingsPayload(canEditLlmSettings),
      );
      setSettings(updated);
      reset(mapSettingsToForm(updated));
      toast.success(t("toasts.resetDone"));
    } catch (error) {
      showErrorToast(error, t("toasts.resetFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (!settings) return;
    reset(mapSettingsToForm(settings));
    toast.success(t("toasts.discarded"));
  };

  const visibleNavGroups = useMemo(
    () =>
      settingsNavGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              (item.id !== "billing" || isHostedMode) &&
              (canEditLlmSettings || item.id !== "model"),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [canEditLlmSettings, isHostedMode, settingsNavGroups],
  );

  const filteredNavGroups = useMemo(
    () =>
      visibleNavGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            matchesSettingsSearch(settingsSearch, item),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [settingsSearch, visibleNavGroups],
  );

  useEffect(() => {
    const hash = location.hash.replace(/^#/, "");
    const allSectionIds = visibleNavGroups.flatMap((g) =>
      g.items.map((i) => i.id),
    );
    if (hash && allSectionIds.includes(hash as SettingsSectionId)) {
      setActiveSection(hash as SettingsSectionId);
      const parentGroup = visibleNavGroups.find((g) =>
        g.items.some((i) => i.id === hash),
      );
      if (parentGroup) {
        setOpenGroups((prev) =>
          prev.includes(parentGroup.id) ? prev : [...prev, parentGroup.id],
        );
      }
    }
  }, [location.hash, visibleNavGroups]);

  const visibleSectionIds = useMemo(
    () =>
      filteredNavGroups.flatMap((group) => group.items.map((item) => item.id)),
    [filteredNavGroups],
  );

  useEffect(() => {
    if (visibleSectionIds.length === 0) return;
    if (!visibleSectionIds.includes(activeSection)) {
      setActiveSection(visibleSectionIds[0]);
    }
  }, [activeSection, visibleSectionIds]);

  const firstVisibleGroup = visibleNavGroups[0] ?? settingsNavGroups[0];
  const firstVisibleSection = firstVisibleGroup.items[0];
  const activeSectionMeta =
    visibleNavGroups
      .flatMap((group) => group.items)
      .find((item) => item.id === activeSection) ?? firstVisibleSection;
  const activeGroup =
    visibleNavGroups.find((group) =>
      group.items.some((item) => item.id === activeSection),
    ) ?? firstVisibleGroup;

  const sectionHasDirtyState = (sectionId: SettingsSectionId) =>
    SECTION_FIELD_MAP[sectionId].some((field) => Boolean(dirtyFields[field]));
  const sectionHasErrors = (sectionId: SettingsSectionId) =>
    SECTION_FIELD_MAP[sectionId].some((field) => Boolean(errors[field]));

  const getSectionBadge = (
    sectionId: SettingsSectionId,
  ): SectionWorkspaceBadge | null => {
    if (sectionId === "danger-zone") {
      return { label: t("badges.sensitive"), variant: "destructive" as const };
    }
    if (sectionHasErrors(sectionId)) {
      return {
        label: t("badges.needsAttention"),
        variant: "destructive" as const,
      };
    }
    if (sectionHasDirtyState(sectionId)) {
      return { label: t("badges.unsaved"), variant: "secondary" as const };
    }

    switch (sectionId) {
      case "billing":
        return billingQuery.data
          ? {
              label:
                billingQuery.data.plan === "pro"
                  ? t("billing.planPro")
                  : t("billing.planFree"),
              variant:
                billingQuery.data.plan === "pro"
                  ? ("outline" as const)
                  : ("secondary" as const),
            }
          : null;
      case "model":
        return model.llmProvider
          ? { label: t("badges.configured"), variant: "outline" as const }
          : { label: t("badges.usingDefaults"), variant: "secondary" as const };
      case "chat":
        return chat.tone.effective || chat.constraints.effective
          ? { label: t("badges.ready"), variant: "outline" as const }
          : { label: t("badges.usingDefaults"), variant: "secondary" as const };
      case "prompt-templates":
        return promptTemplates.ghostwriterSystemPromptTemplate.effective !==
          promptTemplates.ghostwriterSystemPromptTemplate.default ||
          promptTemplates.tailoringPromptTemplate.effective !==
            promptTemplates.tailoringPromptTemplate.default ||
          promptTemplates.scoringPromptTemplate.effective !==
            promptTemplates.scoringPromptTemplate.default
          ? { label: t("badges.customized"), variant: "outline" as const }
          : { label: t("badges.usingDefaults"), variant: "secondary" as const };
      case "scoring":
        return scoring.autoSkipScoreThreshold.effective != null ||
          scoring.blockedCompanyKeywords.effective.length > 0
          ? { label: t("badges.customized"), variant: "outline" as const }
          : { label: t("badges.defaultRules"), variant: "secondary" as const };
      case "reactive-resume":
        return hasRxResumeAccess
          ? { label: t("badges.connected"), variant: "outline" as const }
          : null;
      case "webhooks":
        return pipelineWebhook.effective || jobCompleteWebhook.effective
          ? { label: t("badges.configured"), variant: "outline" as const }
          : { label: t("badges.optional"), variant: "secondary" as const };
      case "tracer-links":
        return tracerReadiness?.status === "ready"
          ? { label: t("badges.ready"), variant: "outline" as const }
          : tracerReadiness
            ? {
                label: t("badges.checkRequired"),
                variant: "secondary" as const,
              }
            : {
                label: t("badges.notConfigured"),
                variant: "secondary" as const,
              };
      case "environment":
        return envSettings.readable.ukvisajobsEmail ||
          envSettings.readable.adzunaAppId
          ? { label: t("badges.configured"), variant: "outline" as const }
          : null;
      case "display":
        return { label: t("badges.active"), variant: "secondary" as const };
      case "backup":
        return backup.backupEnabled.effective
          ? { label: t("badges.scheduled"), variant: "outline" as const }
          : { label: t("badges.manualOnly"), variant: "secondary" as const };
      default:
        return { label: t("badges.ready"), variant: "outline" as const };
    }
  };

  const selectedSectionBadge = getSectionBadge(activeSection);
  const dirtySectionCount = visibleNavGroups
    .flatMap((group) => group.items)
    .filter((item) => sectionHasDirtyState(item.id)).length;
  const activeSectionIsDirty = sectionHasDirtyState(activeSection);

  let activeSectionContent: React.ReactNode;
  switch (activeSection) {
    case "billing":
      activeSectionContent = (
        <BillingSettingsSection
          status={billingQuery.data}
          isLoading={billingQuery.isLoading}
          isBusy={isBillingBusy}
          onUpgrade={() => void openStripe(api.createBillingCheckout)}
          onManage={() => void openStripe(api.createBillingPortal)}
        />
      );
      break;
    case "model":
      activeSectionContent = (
        <ModelSettingsSection
          values={model}
          isLoading={isLoading}
          isSaving={isSaving}
          layoutMode="panel"
        />
      );
      break;
    case "chat":
      activeSectionContent = (
        <ChatSettingsSection
          values={chat}
          isLoading={isLoading}
          isSaving={isSaving}
          layoutMode="panel"
        />
      );
      break;
    case "prompt-templates":
      activeSectionContent = (
        <PromptTemplatesSection
          values={promptTemplates}
          isLoading={isLoading}
          isSaving={isSaving}
          layoutMode="panel"
        />
      );
      break;
    case "scoring":
      activeSectionContent = (
        <ScoringSettingsSection
          values={scoring}
          isLoading={isLoading}
          isSaving={isSaving}
          layoutMode="panel"
        />
      );
      break;
    case "reactive-resume":
      activeSectionContent = (
        <ReactiveResumeSection
          rxResumeBaseResumeIdDraft={rxResumeBaseResumeIdDraft}
          setRxResumeBaseResumeIdDraft={(value) => {
            setBaseResumeId(value);
            setRxResumeBaseResumeIdDraft(value);
            setValue("rxresumeBaseResumeId", value, { shouldDirty: true });
          }}
          hasRxResumeAccess={hasRxResumeAccess}
          onCredentialFieldEdit={clearRxResumeValidationFeedback}
          validationStatus={rxresumeValidationStatus}
          profileProjects={effectiveProfileProjects}
          lockedCount={lockedCount}
          maxProjectsTotal={effectiveMaxProjectsTotal}
          isProjectsLoading={isFetchingRxResumeProjects}
          isLoading={isLoading}
          isSaving={isSaving}
          layoutMode="panel"
        />
      );
      break;
    case "webhooks":
      activeSectionContent = (
        <WebhooksSection
          pipelineWebhook={pipelineWebhook}
          jobCompleteWebhook={jobCompleteWebhook}
          webhookSecretHint={envSettings.private.webhookSecretHint}
          isLoading={isLoading}
          isSaving={isSaving}
          layoutMode="panel"
        />
      );
      break;
    case "tracer-links":
      activeSectionContent = (
        <TracerLinksSettingsSection
          readiness={tracerReadiness}
          isLoading={isLoading || isTracerReadinessLoading}
          isChecking={isTracerReadinessChecking}
          onVerifyNow={handleVerifyTracerReadiness}
          layoutMode="panel"
        />
      );
      break;
    case "environment":
      activeSectionContent = (
        <EnvironmentSettingsSection
          values={envSettings}
          isLoading={isLoading}
          isSaving={isSaving}
          layoutMode="panel"
        />
      );
      break;
    case "display":
      activeSectionContent = (
        <DisplaySettingsSection
          values={display}
          isLoading={isLoading}
          isSaving={isSaving}
          layoutMode="panel"
        />
      );
      break;
    case "backup":
      activeSectionContent = (
        <BackupSettingsSection
          values={backup}
          backups={backups}
          nextScheduled={nextScheduled}
          isLoading={isLoading || isLoadingBackups}
          isSaving={isSaving}
          onCreateBackup={handleCreateBackup}
          onDeleteBackup={handleDeleteBackup}
          isCreatingBackup={isCreatingBackup}
          isDeletingBackup={isDeletingBackup}
          layoutMode="panel"
        />
      );
      break;
    case "danger-zone":
      activeSectionContent = (
        <DangerZoneSection
          statusesToClear={statusesToClear}
          toggleStatusToClear={toggleStatusToClear}
          handleClearByStatuses={handleClearByStatuses}
          handleClearDatabase={
            currentUserQuery.data?.isSystemAdmin
              ? handleClearDatabase
              : undefined
          }
          handleClearByScore={handleClearByScore}
          isLoading={isLoading}
          isSaving={isSaving}
          layoutMode="panel"
        />
      );
      break;
    default:
      activeSectionContent = null;
  }

  return (
    <FormProvider {...methods}>
      <PageHeader
        icon={Settings}
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />

      <main className="container mx-auto px-4 py-6 pb-12">
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <SectionWorkspaceNav
            groups={filteredNavGroups}
            activeSectionId={activeSection}
            openGroupIds={openGroups}
            onOpenGroupIdsChange={setOpenGroups}
            onSectionSelect={setActiveSection}
            searchValue={settingsSearch}
            onSearchValueChange={setSettingsSearch}
            searchPlaceholder={t("page.searchPlaceholder")}
            searchEmptyLabel={t("page.searchEmpty")}
          />

          <SectionWorkspacePanel
            groupLabel={activeGroup.label}
            sectionLabel={activeSectionMeta.label}
            sectionDescription={activeSectionMeta.description}
            badge={selectedSectionBadge}
            secondaryBadge={
              dirtySectionCount > 0
                ? {
                    label: t("page.unsavedSections", {
                      count: dirtySectionCount,
                    }),
                    variant: "secondary",
                  }
                : null
            }
            actions={
              activeSection === "billing" ? null : (
                <>
                  {activeSectionIsDirty ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="whitespace-nowrap"
                      onClick={handleDiscardChanges}
                      disabled={isLoading || isSaving || !isDirty}
                    >
                      {t("page.discardChanges")}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="whitespace-nowrap"
                    onClick={handleReset}
                    disabled={isLoading || isSaving || !settings}
                  >
                    {t("page.resetToDefaults")}
                  </Button>
                  <Button
                    type="button"
                    className="whitespace-nowrap"
                    onClick={handleSubmit(onSave)}
                    disabled={isLoading || isSaving || !canSave}
                  >
                    {isSaving ? t("page.saving") : t("page.saveChanges")}
                  </Button>
                </>
              )
            }
            footer={
              Object.keys(errors).length > 0 ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/[0.03] px-4 py-3 text-sm text-destructive">
                  {t("page.fixErrors")}
                </div>
              ) : null
            }
          >
            {activeSectionContent}
          </SectionWorkspacePanel>
        </div>
      </main>
    </FormProvider>
  );
};
