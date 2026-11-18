/**
 * Translated labels for shared enums. shared/ keeps English labels (used by
 * the server, AI prompts and logs); the UI translates through these helpers.
 *
 * They read the active language from the i18n instance. The app remounts on
 * language change (see client/main.tsx), so callers need no hook.
 */

import { getCountryIso2Code } from "@shared/location-support";
import type {
  ApplicationStage,
  ApplicationTaskType,
  InterviewOutcome,
  InterviewType,
  JobOutcome,
  JobStatus,
  PdfRenderer,
  TypstTheme,
} from "@shared/types";
import i18n from "./index";
import { getUiLocale } from "./language";

export const jobStatusLabel = (status: JobStatus): string =>
  i18n.t(`enums:jobStatus.${status}`);

export const stageLabel = (stage: ApplicationStage | "no_change"): string =>
  i18n.t(`enums:applicationStage.${stage}`);

export const outcomeLabel = (outcome: JobOutcome): string =>
  i18n.t(`enums:outcome.${outcome}`);

export const taskTypeLabel = (type: ApplicationTaskType): string =>
  i18n.t(`enums:taskType.${type}`);

export const interviewTypeLabel = (type: InterviewType): string =>
  i18n.t(`enums:interviewType.${type}`);

export const interviewOutcomeLabel = (outcome: InterviewOutcome): string =>
  i18n.t(`enums:interviewOutcome.${outcome}`);

export const workplaceTypeLabel = (
  type: "remote" | "hybrid" | "onsite",
): string => i18n.t(`enums:workplaceType.${type}`);

export const typstThemeLabel = (theme: TypstTheme): string =>
  i18n.t(`enums:typstTheme.${theme}`);

export const pdfRendererLabel = (renderer: PdfRenderer): string =>
  i18n.t(`resumeStudio:preview.renderers.${renderer}`);

/**
 * Country name in the UI language (日本 / Japan) via Intl.DisplayNames,
 * falling back to the provided English label.
 */
export function countryLabel(
  countryKey: string | null | undefined,
  fallback: string,
): string {
  const iso2 = getCountryIso2Code(countryKey);
  if (!iso2 || typeof Intl.DisplayNames !== "function") return fallback;
  try {
    return (
      new Intl.DisplayNames([getUiLocale()], { type: "region" }).of(iso2) ??
      fallback
    );
  } catch {
    return fallback;
  }
}
