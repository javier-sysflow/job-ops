import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY } from "../lib/theme";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.add("dark");
  });

  it("switches between light and dark mode and remembers the choice", () => {
    render(<ThemeToggle />);

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to light mode" }),
    );
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
