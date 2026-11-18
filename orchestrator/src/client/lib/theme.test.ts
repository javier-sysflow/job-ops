import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyThemePreference,
  readThemePreference,
  resolveIsDark,
  setThemePreference,
  subscribeToThemePreference,
  THEME_STORAGE_KEY,
} from "./theme";

describe("theme preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.add("dark");
  });

  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "";
  });

  it("defaults to dark and ignores unknown stored values", () => {
    expect(readThemePreference()).toBe("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    expect(readThemePreference()).toBe("dark");
  });

  it("resolves system against the OS preference", () => {
    expect(resolveIsDark("light", true)).toBe(false);
    expect(resolveIsDark("dark", false)).toBe(true);
    expect(resolveIsDark("system", true)).toBe(true);
    expect(resolveIsDark("system", false)).toBe(false);
  });

  it("applies light mode by removing the dark class", () => {
    expect(applyThemePreference("light")).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("persists the choice and notifies subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToThemePreference(listener);

    setThemePreference("light");

    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(readThemePreference()).toBe("light");
    expect(listener).toHaveBeenCalledWith("light");
    unsubscribe();
  });
});
