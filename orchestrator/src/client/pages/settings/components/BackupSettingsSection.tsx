import { EmptyState, ListItem, ListPanel } from "@client/components/layout";
import { formatDateTime, isJapaneseUi } from "@client/i18n/format";
import { SettingsInput } from "@client/pages/settings/components/SettingsInput";
import { SettingsSectionFrame } from "@client/pages/settings/components/SettingsSectionFrame";
import type { BackupValues } from "@client/pages/settings/types";
import type { UpdateSettingsInput } from "@shared/settings-schema.js";
import type { BackupInfo } from "@shared/types.js";
import { Archive, Clock, Trash2 } from "lucide-react";
import type React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

type BackupSettingsSectionProps = {
  values: BackupValues;
  backups: BackupInfo[];
  nextScheduled: string | null;
  isLoading: boolean;
  isSaving: boolean;
  onCreateBackup: () => void;
  onDeleteBackup: (filename: string) => void;
  isCreatingBackup: boolean;
  isDeletingBackup: boolean;
  layoutMode?: "accordion" | "panel";
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const BACKUP_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZoneName: "short",
};

const formatBackupDate = (dateString: string): string => {
  // English keeps its original US-style backup timestamps; Japanese uses
  // the locale-aware formatter with a 24-hour clock.
  if (isJapaneseUi()) {
    return formatDateTime(dateString, {
      ...BACKUP_DATE_OPTIONS,
      hour12: false,
    });
  }
  const date = new Date(dateString);
  return date.toLocaleString("en-US", BACKUP_DATE_OPTIONS); // i18n-ignore
};

export const BackupSettingsSection: React.FC<BackupSettingsSectionProps> = ({
  values,
  backups,
  nextScheduled,
  isLoading,
  isSaving,
  onCreateBackup,
  onDeleteBackup,
  isCreatingBackup,
  isDeletingBackup,
  layoutMode,
}) => {
  const { t } = useTranslation("settings");
  const { backupEnabled, backupHour, backupMaxCount } = values;
  const { control, watch } = useFormContext<UpdateSettingsInput>();
  const yesNo = (value: boolean) => (value ? t("shared.yes") : t("shared.no"));

  // Watch the current form value to conditionally show/hide fields
  const currentBackupEnabled = watch("backupEnabled") ?? backupEnabled.default;

  return (
    <SettingsSectionFrame
      mode={layoutMode}
      title={t("backup.title")}
      value="backup"
    >
      <div className="space-y-6">
        <div className="flex items-start space-x-3">
          <Controller
            name="backupEnabled"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="backupEnabled"
                checked={field.value ?? backupEnabled.default}
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
              htmlFor="backupEnabled"
              className="cursor-pointer text-sm font-medium leading-none"
            >
              {t("backup.enableLabel")}
            </label>
            <p className="text-xs text-muted-foreground">
              {t("backup.enableHelp")}
            </p>
          </div>
        </div>

        {currentBackupEnabled && (
          <div className="grid gap-6 pl-7 md:grid-cols-2">
            <Controller
              name="backupHour"
              control={control}
              render={({ field }) => (
                <SettingsInput
                  label={t("backup.hourLabel")}
                  type="number"
                  inputProps={{
                    ...field,
                    inputMode: "numeric",
                    min: 0,
                    max: 23,
                    value: field.value ?? backupHour.default,
                    onChange: (event) => {
                      const value = parseInt(event.target.value, 10);
                      if (Number.isNaN(value)) {
                        field.onChange(null);
                      } else {
                        field.onChange(Math.min(23, Math.max(0, value)));
                      }
                    },
                  }}
                  disabled={isLoading || isSaving}
                  helper={t("backup.hourHelper", { hour: backupHour.default })}
                  current={t("backup.hourCurrent", {
                    effective: backupHour.effective,
                    default: backupHour.default,
                  })}
                />
              )}
            />

            <Controller
              name="backupMaxCount"
              control={control}
              render={({ field }) => (
                <SettingsInput
                  label={t("backup.maxCountLabel")}
                  type="number"
                  inputProps={{
                    ...field,
                    inputMode: "numeric",
                    min: 1,
                    max: 5,
                    value: field.value ?? backupMaxCount.default,
                    onChange: (event) => {
                      const value = parseInt(event.target.value, 10);
                      if (Number.isNaN(value)) {
                        field.onChange(null);
                      } else {
                        field.onChange(Math.min(5, Math.max(1, value)));
                      }
                    },
                  }}
                  disabled={isLoading || isSaving}
                  helper={t("backup.maxCountHelper", {
                    value: backupMaxCount.default,
                  })}
                  current={t("shared.effectiveDefault", {
                    effective: backupMaxCount.effective,
                    default: backupMaxCount.default,
                  })}
                />
              )}
            />
          </div>
        )}

        {currentBackupEnabled && nextScheduled && (
          <div className="flex items-center gap-2 pl-7 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {t("backup.nextScheduled", {
                date: formatBackupDate(nextScheduled),
              })}
            </span>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{t("backup.history")}</div>
            <Button
              size="sm"
              onClick={onCreateBackup}
              disabled={isLoading || isCreatingBackup || isDeletingBackup}
            >
              {isCreatingBackup ? t("backup.creating") : t("backup.createNow")}
            </Button>
          </div>

          <ListPanel
            header={
              <div className="flex items-center justify-between text-sm">
                <span>{t("backup.count", { count: backups.length })}</span>
              </div>
            }
          >
            {backups.length === 0 ? (
              <EmptyState
                icon={Archive}
                title={t("backup.emptyTitle")}
                description={t("backup.emptyDescription")}
              />
            ) : (
              backups.map((backup) => (
                <ListItem
                  key={backup.filename}
                  className="flex items-center justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Archive className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {backup.filename}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatBackupDate(backup.createdAt)} ·{" "}
                        {formatFileSize(backup.size)}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant={backup.type === "auto" ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {backup.type === "auto"
                        ? t("backup.typeAuto")
                        : t("backup.typeManual")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteBackup(backup.filename)}
                      disabled={isDeletingBackup || isCreatingBackup}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </ListItem>
              ))
            )}
          </ListPanel>
        </div>

        <Separator />

        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted-foreground">
              {t("backup.enabled")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("shared.effectiveDefault", {
                effective: yesNo(backupEnabled.effective),
                default: yesNo(backupEnabled.default),
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("backup.hour")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("backup.hourCurrent", {
                effective: backupHour.effective,
                default: backupHour.default,
              })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              {t("backup.maxCount")}
            </div>
            <div className="break-words font-mono text-xs">
              {t("shared.effectiveDefault", {
                effective: backupMaxCount.effective,
                default: backupMaxCount.default,
              })}
            </div>
          </div>
        </div>
      </div>
    </SettingsSectionFrame>
  );
};
