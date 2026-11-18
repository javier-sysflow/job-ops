import { SettingsSectionFrame } from "@client/pages/settings/components/SettingsSectionFrame";
import type { DisplayValues } from "@client/pages/settings/types";
import type { UpdateSettingsInput } from "@shared/settings-schema.js";
import {
  APPLICATION_STAGE_STYLE_VALUES,
  type ApplicationStageStyle,
} from "@shared/types.js";
import type React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type DisplaySettingsSectionProps = {
  values: DisplayValues;
  isLoading: boolean;
  isSaving: boolean;
  layoutMode?: "accordion" | "panel";
};

export const DisplaySettingsSection: React.FC<DisplaySettingsSectionProps> = ({
  values,
  isLoading,
  isSaving,
  layoutMode,
}) => {
  const { t } = useTranslation("settings");
  const enabledLabel = (value: boolean) =>
    value ? t("shared.enabled") : t("shared.disabled");
  const {
    showSponsorInfo,
    renderMarkdownInJobDescriptions,
    autoTailorOnManualImport,
    applicationStageStyle,
  } = values;
  const { control } = useFormContext<UpdateSettingsInput>();

  return (
    <SettingsSectionFrame
      mode={layoutMode}
      title={t("display.title")}
      value="display"
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Controller
            name="showSponsorInfo"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="showSponsorInfo"
                checked={field.value ?? showSponsorInfo.default}
                onCheckedChange={(checked) => {
                  field.onChange(
                    checked === "indeterminate" ? null : checked === true,
                  );
                }}
                disabled={isLoading || isSaving}
              />
            )}
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="showSponsorInfo"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {t("display.sponsorLabel")}
            </label>
            <p className="text-xs text-muted-foreground">
              {t("display.sponsorHelp")}
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex items-start space-x-3">
          <Controller
            name="renderMarkdownInJobDescriptions"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="renderMarkdownInJobDescriptions"
                checked={field.value ?? renderMarkdownInJobDescriptions.default}
                onCheckedChange={(checked) => {
                  field.onChange(
                    checked === "indeterminate" ? null : checked === true,
                  );
                }}
                disabled={isLoading || isSaving}
              />
            )}
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="renderMarkdownInJobDescriptions"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {t("display.markdownLabel")}
            </label>
            <p className="text-xs text-muted-foreground">
              {t("display.markdownHelp")}
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex items-start space-x-3">
          <Controller
            name="autoTailorOnManualImport"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="autoTailorOnManualImport"
                checked={field.value ?? autoTailorOnManualImport.default}
                onCheckedChange={(checked) => {
                  field.onChange(
                    checked === "indeterminate" ? null : checked === true,
                  );
                }}
                disabled={isLoading || isSaving}
              />
            )}
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="autoTailorOnManualImport"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {t("display.autoTailorLabel")}
            </label>
            <p className="text-xs text-muted-foreground">
              {t("display.autoTailorHelp")}
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="applicationStageStyle"
            className="text-sm font-medium leading-none"
          >
            {t("display.stageStyleLabel")}
          </label>
          <Controller
            name="applicationStageStyle"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? applicationStageStyle.default}
                onValueChange={(value) =>
                  field.onChange(value as ApplicationStageStyle)
                }
                disabled={isLoading || isSaving}
              >
                <SelectTrigger
                  id="applicationStageStyle"
                  className="w-full sm:w-72"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STAGE_STYLE_VALUES.map((style) => (
                    <SelectItem key={style} value={style}>
                      {t(`display.stageStyles.${style}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-xs text-muted-foreground">
            {t("display.stageStyleHelp")}
          </p>
        </div>

        <Separator />

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">
              {t("display.sponsorEffective")}
            </div>
            <div className="break-words font-mono text-xs">
              {enabledLabel(showSponsorInfo.effective)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("display.sponsorDefault")}
            </div>
            <div className="break-words font-mono text-xs font-semibold">
              {enabledLabel(showSponsorInfo.default)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("display.markdownEffective")}
            </div>
            <div className="break-words font-mono text-xs">
              {enabledLabel(renderMarkdownInJobDescriptions.effective)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("display.markdownDefault")}
            </div>
            <div className="break-words font-mono text-xs font-semibold">
              {enabledLabel(renderMarkdownInJobDescriptions.default)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("display.autoTailorEffective")}
            </div>
            <div className="break-words font-mono text-xs">
              {enabledLabel(autoTailorOnManualImport.effective)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("display.autoTailorDefault")}
            </div>
            <div className="break-words font-mono text-xs font-semibold">
              {enabledLabel(autoTailorOnManualImport.default)}
            </div>
          </div>
        </div>
      </div>
    </SettingsSectionFrame>
  );
};
