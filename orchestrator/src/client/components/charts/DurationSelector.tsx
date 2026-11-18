/**
 * DurationSelector - Sticky nav component for selecting time range
 * Controls the duration for all charts on the home page
 */

import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DURATION_OPTIONS = [
  { value: 7 },
  { value: 14 },
  { value: 30 },
  { value: 90 },
] as const;

export type DurationValue = (typeof DURATION_OPTIONS)[number]["value"];

interface DurationSelectorProps {
  value: DurationValue;
  onChange: (value: DurationValue) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  const { t } = useTranslation("overview");
  const handleChange = useCallback(
    (newValue: string) => {
      const parsed = Number(newValue) as DurationValue;
      onChange(parsed);
    },
    [onChange],
  );

  return (
    <div className="flex items-center gap-2">
      <Tabs value={String(value)} onValueChange={handleChange}>
        <TabsList className="h-8">
          {DURATION_OPTIONS.map((option) => (
            <TabsTrigger
              key={option.value}
              value={String(option.value)}
              className="px-3 text-xs"
            >
              {t("duration.days", { days: option.value })}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
