/**
 * Fork: which labels application stages use, "standard" or the Japanese
 * hiring sequence (書類選考 → 適性検査 → 一次面接 → 二次面接 → 最終面接 → 内定).
 *
 * The value comes from the user's settings (see StageStyleSync). It is
 * mirrored to localStorage so the first screen after a reload already uses it,
 * and main.tsx remounts the app when it changes so every label updates.
 */
import {
  APPLICATION_STAGE_STYLE_VALUES,
  type ApplicationStageStyle,
} from "@shared/types";

export const STAGE_STYLE_STORAGE_KEY = "jobops.applicationStageStyle";

function isStageStyle(value: unknown): value is ApplicationStageStyle {
  return APPLICATION_STAGE_STYLE_VALUES.includes(
    value as ApplicationStageStyle,
  );
}

function readStoredStageStyle(): ApplicationStageStyle {
  try {
    const stored = window.localStorage.getItem(STAGE_STYLE_STORAGE_KEY);
    if (isStageStyle(stored)) return stored;
  } catch {
    // Storage unavailable: use the standard labels.
  }
  return "standard";
}

let currentStyle: ApplicationStageStyle = readStoredStageStyle();
const listeners = new Set<() => void>();

export function getApplicationStageStyle(): ApplicationStageStyle {
  return currentStyle;
}

export function setApplicationStageStyle(style: ApplicationStageStyle): void {
  if (style === currentStyle) return;
  currentStyle = style;
  try {
    window.localStorage.setItem(STAGE_STYLE_STORAGE_KEY, style);
  } catch {
    // Storage unavailable: the setting still applies for this session.
  }
  for (const listener of listeners) listener();
}

export function subscribeApplicationStageStyle(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
