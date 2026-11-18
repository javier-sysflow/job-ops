import type React from "react";
import { Moon, Sun } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useThemePreference } from "../hooks/useThemePreference";

/**
 * One-click light/dark switch for the page header. The choice is remembered
 * per device. ("system" is still honoured if stored, and clicking switches
 * to the opposite of what is currently shown.)
 */
export const ThemeToggle: React.FC = () => {
  const { isDark, setPreference } = useThemePreference();
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9 shrink-0"
      aria-label={label}
      title={label}
      onClick={() => setPreference(isDark ? "light" : "dark")}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
};
