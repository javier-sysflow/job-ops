import { TokenizedInput } from "@client/pages/orchestrator/TokenizedInput";
import { SettingsSectionFrame } from "@client/pages/settings/components/SettingsSectionFrame";
import {
  getMatchingWritingStylePresetId,
  resolveWritingStyleDraft,
  WRITING_STYLE_PRESETS,
} from "@client/pages/settings/constants";
import type { ChatValues } from "@client/pages/settings/types";
import type { UpdateSettingsInput } from "@shared/settings-schema.js";
import {
  CHAT_STYLE_MANUAL_LANGUAGE_VALUES,
  type ChatStyleLanguageMode,
  type ChatStyleManualLanguage,
} from "@shared/types.js";
import type React from "react";
import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type ChatSettingsSectionProps = {
  values: ChatValues;
  isLoading: boolean;
  isSaving: boolean;
  layoutMode?: "accordion" | "panel";
};

function parseTokenizedTerms(input: string): string[] {
  return input
    .split(/[\n,]/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseStoredTerms(value: string | null | undefined): string[] {
  return parseTokenizedTerms(value ?? "");
}

function normalizeBlank(value: string | null | undefined): string | undefined {
  return value == null || value === "" ? undefined : value;
}

export const ChatSettingsSection: React.FC<ChatSettingsSectionProps> = ({
  values,
  isLoading,
  isSaving,
  layoutMode,
}) => {
  const { t } = useTranslation("settings");
  const languageModeLabel = (mode: ChatStyleLanguageMode) =>
    t(`chat.languageModes.${mode}`);
  const manualLanguageLabel = (language: ChatStyleManualLanguage) =>
    t(`chat.languages.${language}`);
  const enabledLabel = (value: boolean) =>
    value ? t("shared.enabled") : t("shared.disabled");
  const {
    tone,
    formality,
    constraints,
    doNotUse,
    languageMode,
    manualLanguage,
    stopSlopEnabled,
    summaryMaxWords,
    maxKeywordsPerSkill,
  } = values;

  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<UpdateSettingsInput>();
  const [doNotUseDraft, setDoNotUseDraft] = useState("");
  const [
    toneValue,
    formalityValue,
    constraintsValue,
    doNotUseValue,
    languageModeValue,
  ] = useWatch({
    control,
    name: [
      "chatStyleTone",
      "chatStyleFormality",
      "chatStyleConstraints",
      "chatStyleDoNotUse",
      "chatStyleLanguageMode",
    ],
  });
  const toneDraft = normalizeBlank(toneValue);
  const formalityDraft = normalizeBlank(formalityValue);
  const constraintsDraft = normalizeBlank(constraintsValue);
  const doNotUseDraftValue = normalizeBlank(doNotUseValue);
  const resolvedLanguageMode =
    normalizeBlank(languageModeValue) ?? languageMode.default;
  const showManualLanguage = resolvedLanguageMode === "manual";
  const resolvedStyle = resolveWritingStyleDraft({
    values: {
      tone: toneDraft,
      formality: formalityDraft,
      constraints: constraintsDraft,
      doNotUse: doNotUseDraftValue,
    },
    defaults: values,
  });
  const selectedPresetId =
    getMatchingWritingStylePresetId(resolvedStyle) ?? "custom";
  const doNotUseTokens = parseStoredTerms(
    doNotUseDraftValue ?? doNotUse.default,
  );

  return (
    <SettingsSectionFrame
      mode={layoutMode}
      title={t("chat.title")}
      value="chat"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("chat.intro")}</p>

        <div className="space-y-2">
          <label htmlFor="writingStylePreset" className="text-sm font-medium">
            {t("chat.presetLabel")}
          </label>
          <Select
            value={selectedPresetId}
            onValueChange={(value) => {
              if (value === "custom") return;

              const preset = WRITING_STYLE_PRESETS.find(
                (item) => item.id === value,
              );
              if (!preset) return;

              setValue("chatStyleTone", preset.values.tone, {
                shouldDirty: true,
              });
              setValue("chatStyleFormality", preset.values.formality, {
                shouldDirty: true,
              });
              setValue("chatStyleConstraints", preset.values.constraints, {
                shouldDirty: true,
              });
              setValue("chatStyleDoNotUse", preset.values.doNotUse, {
                shouldDirty: true,
              });
            }}
            disabled={isLoading || isSaving}
          >
            <SelectTrigger id="writingStylePreset">
              <SelectValue placeholder={t("chat.presetPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {WRITING_STYLE_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {t(`chat.presets.${preset.id}.label`)}
                </SelectItem>
              ))}
              <SelectItem value="custom">{t("chat.presetCustom")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            {selectedPresetId === "custom"
              ? t("chat.presetCustomDescription")
              : t(`chat.presets.${selectedPresetId}.description`)}
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Controller
            name="ghostwriterStopSlopEnabled"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="ghostwriterStopSlopEnabled"
                checked={field.value ?? stopSlopEnabled.default}
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
              htmlFor="ghostwriterStopSlopEnabled"
              className="cursor-pointer text-sm font-medium leading-none"
            >
              {t("chat.stopSlopLabel")}
            </label>
            <p className="text-xs text-muted-foreground">
              {t("chat.stopSlopHelp")}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="chatStyleLanguageMode"
              className="text-sm font-medium"
            >
              {t("chat.outputLanguage")}
            </label>
            <Controller
              name="chatStyleLanguageMode"
              control={control}
              render={({ field }) => (
                <Select
                  value={normalizeBlank(field.value) ?? languageMode.default}
                  onValueChange={(value) => {
                    const nextValue = value as ChatStyleLanguageMode;
                    field.onChange(nextValue);
                    if (nextValue !== "manual") {
                      setValue("chatStyleManualLanguage", null, {
                        shouldDirty: true,
                      });
                    }
                  }}
                  disabled={isLoading || isSaving}
                >
                  <SelectTrigger
                    id="chatStyleLanguageMode"
                    aria-label={t("chat.outputLanguage")}
                  >
                    <SelectValue
                      placeholder={t("chat.outputLanguagePlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match-resume">
                      {languageModeLabel("match-resume")}
                    </SelectItem>
                    <SelectItem value="match-job-description">
                      {languageModeLabel("match-job-description")}
                    </SelectItem>
                    <SelectItem value="manual">
                      {languageModeLabel("manual")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <div className="text-xs text-muted-foreground">
              {t("chat.outputLanguageHelp")}
            </div>
          </div>

          {showManualLanguage ? (
            <div className="space-y-2">
              <label
                htmlFor="chatStyleManualLanguage"
                className="text-sm font-medium"
              >
                {t("chat.specificLanguage")}
              </label>
              <Controller
                name="chatStyleManualLanguage"
                control={control}
                render={({ field }) => (
                  <Select
                    value={
                      normalizeBlank(field.value) ?? manualLanguage.default
                    }
                    onValueChange={(value) =>
                      field.onChange(value as ChatStyleManualLanguage)
                    }
                    disabled={isLoading || isSaving}
                  >
                    <SelectTrigger
                      id="chatStyleManualLanguage"
                      aria-label={t("chat.specificLanguage")}
                    >
                      <SelectValue
                        placeholder={t("chat.specificLanguagePlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {CHAT_STYLE_MANUAL_LANGUAGE_VALUES.map((language) => (
                        <SelectItem key={language} value={language}>
                          {manualLanguageLabel(language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <div className="text-xs text-muted-foreground">
                {t("chat.specificLanguageHelp")}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="chatStyleTone" className="text-sm font-medium">
              {t("chat.tone")}
            </label>
            <Controller
              name="chatStyleTone"
              control={control}
              render={({ field }) => (
                <Select
                  value={normalizeBlank(field.value) ?? tone.default}
                  onValueChange={(value) => field.onChange(value)}
                  disabled={isLoading || isSaving}
                >
                  <SelectTrigger id="chatStyleTone">
                    <SelectValue placeholder={t("chat.tonePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">
                      {t("chat.tones.professional")}
                    </SelectItem>
                    <SelectItem value="concise">
                      {t("chat.tones.concise")}
                    </SelectItem>
                    <SelectItem value="direct">
                      {t("chat.tones.direct")}
                    </SelectItem>
                    <SelectItem value="friendly">
                      {t("chat.tones.friendly")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="chatStyleFormality" className="text-sm font-medium">
              {t("chat.formality")}
            </label>
            <Controller
              name="chatStyleFormality"
              control={control}
              render={({ field }) => (
                <Select
                  value={normalizeBlank(field.value) ?? formality.default}
                  onValueChange={(value) => field.onChange(value)}
                  disabled={isLoading || isSaving}
                >
                  <SelectTrigger id="chatStyleFormality">
                    <SelectValue placeholder={t("chat.formalityPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      {t("chat.formalities.low")}
                    </SelectItem>
                    <SelectItem value="medium">
                      {t("chat.formalities.medium")}
                    </SelectItem>
                    <SelectItem value="high">
                      {t("chat.formalities.high")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="chatStyleConstraints" className="text-sm font-medium">
            {t("chat.constraints")}
          </label>
          <Textarea
            id="chatStyleConstraints"
            placeholder={t("chat.constraintsPlaceholder")}
            disabled={isLoading || isSaving}
            {...register("chatStyleConstraints")}
          />
          <div className="text-xs text-muted-foreground">
            {t("chat.constraintsHelp")}
          </div>
          <div className="text-xs text-muted-foreground">
            {t("shared.current")}{" "}
            <span className="font-mono">{constraints.effective || "—"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="chatStyleDoNotUse" className="text-sm font-medium">
            {t("chat.doNotUse")}
          </label>
          <TokenizedInput
            id="chatStyleDoNotUse"
            values={doNotUseTokens}
            draft={doNotUseDraft}
            parseInput={parseTokenizedTerms}
            onDraftChange={setDoNotUseDraft}
            onValuesChange={(nextValues) =>
              setValue("chatStyleDoNotUse", nextValues.join(", "), {
                shouldDirty: true,
              })
            }
            placeholder={t("chat.doNotUsePlaceholder")}
            helperText={t("chat.doNotUseHelp")}
            removeLabelPrefix={t("chat.doNotUseRemove")}
            disabled={isLoading || isSaving}
          />
          <div className="text-xs text-muted-foreground">
            {t("shared.current")}{" "}
            <span className="font-mono">{doNotUse.effective || "—"}</span>
          </div>
        </div>

        <Separator />

        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">
              {t("chat.tone")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("shared.effectiveDefault", {
                effective: tone.effective,
                default: tone.default,
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("chat.formality")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("shared.effectiveDefault", {
                effective: formality.effective,
                default: formality.default,
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("chat.languageMode")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("shared.effectiveDefault", {
                effective: languageModeLabel(languageMode.effective),
                default: languageModeLabel(languageMode.default),
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("chat.specificLanguage")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("shared.effectiveDefault", {
                effective: manualLanguageLabel(manualLanguage.effective),
                default: manualLanguageLabel(manualLanguage.default),
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("chat.stopSlop")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("shared.effectiveDefault", {
                effective: enabledLabel(stopSlopEnabled.effective),
                default: enabledLabel(stopSlopEnabled.default),
              })}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="chatStyleSummaryMaxWords"
              className="text-sm font-medium"
            >
              {t("chat.summaryMaxWords")}
            </label>
            <Controller
              name="chatStyleSummaryMaxWords"
              control={control}
              rules={{
                validate: (v) =>
                  v === null ||
                  v === undefined ||
                  (Number.isInteger(v) && v >= 1 && v <= 500) ||
                  t("chat.rangeError", { min: 1, max: 500 }),
              }}
              render={({ field }) => (
                <Input
                  id="chatStyleSummaryMaxWords"
                  type="number"
                  min={1}
                  max={500}
                  step={1}
                  placeholder={t("chat.noLimit")}
                  disabled={isLoading || isSaving}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.valueAsNumber;
                    field.onChange(Number.isFinite(value) ? value : null);
                  }}
                />
              )}
            />
            {errors.chatStyleSummaryMaxWords && (
              <div className="text-xs text-destructive">
                {errors.chatStyleSummaryMaxWords.message as string}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {t("chat.summaryMaxWordsHelp")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("shared.current")}{" "}
              <span className="font-mono">
                {summaryMaxWords.effective ?? "—"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="chatStyleMaxKeywordsPerSkill"
              className="text-sm font-medium"
            >
              {t("chat.maxKeywords")}
            </label>
            <Controller
              name="chatStyleMaxKeywordsPerSkill"
              control={control}
              rules={{
                validate: (v) =>
                  v === null ||
                  v === undefined ||
                  (Number.isInteger(v) && v >= 1 && v <= 50) ||
                  t("chat.rangeError", { min: 1, max: 50 }),
              }}
              render={({ field }) => (
                <Input
                  id="chatStyleMaxKeywordsPerSkill"
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  placeholder={t("chat.noLimit")}
                  disabled={isLoading || isSaving}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.valueAsNumber;
                    field.onChange(Number.isFinite(value) ? value : null);
                  }}
                />
              )}
            />
            {errors.chatStyleMaxKeywordsPerSkill && (
              <div className="text-xs text-destructive">
                {errors.chatStyleMaxKeywordsPerSkill.message as string}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {t("chat.maxKeywordsHelp")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("shared.current")}{" "}
              <span className="font-mono">
                {maxKeywordsPerSkill.effective ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SettingsSectionFrame>
  );
};
