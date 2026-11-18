import { BaseResumeSelection } from "@client/pages/settings/components/BaseResumeSelection";
import { SettingsInput } from "@client/pages/settings/components/SettingsInput";
import {
  toggleAiSelectable,
  toggleMustInclude,
} from "@client/pages/settings/resume-projects-state";
import type { ResumeProjectsSettingsInput } from "@shared/settings-schema.js";
import {
  PDF_PAPER_SIZE_VALUES,
  PDF_RENDERER_VALUES,
  type PdfPaperSize,
  type PdfRenderer,
  type ResumeProjectCatalogItem,
  TYPST_THEME_LABELS,
  TYPST_THEME_VALUES,
  type TypstTheme,
} from "@shared/types.js";
import type { TFunction } from "i18next";
import { AlertCircle, AlertTriangle } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clampInt } from "@/lib/utils";
import { StatusIndicator } from "./StatusIndicator";

type VersionValidationState = {
  checked: boolean;
  valid: boolean;
  message?: string | null;
  status?: number | null;
};

type ProjectSelectionConfig = {
  baseResumeId: string | null;
  onBaseResumeIdChange: (value: string | null) => void;
  projects: ResumeProjectCatalogItem[];
  value: ResumeProjectsSettingsInput | null | undefined;
  onChange: (next: ResumeProjectsSettingsInput) => void;
  lockedCount: number;
  maxProjectsTotal: number;
  isProjectsLoading: boolean;
  disabled: boolean;
  maxProjectsError?: string;
};

type ReactiveResumeConfigPanelProps = {
  pdfRenderer: PdfRenderer;
  onPdfRendererChange: (renderer: PdfRenderer) => void;
  pdfRendererError?: string;
  typstTheme: TypstTheme;
  onTypstThemeChange: (theme: TypstTheme) => void;
  typstThemeError?: string;
  pdfPaperSize: PdfPaperSize;
  onPdfPaperSizeChange: (paperSize: PdfPaperSize) => void;
  pdfPaperSizeError?: string;
  disabled?: boolean;
  hasRxResumeAccess?: boolean;
  showValidationStatus?: boolean;
  validationStatus?: VersionValidationState;
  intro?: {
    title: string;
    description?: string;
  };
  v5: {
    apiKey: string;
    onApiKeyChange: (value: string) => void;
    error?: string;
    helper?: string;
    placeholder?: string;
  };
  shared: {
    baseUrl: string;
    onBaseUrlChange: (value: string) => void;
    baseUrlError?: string;
    baseUrlHelper?: string;
    baseUrlPlaceholder?: string;
  };
  projectSelection?: ProjectSelectionConfig;
};

function renderStatusPill(
  label: string,
  state: VersionValidationState,
  t: TFunction<"settings">,
) {
  const statusLabel = state.checked
    ? state.valid
      ? t("rxresume.statusConnected")
      : t("rxresume.statusFailed")
    : t("rxresume.statusNotTested");
  const dotColor = state.checked
    ? state.valid
      ? "bg-emerald-500"
      : "bg-destructive"
    : "bg-muted-foreground";

  return (
    <StatusIndicator
      label={t("rxresume.statusPill", { label, status: statusLabel })}
      dotColor={dotColor}
      tooltip={
        state.checked && !state.valid && state.message
          ? state.message
          : undefined
      }
    />
  );
}

function isAvailabilityWarning(state?: VersionValidationState): boolean {
  const status = state?.status ?? null;
  return status === 0 || (typeof status === "number" && status >= 500);
}

export const ReactiveResumeConfigPanel: React.FC<
  ReactiveResumeConfigPanelProps
