import { TokenizedInput } from "@client/pages/orchestrator/TokenizedInput";
import { SettingsInput } from "@client/pages/settings/components/SettingsInput";
import { SettingsSectionFrame } from "@client/pages/settings/components/SettingsSectionFrame";
import type { ScoringValues } from "@client/pages/settings/types";
import type { UpdateSettingsInput } from "@shared/settings-schema.js";
import type React from "react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

type ScoringSettingsSectionProps = {
  values: ScoringValues;
  isLoading: boolean;
  isSaving: boolean;
  layoutMode?: "accordion" | "panel";
};

function parseTokenizedKeywordInput(input: string): string[] {
  return input
    .split(/[\n,]/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

export const ScoringSettingsSection: React.FC<ScoringSettingsSectionProps> = ({
  values,
  isLoading,
  isSaving,
  layoutMode,
}) => {
  const { t } = useTranslation("settings");
  const yesNo = (value: boolean) => (value ? t("shared.yes") : t("shared.no"));
  const disabledLabel = t("shared.disabled");
  const keywordList = (keywords: string[]) =>
    keywords.length > 0
      ? keywords.join(t("shared.listSeparator"))
      : t("shared.none");
  const {
    penalizeMissingSalary,
    missingSalaryPenalty,
    autoSkipScoreThreshold,
    blockedCompanyKeywords,
  } = values;
  const { control, watch, setValue } = useFormContext<UpdateSettingsInput>();
  const [blockedCompanyKeywordDraft, setBlockedCompanyKeywordDraft] =
    useState("");

  // Watch the current form value to conditionally show/hide penalty input
  const currentPenalizeEnabled =
    watch("penalizeMissingSalary") ?? penalizeMissingSalary.default;

  // Watch auto-skip threshold to show current value
  const currentAutoSkipThreshold = watch("autoSkipScoreThreshold");
  const blockedCompanyKeywordValues =
    watch("blockedCompanyKeywords") ?? blockedCompanyKeywords.default;

  return (
    <SettingsSectionFrame
      mode={layoutMode}
      title={t("scoring.title")}
      value="scoring"
    >
      <div className="space-y-4">
        {/* Enable penalty toggle */}
        <div className="flex items-start space-x-3">
          <Controller
            name="penalizeMissingSalary"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="penalizeMissingSalary"
                checked={field.value ?? penalizeMissingSalary.default}
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
              htmlFor="penalizeMissingSalary"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {t("scoring.penalizeLabel")}
            </label>
            <p className="text-xs text-muted-foreground">
              {t("scoring.penalizeHelp")}
            </p>
          </div>
        </div>

        {/* Penalty amount input - only shown when enabled */}
        {currentPenalizeEnabled && (
          <div className="pl-7">
            <Controller
              name="missingSalaryPenalty"
              control={control}
              render={({ field }) => (
                <SettingsInput
                  label={t("scoring.penaltyLabel")}
                  type="number"
                  inputProps={{
                    ...field,
                    inputMode: "numeric",
                    min: 0,
                    max: 100,
                    step: 1,
                    value: field.value ?? missingSalaryPenalty.default,
                    onChange: (event) => {
                      const value = parseInt(event.target.value, 10);
                      if (Number.isNaN(value)) {
                        field.onChange(null);
                      } else {
                        field.onChange(Math.min(100, Math.max(0, value)));
                      }
                    },
                  }}
                  disabled={isLoading || isSaving}
                  helper={t("scoring.penaltyHelper", {
                    value: missingSalaryPenalty.default,
                  })}
                  current={t("shared.effectiveDefault", {
                    effective: missingSalaryPenalty.effective,
                    default: missingSalaryPenalty.default,
                  })}
                />
              )}
            />
          </div>
        )}

        <Separator />

        {/* Auto-skip threshold input */}
        <div className="space-y-3">
          <Controller
            name="autoSkipScoreThreshold"
            control={control}
            render={({ field }) => (
              <SettingsInput
                label={t("scoring.autoSkipLabel")}
                type="number"
                inputProps={{
                  ...field,
                  inputMode: "numeric",
                  min: 0,
                  max: 100,
                  step: 1,
                  value: field.value ?? "",
                  onChange: (event) => {
                    const value = event.target.value;
                    if (value === "" || value === null) {
                      field.onChange(null);
                    } else {
                      const parsed = parseInt(value, 10);
                      if (Number.isNaN(parsed)) {
                        field.onChange(null);
                      } else {
                        field.onChange(Math.min(100, Math.max(0, parsed)));
                      }
                    }
                  },
                  placeholder: disabledLabel,
                }}
                disabled={isLoading || isSaving}
                helper={t("scoring.autoSkipHelp")}
                current={t("shared.effectiveDefault", {
                  effective:
                    currentAutoSkipThreshold === null ||
                    currentAutoSkipThreshold === undefined
                      ? disabledLabel
                      : currentAutoSkipThreshold,
                  default: autoSkipScoreThreshold.default ?? disabledLabel,
                })}
              />
            )}
          />
        </div>

        <div className="space-y-3">
          <label
            htmlFor="blocked-company-keywords"
            className="text-sm font-medium leading-none"
          >
            {t("scoring.blockedLabel")}
          </label>
          <TokenizedInput
            id="blocked-company-keywords"
            values={blockedCompanyKeywordValues}
            draft={blockedCompanyKeywordDraft}
            parseInput={parseTokenizedKeywordInput}
            onDraftChange={setBlockedCompanyKeywordDraft}
            onValuesChange={(value) =>
              setValue("blockedCompanyKeywords", value, { shouldDirty: true })
            }
            placeholder={t("scoring.blockedPlaceholder")}
            helperText={t("scoring.blockedHelp")}
            removeLabelPrefix={t("scoring.blockedRemove")}
            disabled={isLoading || isSaving}
          />
          <div className="break-words font-mono text-xs text-muted-foreground">
            {t("shared.effectiveDefault", {
              effective: keywordList(blockedCompanyKeywordValues),
              default: keywordList(blockedCompanyKeywords.default),
            })}
          </div>
        </div>

        <Separator />

        {/* Effective/Default values display */}
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">
              {t("scoring.penaltyEnabled")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("shared.effectiveDefault", {
                effective: yesNo(penalizeMissingSalary.effective),
                default: yesNo(penalizeMissingSalary.default),
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("scoring.penaltyLabel")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("shared.effectiveDefault", {
                effective: missingSalaryPenalty.effective,
                default: missingSalaryPenalty.default,
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("scoring.autoSkipThreshold")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("shared.effectiveDefault", {
                effective: autoSkipScoreThreshold.effective ?? disabledLabel,
                default: autoSkipScoreThreshold.default ?? disabledLabel,
              })}
            </div>
          </div>
        </div>
      </div>
    </SettingsSectionFrame>
  );
};
