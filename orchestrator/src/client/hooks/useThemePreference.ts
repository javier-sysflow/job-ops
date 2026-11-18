import { useCallback, useEffect, useState } from "react";
import {
  applyThemePreference,
  readThemePreference,
  resolveIsDark,
  setThemePreference,
  subscribeToThemePreference,
  systemPrefersDark,
  type ThemePreference,
} from "../lib/theme";

export function useThemePreference(): {
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
} {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readThemePreference);
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);

  useEffect(() => subscribeToThemePreference(setPreferenceState), []);

  // Follow the operating system while "system" is selected.
  useEffect(() => {
    if (preference !== "system" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setPrefersDark(media.matches);
      applyThemePreference("system");
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setThemePreference(next);
    setPreferenceState(next);
  }, []);

  return {
    preference,
    isDark: resolveIsDark(preference, prefersDark),
    setPreference,
  };
}
