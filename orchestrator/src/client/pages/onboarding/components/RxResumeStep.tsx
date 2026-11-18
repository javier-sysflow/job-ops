import { BaseResumeSelection } from "@client/pages/settings/components/BaseResumeSelection";
import { SettingsInput } from "@client/pages/settings/components/SettingsInput";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import type { ValidationState } from "../types";
import { InlineValidation } from "./InlineValidation";

export const RxResumeStep: React.FC<{
  baseResumeValue: string | null;
  isBusy: boolean;
  isResumeReady: boolean;
  hasRxResumeAccess: boolean;
  allowSelfHosted?: boolean;
  isSelfHosted: boolean;
  rxresumeApiKey: string;
  rxresumeUrl: string;
  rxresumeValidation: ValidationState;
  rxresumeApiKeyHint: string | null | undefined;
  onTemplateResumeChange: (value: string | null) => void;
  onSelfHostedChange: (next: boolean) => void;
  onRxresumeApiKeyChange: (value: string) => void;
  onRxresumeUrlChange: (value: string) => void;
}> = ({
  baseResumeValue,
  allowSelfHosted = true,
  hasRxResumeAccess,
  isBusy,
  isResumeReady,
  isSelfHosted,
  onTemplateResumeChange,
  onRxresumeApiKeyChange,
  onRxresumeUrlChange,
  onSelfHostedChange,
  rxresumeApiKey,
  rxresumeApiKeyHint,
  rxresumeUrl,
  rxresumeValidation,
}) => {
  const { t } = useTranslation("onboarding");
  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
          {t("rxResume.intro")}
        </div>

        <SettingsInput
          label={t("rxResume.apiKeyLabel")}
          inputProps={{
            name: "rxresumeApiKey",
            value: rxresumeApiKey,
            onChange: (event) =>
              onRxresumeApiKeyChange(event.currentTarget.value),
          }}
          type="password"
          placeholder={t("rxResume.apiKeyPlaceholder")}
          helper={rxresumeApiKeyHint ? t("rxResume.apiKeyKeep") : undefined}
          disabled={isBusy}
        />

        {allowSelfHosted ? (
          <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
            <label
              htmlFor="rxresume-self-hosted"
              className="flex cursor-pointer items-start gap-3"
            >
              <Checkbox
                id="rxresume-self-hosted"
                checked={isSelfHosted}
                onCheckedChange={(checked) =>
                  onSelfHostedChange(Boolean(checked))
                }
                disabled={isBusy}
              />
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {t("rxResume.selfHostedTitle")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("rxResume.selfHostedDescription")}
                </p>
              </div>
            </label>
          </div>
        ) : null}

        {allowSelfHosted && isSelfHosted ? (
          <SettingsInput
            label={t("rxResume.customUrl")}
            inputProps={{
              name: "rxresumeUrl",
              value: rxresumeUrl,
              onChange: (event) =>
                onRxresumeUrlChange(event.currentTarget.value),
            }}
            type="url"
            placeholder="https://rxresu.me" // i18n-ignore
            helper={t("rxResume.customUrlHelper")}
            disabled={isBusy}
          />
        ) : null}

        {hasRxResumeAccess ? (
          <div className="space-y-3 rounded-lg border border-border/60 bg-background/70 p-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {t("rxResume.templateTitle")}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("rxResume.templateDescription")}
              </p>
            </div>
            <BaseResumeSelection
              value={baseResumeValue}
              onValueChange={onTemplateResumeChange}
              hasRxResumeAccess={hasRxResumeAccess}
              disabled={isBusy}
            />
            {isResumeReady ? (
              <div className="text-xs text-muted-foreground">
                {t("rxResume.templateOptional")}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <InlineValidation
        state={rxresumeValidation}
        successMessage={t("rxResume.verified")}
      />
    </div>
  );
};
