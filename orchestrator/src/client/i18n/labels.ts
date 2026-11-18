/**
 * Translated labels for shared enums. shared/ keeps English labels (used by
 * the server, AI prompts and logs); the UI translates through these helpers.
 *
 * They read the active language from the i18n instance. The app remounts on
 * language change (see client/main.tsx), so callers need no hook.
 */

import { getCountryIso2Code } from "@shared/location-support";
import {
  type ApplicationStage,
  type ApplicationTaskType,
  type InterviewOutcome,
  type InterviewType,
  type JobOutcome,
  type JobStatus,
  type PdfRenderer,
  STAGE_LABELS,
  type TypstTheme,
} from "@shared/types";
import i18n from "./index";
import { getUiLocale } from "./language";
import { getApplicationStageStyle } from "./stageStyle";

export const jobStatusLabel = (status: JobStatus): string =>
  i18n.t(`enums:jobStatus.${status}`);

/** Follows the user's stage style (standard or the Japanese sequence). */
export const stageLabel = (stage: ApplicationStage | "no_change"): string =>
  getApplicationStageStyle() === "japanese"
    ? i18n.t(`enums:applicationStageJapanese.${stage}`)
    : i18n.t(`enums:applicationStage.${stage}`);

/**
 * Title shown for a stage event. Stored titles are English text written by
 * the app ("Applied", "Moved to Technical Interview") or the raw stage id;
 * those show as the translated stage label so they follow the UI language and
 * stage style. Titles the user typed are shown as entered.
 */
export function stageEventTitle(
  title: string | null | undefined,
  toStage: ApplicationStage,
): string {
  const trimmed = title?.trim() ?? "";
  const englishLabel = STAGE_LABELS[toStage];
  const isAppTitle =
    trimmed === "" ||
    trimmed === toStage ||
    trimmed === englishLabel ||
    trimmed === `Moved to ${englishLabel}`; // i18n-ignore
  return isAppTitle ? stageLabel(toStage) : trimmed;
}

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
