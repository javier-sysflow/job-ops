import {
  getApplicationStageStyle,
  setApplicationStageStyle,
} from "@client/i18n/stageStyle";
import {
  APPLICATION_STAGE_STYLE_VALUES,
  type ApplicationStageStyle,
} from "@shared/types.js";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { ListOrdered } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import * as api from "../api";
import { useSettings } from "../hooks/useSettings";
import { showErrorToast } from "../lib/error-toast";
import { queryKeys } from "../lib/queryKeys";

/**
 * Switches stage names between the standard labels and the Japanese hiring
 * sequence. Saves the same setting as Settings → Display ("Application
 * stages"), so the choice follows the user to every page and device.
 */
export const StageStyleSelect: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const [isSaving, setIsSaving] = React.useState(false);
  const style =
    settings?.applicationStageStyle?.value ?? getApplicationStageStyle();

  const handleChange = async (value: string) => {
    const next = value as ApplicationStageStyle;
    if (next === style) return;
    const defaultStyle = settings?.applicationStageStyle?.default ?? "standard";
    setIsSaving(true);
    try {
      const updated = await api.updateSettings({
        applicationStageStyle: next === defaultStyle ? null : next,
      });
      queryClient.setQueryData(queryKeys.settings.current(), updated);
      // Remounts the app (main.tsx), so every label switches at once.
      setApplicationStageStyle(next);
    } catch (error) {
      showErrorToast(error, t("display.stageStyleSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Select
      value={style}
      onValueChange={handleChange}
      disabled={isSaving || settings === null}
    >
      <SelectTrigger
        aria-label={t("display.stageStyleLabel")}
        className={cn("h-8 w-auto gap-1.5 text-xs", className)}
      >
        <ListOrdered className="h-3.5 w-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {APPLICATION_STAGE_STYLE_VALUES.map((value) => (
          <SelectItem key={value} value={value}>
            {t(`display.stageStyles.${value}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
