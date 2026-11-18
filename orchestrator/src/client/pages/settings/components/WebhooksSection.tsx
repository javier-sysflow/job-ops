import { SettingsInput } from "@client/pages/settings/components/SettingsInput";
import { SettingsSectionFrame } from "@client/pages/settings/components/SettingsSectionFrame";
import type { WebhookValues } from "@client/pages/settings/types";
import { formatSecretHint } from "@client/pages/settings/utils";
import type { UpdateSettingsInput } from "@shared/settings-schema.js";
import type React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";

type WebhooksSectionProps = {
  pipelineWebhook: WebhookValues;
  jobCompleteWebhook: WebhookValues;
  webhookSecretHint: string | null;
  isLoading: boolean;
  isSaving: boolean;
  layoutMode?: "accordion" | "panel";
};

export const WebhooksSection: React.FC<WebhooksSectionProps> = ({
  pipelineWebhook,
  jobCompleteWebhook,
  webhookSecretHint,
  isLoading,
  isSaving,
  layoutMode,
}) => {
  const { t } = useTranslation("settings");
  const {
    register,
    formState: { errors },
  } = useFormContext<UpdateSettingsInput>();

  return (
    <SettingsSectionFrame
      mode={layoutMode}
      title={t("webhooks.title")}
      value="webhooks"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="text-sm font-medium">
            {t("webhooks.pipelineStatus")}
          </div>
          <SettingsInput
            label={t("webhooks.url")}
            inputProps={register("pipelineWebhookUrl")}
            placeholder={pipelineWebhook.default || "https://..."}
            disabled={isLoading || isSaving}
            error={errors.pipelineWebhookUrl?.message as string | undefined}
            helper={t("webhooks.pipelineHelper", {
              value: pipelineWebhook.default || "—",
            })}
            current={pipelineWebhook.effective || "—"}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="text-sm font-medium">
            {t("webhooks.jobCompletion")}
          </div>
          <div className="space-y-4">
            <SettingsInput
              label={t("webhooks.url")}
              inputProps={register("jobCompleteWebhookUrl")}
              placeholder={jobCompleteWebhook.default || "https://..."}
              disabled={isLoading || isSaving}
              error={
                errors.jobCompleteWebhookUrl?.message as string | undefined
              }
              helper={t("webhooks.jobCompleteHelper", {
                value: jobCompleteWebhook.default || "—",
              })}
              current={jobCompleteWebhook.effective || "—"}
            />

            <SettingsInput
              label={t("webhooks.secret")}
              inputProps={register("webhookSecret")}
              type="password"
              placeholder={t("webhooks.secretPlaceholder")}
              disabled={isLoading || isSaving}
              error={errors.webhookSecret?.message as string | undefined}
              helper={t("webhooks.secretHelper")}
              current={formatSecretHint(webhookSecretHint)}
            />
          </div>
        </div>
      </div>
    </SettingsSectionFrame>
  );
};