> = ({
  pdfRenderer,
  onPdfRendererChange,
  pdfRendererError,
  typstTheme,
  onTypstThemeChange,
  typstThemeError,
  pdfPaperSize,
  onPdfPaperSizeChange,
  pdfPaperSizeError,
  disabled = false,
  hasRxResumeAccess = false,
  showValidationStatus = false,
  validationStatus,
  intro,
  shared,
  v5,
  projectSelection,
}) => {
  const { t } = useTranslation("settings");
  const typstThemeLabel = (value: TypstTheme) =>
    t(`rxresume.typstThemes.${value}`, {
      defaultValue: TYPST_THEME_LABELS[value],
    });
  const hasProjectCatalog = Boolean(projectSelection?.projects.length);
  const canShowProjectSelection = Boolean(
    projectSelection && (hasRxResumeAccess || hasProjectCatalog),
  );
  const selectedValidationStatus = validationStatus;
  const showInlineValidationAlert = Boolean(
    selectedValidationStatus?.checked &&
      !selectedValidationStatus.valid &&
      selectedValidationStatus.message,
  );
  const selectedValidationIsWarning =
    showInlineValidationAlert &&
    isAvailabilityWarning(selectedValidationStatus);

  return (
    <div className="space-y-4">
      {intro ? (
        <div>
          <p className="text-sm font-semibold">{intro.title}</p>
          {intro.description ? (
            <p className="text-xs text-muted-foreground">{intro.description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="pdfRenderer" className="text-sm font-medium">
          {t("rxresume.pdfRenderer")}
        </label>
        <Select
          value={pdfRenderer}
          onValueChange={(value) => onPdfRendererChange(value as PdfRenderer)}
          disabled={disabled}
        >
          <SelectTrigger id="pdfRenderer">
            <SelectValue placeholder={t("rxresume.pdfRendererPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {PDF_RENDERER_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`rxresume.renderers.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pdfRendererError ? (
          <p className="text-xs text-destructive">{pdfRendererError}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {t(`rxresume.rendererHelp.${pdfRenderer}`)}
        </p>
      </div>

      {pdfRenderer === "typst" ? (
        <div className="space-y-2">
          <label htmlFor="typstTheme" className="text-sm font-medium">
            {t("rxresume.typstTheme")}
          </label>
          <Select
            value={typstTheme}
            onValueChange={(value) => onTypstThemeChange(value as TypstTheme)}
            disabled={disabled}
          >
            <SelectTrigger id="typstTheme">
              <SelectValue placeholder={t("rxresume.typstThemePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {TYPST_THEME_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {typstThemeLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {typstThemeError ? (
            <p className="text-xs text-destructive">{typstThemeError}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {t("rxresume.typstThemeHelp")}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="pdfPaperSize" className="text-sm font-medium">
          {t("rxresume.paperSize")}
        </label>
        <Select
          value={pdfPaperSize}
          onValueChange={(value) => onPdfPaperSizeChange(value as PdfPaperSize)}
          disabled={disabled}
        >
          <SelectTrigger id="pdfPaperSize">
            <SelectValue placeholder={t("rxresume.paperSizePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {PDF_PAPER_SIZE_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`rxresume.paperSizes.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {pdfPaperSizeError ? (
          <p className="text-xs text-destructive">{pdfPaperSizeError}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {t(`rxresume.paperDefaultHelp.${pdfRenderer}`)}
        </p>
      </div>

      {showValidationStatus && selectedValidationStatus ? (
        <div className="flex flex-wrap items-center gap-2 text-xs w-full justify-between">
          {renderStatusPill(
            t("rxresume.v5Status"),
            selectedValidationStatus,
            t,
          )}
        </div>
      ) : null}

      {showInlineValidationAlert && selectedValidationStatus?.message ? (
        <Alert
          variant={selectedValidationIsWarning ? "warning" : "destructive"}
        >
          {selectedValidationIsWarning ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {selectedValidationIsWarning
              ? t("rxresume.apiWarning")
              : t("rxresume.apiError")}
          </AlertTitle>
          <AlertDescription>
            {selectedValidationStatus.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {
        <div className="grid gap-4">
          <SettingsInput
            label={t("rxresume.urlLabel")}
            inputProps={{
              name: "rxresumeUrl",
              value: shared.baseUrl,
              onChange: (event) =>
                shared.onBaseUrlChange(event.currentTarget.value),
            }}
            type="url"
            placeholder={
              shared.baseUrlPlaceholder ?? "https://resume.example.com"
            }
            helper={shared.baseUrlHelper ?? t("rxresume.urlHelper")}
            disabled={disabled}
            error={shared.baseUrlError}
          />
          <SettingsInput
            label={t("rxresume.apiKeyLabel")}
            inputProps={{
              name: "rxresumeApiKey",
              value: v5.apiKey,
              onChange: (event) => v5.onApiKeyChange(event.currentTarget.value),
            }}
            type="password"
            placeholder={v5.placeholder ?? t("rxresume.apiKeyPlaceholder")}
            helper={v5.helper}
            disabled={disabled}
            error={v5.error}
          />
        </div>
      }

      {projectSelection ? (
        <>
          <Separator />

          {!canShowProjectSelection ? (
            <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {t("rxresume.noProjects")}
            </div>
          ) : (
            <div className="space-y-4">
              {hasRxResumeAccess ? (
                <BaseResumeSelection
                  value={projectSelection.baseResumeId}
                  onValueChange={projectSelection.onBaseResumeIdChange}
                  hasRxResumeAccess={hasRxResumeAccess}
                  disabled={projectSelection.disabled}
                />
              ) : null}

              {projectSelection.isProjectsLoading ? (
                <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  {t("rxresume.loadingProjects")}
                </div>
              ) : hasRxResumeAccess &&
                !projectSelection.baseResumeId &&
                !hasProjectCatalog ? (
                <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  {t("rxresume.choosePdf")}
                </div>
              ) : !hasProjectCatalog ? (
                <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  {t("rxresume.noProjects")}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {t("rxresume.maxProjects")}
                    </div>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={projectSelection.lockedCount}
                      max={projectSelection.maxProjectsTotal}
                      value={projectSelection.value?.maxProjects ?? 0}
                      onChange={(event) => {
                        if (!projectSelection.value) return;
                        const next = Number(event.target.value);
                        const clamped = clampInt(
                          next,
                          projectSelection.lockedCount,
                          projectSelection.maxProjectsTotal,
                        );
                        projectSelection.onChange({
                          ...projectSelection.value,
                          maxProjects: clamped,
                        });
                      }}
                      disabled={
                        projectSelection.disabled ||
                        projectSelection.isProjectsLoading ||
                        !projectSelection.value
                      }
                    />
                    {projectSelection.maxProjectsError ? (
                      <p className="text-xs text-destructive">
                        {projectSelection.maxProjectsError}
                      </p>
                    ) : null}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs whitespace-wrap sm:whitespace-nowrap">
                          {t("rxresume.project")}
                        </TableHead>
                        <TableHead className="text-xs whitespace-wrap sm:whitespace-nowrap">
                          {t("rxresume.visibleInTemplate")}
                        </TableHead>
                        <TableHead className="text-xs whitespace-wrap sm:whitespace-nowrap">
                          {t("rxresume.mustInclude")}
                        </TableHead>
                        <TableHead className="text-xs whitespace-wrap sm:whitespace-nowrap">
                          {t("rxresume.aiCanSelect")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {projectSelection.projects.map((project) => {
                        const value = projectSelection.value;
                        const locked = Boolean(
                          value?.lockedProjectIds.includes(project.id),
                        );
                        const aiSelectable = Boolean(
                          value?.aiSelectableProjectIds.includes(project.id),
                        );
                        const projectMeta = project.date;

                        return (
                          <TableRow key={project.id}>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div className="font-medium">
                                  {project.name}
                                </div>
                                {projectMeta ? (
                                  <div className="text-xs text-muted-foreground">
                                    {projectMeta}
                                  </div>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              {project.isVisibleInBase
                                ? t("shared.yes")
                                : t("shared.no")}
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                checked={locked}
                                onCheckedChange={() => {
                                  if (!value) return;
                                  projectSelection.onChange(
                                    toggleMustInclude({
                                      settings: value,
                                      projectId: project.id,
                                      checked: !locked,
                                      maxProjectsTotal:
                                        projectSelection.maxProjectsTotal,
                                    }),
                                  );
                                }}
                                disabled={
                                  projectSelection.disabled ||
                                  projectSelection.isProjectsLoading ||
                                  !value
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                checked={locked ? true : aiSelectable}
                                onCheckedChange={() => {
                                  if (!value) return;
                                  projectSelection.onChange(
                                    toggleAiSelectable({
                                      settings: value,
                                      projectId: project.id,
                                      checked: !aiSelectable,
                                    }),
                                  );
                                }}
                                disabled={
                                  projectSelection.disabled ||
                                  projectSelection.isProjectsLoading ||
                                  locked ||
                                  !value
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
