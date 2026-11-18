/**
 * Light / dark / system appearance, remembered per device in localStorage.
 *
 * index.html runs an inline copy of this logic before the app loads so the
 * first paint already uses the right theme (no flash). Keep the storage key
 * and default in sync with that script.
 */
export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "jobops.theme";
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "dark";
const THEME_CHANGE_EVENT = "jobops:theme-change";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function systemPrefersDark(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolveIsDark(
  preference: ThemePreference,
  prefersDark: boolean = systemPrefersDark(),
): boolean {
  return preference === "dark" || (preference === "system" && prefersDark);
}

export function applyThemePreference(preference: ThemePreference): boolean {
  const isDark = resolveIsDark(preference);
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
  return isDark;
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies
    // for this page view.
  }
  applyThemePreference(preference);
  window.dispatchEvent(
    new CustomEvent(THEME_CHANGE_EVENT, { detail: preference }),
  );
}

export function subscribeToThemePreference(
  listener: (preference: ThemePreference) => void,
): () => void {
  const handleChange = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (isThemePreference(detail)) listener(detail);
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      const next = readThemePreference();
      applyThemePreference(next);
      listener(next);
    }
  };
  window.addEventListener(THEME_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}
