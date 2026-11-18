/**
 * Settings page constants.
 */

import type { ChatValues } from "@client/pages/settings/types";
import type { JobStatus } from "@shared/types";

/** All available job statuses for clearing */
export const ALL_JOB_STATUSES: JobStatus[] = [
  "discovered",
  "processing",
  "ready",
  "applied",
  "in_progress",
  "skipped",
  "expired",
];

// Status descriptions shown in the UI live in the i18n resources
// (settings:danger.statusDescriptions.<status>).

export type WritingStylePresetId =
  | "professional"
  | "concise"
  | "direct"
  | "friendly";

export type WritingStyleDraft = {
  tone: string;
  formality: string;
  constraints: string;
  doNotUse: string;
};

/**
 * Preset labels and descriptions are translated in the UI
 * (settings:chat.presets.<id>). The values are sent to the AI as-is.
 */
export type WritingStylePreset = {
  id: WritingStylePresetId;
  values: WritingStyleDraft;
};

export const WRITING_STYLE_PRESETS: WritingStylePreset[] = [
  {
    id: "professional",
    values: {
      tone: "professional",
      formality: "medium",
      constraints: "",
      doNotUse: "",
    },
  },
  {
    id: "concise",
    values: {
      tone: "concise",
      formality: "medium",
      constraints: "Keep the response tight, practical, and easy to scan.",
      doNotUse: "",
    },
  },
  {
    id: "direct",
    values: {
      tone: "direct",
      formality: "medium",
      constraints: "Prioritize clarity and direct wording over flourish.",
      doNotUse: "",
    },
  },
  {
    id: "friendly",
    values: {
      tone: "friendly",
      formality: "low",
      constraints: "Keep the response warm, approachable, and confident.",
      doNotUse: "",
    },
  },
];

export function resolveWritingStyleDraft(args: {
  values: Partial<Record<keyof WritingStyleDraft, string | null | undefined>>;
  defaults: ChatValues;
}): WritingStyleDraft {
  const { values, defaults } = args;

  return {
    tone: values.tone?.trim() || defaults.tone.effective,
    formality: values.formality?.trim() || defaults.formality.effective,
    constraints: values.constraints?.trim() || defaults.constraints.effective,
    doNotUse: values.doNotUse?.trim() || defaults.doNotUse.effective,
  };
}

export function getMatchingWritingStylePresetId(
  style: WritingStyleDraft,
): WritingStylePresetId | null {
  const match = WRITING_STYLE_PRESETS.find(
    (preset) =>
      preset.values.tone === style.tone &&
      preset.values.formality === style.formality &&
      preset.values.constraints === style.constraints &&
      preset.values.doNotUse === style.doNotUse,
  );

  return match?.id ?? null;
}
