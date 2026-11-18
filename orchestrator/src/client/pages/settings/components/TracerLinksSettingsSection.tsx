import { formatDateTime, isJapaneseUi } from "@client/i18n/format";
import { SettingsSectionFrame } from "@client/pages/settings/components/SettingsSectionFrame";
import type { TracerReadinessResponse } from "@shared/types";
import type { TFunction } from "i18next";
import type React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TracerLinksSettingsSectionProps = {
  readiness: TracerReadinessResponse | null;
  isLoading: boolean;
  isChecking: boolean;
  onVerifyNow: () => void | Promise<void>;
  layoutMode?: "accordion" | "panel";
};

const STALE_AFTER_MS = 15 * 60_000;

function formatLastChecked(
  value: number | null,
  t: TFunction<"settings">,
): string {
  if (!value) return t("tracer.never");
  const date = new Date(value);
  return isJapaneseUi() ? formatDateTime(date) : date.toLocaleString();
}

function deriveStatus(
  readiness: TracerReadinessResponse | null,
  isChecking: boolean,
  t: TFunction<"settings">,
): {
  label: string;
  className: string;
  icon: React.ReactNode;
} {
  if (isChecking) {
    return {
      label: t("tracer.checking"),
      className: "border-blue-300 text-blue-700",
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    };
  }

  if (!readiness) {
    return {
      label: t("tracer.notConfigured"),
      className: "border-muted text-muted-foreground",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    };
  }

  const ageMs = Date.now() - readiness.checkedAt;
  if (ageMs > STALE_AFTER_MS) {
    return {
      label: t("tracer.stale"),
      className: "border-amber-300 text-amber-700",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    };
  }

  if (readiness.status === "ready") {
    return {
      label: t("tracer.ready"),
      className: "border-emerald-300 text-emerald-700",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    };
  }

  if (readiness.status === "unavailable") {
    return {
      label: t("tracer.unavailable"),
      className: "border-destructive/40 text-destructive",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
    };
  }

  return {
    label: t("tracer.notConfigured"),
    className: "border-muted text-muted-foreground",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  };
}

export const TracerLinksSettingsSection: React.FC<
  TracerLinksSettingsSectionProps
> = ({ readiness, isLoading, isChecking, onVerifyNow, layoutMode }) => {
  const { t } = useTranslation("settings");
  const statusUi = deriveStatus(readiness, isChecking, t);
  const publicBaseUrl = readiness?.publicBaseUrl ?? null;
  const checkTimestamp = readiness?.checkedAt ?? null;

  return (
    <SettingsSectionFrame
      mode={layoutMode}
      title={t("tracer.title")}
      value="tracer-links"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center gap-2 text-sm">
            {statusUi.icon}
            <span className="font-medium">{t("tracer.readiness")}</span>
          </div>
          <Badge variant="outline" className={statusUi.className}>
            {statusUi.label}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">
            {t("tracer.publicUrl")}
          </div>
          <div className="rounded-md border border-border/60 bg-background px-3 py-2 font-mono text-xs">
            {publicBaseUrl ?? t("tracer.notConfigured")}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {t("tracer.lastChecked", {
            time: formatLastChecked(checkTimestamp, t),
          })}
        </div>

        {readiness?.reason ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {readiness.reason}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{t("tracer.hint")}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void onVerifyNow()}
            disabled={isLoading || isChecking}
          >
            {isChecking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {t("tracer.verifyNow")}
          </Button>
        </div>
      </div>
    </SettingsSectionFrame>
  );
};
