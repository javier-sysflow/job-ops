/**
 * UI language state, kept free of i18next imports so formatting helpers
 * (and anything else) can read the active locale cheaply.
 *
 * The choice is remembered per device in localStorage. Without a stored
 * choice, a browser set to Japanese starts in Japanese.
 */
export const UI_LANGUAGES = ["en", "ja"] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

export const UI_LANGUAGE_STORAGE_KEY = "jobops.uiLanguage";

const INTL_LOCALE_BY_LANGUAGE: Record<UiLanguage, string> = {
  // en-GB keeps the date/number formats the app has always used.
  en: "en-GB",
  ja: "ja-JP",
};

let currentLanguage: UiLanguage = "en";

export function isUiLanguage(value: unknown): value is UiLanguage {
  return value === "en" || value === "ja";
}

export function detectInitialUiLanguage(): UiLanguage {
  try {
    const stored = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
    if (isUiLanguage(stored)) return stored;
  } catch {
    // Storage unavailable: fall through to the browser language.
  }
  const browserLanguages =
    typeof navigator !== "undefined"
      ? [...(navigator.languages ?? []), navigator.language]
      : [];
  return browserLanguages.some((language) =>
    language?.toLowerCase().startsWith("ja"),
  )
    ? "ja"
    : "en";
}

export function getUiLanguage(): UiLanguage {
  return currentLanguage;
}

/** BCP 47 locale for Intl APIs (dates, numbers, relative time). */
export function getUiLocale(): string {
  return INTL_LOCALE_BY_LANGUAGE[currentLanguage];
}

export function setCurrentUiLanguage(language: UiLanguage): void {
  currentLanguage = language;
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
}

export function persistUiLanguage(language: UiLanguage): void {
  try {
    window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage unavailable; the language still applies for this page view.
  }
}
