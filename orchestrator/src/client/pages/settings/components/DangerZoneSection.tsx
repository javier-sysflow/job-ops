import { SettingsSectionFrame } from "@client/pages/settings/components/SettingsSectionFrame";
import { ALL_JOB_STATUSES } from "@client/pages/settings/constants";
import type { JobStatus } from "@shared/types";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Trash2 } from "@/components/icons";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type DangerZoneSectionProps = {
  statusesToClear: JobStatus[];
  toggleStatusToClear: (status: JobStatus) => void;
  handleClearByStatuses: () => void;
  handleClearDatabase?: () => void;
  handleClearByScore?: (threshold: number) => void;
  isLoading: boolean;
  isSaving: boolean;
  layoutMode?: "accordion" | "panel";
};

export const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({
  statusesToClear,
  toggleStatusToClear,
  handleClearByStatuses,
  handleClearDatabase,
  handleClearByScore,
  isLoading,
  isSaving,
  layoutMode,
}) => {
  const { t } = useTranslation(["settings", "common"]);
  const statusName = (status: JobStatus) => t(`danger.statusNames.${status}`);
  const [scoreThreshold, setScoreThreshold] = useState<string>("");
  const parsedThreshold = parseInt(scoreThreshold, 10);
  const isValidThreshold =
    !Number.isNaN(parsedThreshold) &&
    parsedThreshold >= 0 &&
    parsedThreshold <= 100;
  return (
    <SettingsSectionFrame
      mode={layoutMode}
      tone="danger"
      title={
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-base font-semibold tracking-wider">
            {t("danger.title")}
          </span>
        </div>
      }
      value="danger-zone"
    >
      <div className="space-y-4 pt-2">
        <div className="p-3 rounded-md space-y-4">
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-destructive">
              {t("danger.byStatusTitle")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("danger.byStatusHelp")}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_JOB_STATUSES.map((status) => {
              const isSelected = statusesToClear.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatusToClear(status)}
                  disabled={isLoading || isSaving}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "border-destructive bg-destructive/10"
                      : "border-border"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-destructive"
                        : "border-muted-foreground"
                    }`}
                  >
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </div>
                  <div className="grid gap-0.5">
                    <span className="text-sm font-medium capitalize">
                      {statusName(status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t(`danger.statusDescriptions.${status}`)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isLoading || isSaving || statusesToClear.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("danger.clearSelected", {
                  number: statusesToClear.length,
                })}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("danger.byStatusConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("danger.byStatusConfirmDescription", {
                    statuses: statusesToClear
                      .map(statusName)
                      .join(t("shared.listSeparator")),
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("common:actions.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearByStatuses}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("danger.clearStatuses", {
                    count: statusesToClear.length,
                  })}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Separator />

        {/* Clear Jobs Below Score */}
        {handleClearByScore && (
          <div className="p-3 rounded-md space-y-4">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-destructive">
                {t("danger.byScoreTitle")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("danger.byScoreHelp")}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="score-threshold"
                  className="text-sm font-medium mb-1.5 block"
                >
                  {t("danger.thresholdLabel")}
                </label>
                <Input
                  id="score-threshold"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  step={1}
                  placeholder={t("danger.thresholdPlaceholder")}
                  value={scoreThreshold}
                  onChange={(e) => setScoreThreshold(e.target.value)}
                  disabled={isLoading || isSaving}
                  className="w-full"
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="default"
                    disabled={isLoading || isSaving || !isValidThreshold}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("danger.clearBelow", {
                      threshold: isValidThreshold ? parsedThreshold : "...",
                    })}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("danger.byScoreConfirmTitle", {
                        threshold: parsedThreshold,
                      })}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("danger.byScoreConfirmDescription", {
                        threshold: parsedThreshold,
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("common:actions.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (isValidThreshold) {
                          handleClearByScore(parsedThreshold);
                          setScoreThreshold("");
                        }
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("danger.clearJobs")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {handleClearDatabase && (
          <>
            <Separator />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-3 rounded-md">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-destructive">
                  {t("danger.databaseTitle")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("danger.databaseHelp")}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isLoading || isSaving}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("danger.clearDatabaseButton")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("danger.databaseConfirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("danger.databaseConfirmDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("common:actions.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearDatabase}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("danger.clearDatabaseConfirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </div>
    </SettingsSectionFrame>
  );
};
