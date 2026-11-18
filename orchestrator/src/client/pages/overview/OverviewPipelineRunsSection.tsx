import * as api from "@client/api";
import { ListItem } from "@client/components/layout";
import { PipelineProgress } from "@client/components/PipelineProgress";
import i18n from "@client/i18n";
import { queryKeys } from "@client/lib/queryKeys";
import { sourceLabel } from "@shared/extractors";
import type { PipelineRun, PipelineRunInsights } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Clock3,
  GitCompareArrows,
  History,
  Loader2,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDateTime } from "@/lib/utils";
import {
  formatPipelineDuration,
  getPipelineRunDisplayStatus,
  getPipelineRunStatusLabel,
  type PipelineRunDisplayStatus,
} from "./pipelineRuns";

const RECENT_RUN_LIMIT = 8;

const statusBadgeClasses: Record<PipelineRunDisplayStatus, string> = {
  running: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  failed: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  cancelled: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  incomplete: "border-slate-500/30 bg-slate-500/10 text-slate-200",
};

function getDurationMs(run: PipelineRun): number | null {
  if (run.completedAt == null) return null;
  return Math.max(
    0,
    new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime(),
  );
}

function getRunReason(
  run: PipelineRun,
  displayStatus: PipelineRunDisplayStatus,
) {
  if (run.errorMessage) return run.errorMessage;
  if (displayStatus === "cancelled") {
    return i18n.t("overview:runs.reason.cancelled");
  }
  if (displayStatus === "incomplete") {
    return i18n.t("overview:runs.reason.incomplete");
  }
  return null;
}

function MetricCard(props: {
  label: string;
  value: React.ReactNode;
  hint?: string | null;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">
        {props.value}
      </div>
      {props.hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{props.hint}</div>
      ) : null}
    </div>
  );
}

function RunStatusBadge(props: { status: PipelineRunDisplayStatus }) {
  return (
    <Badge variant="outline" className={statusBadgeClasses[props.status]}>
      {getPipelineRunStatusLabel(props.status)}
    </Badge>
  );
}

function formatSourceList(sources: string[]) {
  if (sources.length === 0) return i18n.t("overview:runs.values.none");
  return sources.join(", ");
}

function formatToggleState(value: boolean) {
  return value
    ? i18n.t("overview:runs.values.enabled")
    : i18n.t("overview:runs.values.disabled");
}

function formatStageLabel(stage: string) {
  return stage.replace(/_/g, " ");
}

function RunsList(props: {
  runs: PipelineRun[];
  activeRunId: string | null;
  selectedRunId: string | null;
  onSelectRun: (runId: string) => void;
}) {
  const { t } = useTranslation("overview");
  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[minmax(0,1.6fr)_auto_auto_auto] gap-3 px-3 text-xs text-muted-foreground md:grid">
        <div>{t("runs.list.run")}</div>
        <div>{t("runs.list.status")}</div>
        <div>{t("runs.list.discovered")}</div>
        <div>{t("runs.list.processed")}</div>
      </div>

      <div className="space-y-2">
        {props.runs.map((run) => {
          const displayStatus = getPipelineRunDisplayStatus(run, {
            isActive: props.activeRunId === run.id,
          });
          const duration = formatPipelineDuration(getDurationMs(run));
          const isSelected = props.selectedRunId === run.id;

          return (
            <ListItem
              key={run.id}
              onClick={() => props.onSelectRun(run.id)}
              selected={isSelected}
              className={`grid gap-3 rounded-lg border px-3 py-3 md:grid-cols-[minmax(0,1.6fr)_auto_auto_auto] ${
                isSelected
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 hover:bg-muted/30"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {formatDateTime(run.startedAt) ?? run.startedAt}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("runs.list.runId", { id: run.id.slice(0, 8) })}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("runs.list.duration", { duration })}
                </div>
              </div>
              <div className="md:self-center">
                <RunStatusBadge status={displayStatus} />
              </div>
              <div className="md:self-center md:text-right">
                <div className="text-xs text-muted-foreground md:hidden">
                  {t("runs.list.discovered")}
                </div>
                <div className="font-medium tabular-nums">
                  {run.jobsDiscovered.toLocaleString()}
                </div>
              </div>
              <div className="md:self-center md:text-right">
                <div className="text-xs text-muted-foreground md:hidden">
                  {t("runs.list.processed")}
                </div>
                <div className="font-medium tabular-nums">
                  {run.jobsProcessed.toLocaleString()}
                </div>
              </div>
            </ListItem>
          );
        })}
      </div>
    </div>
  );
}

function RunInsightsBody(props: {
  insights: PipelineRunInsights;
  isActiveRun: boolean;
}) {
  const { t } = useTranslation("overview");
  const { run, exactMetrics, inferredMetrics } = props.insights;
  const savedDetails = props.insights.savedDetails;
  const displayStatus = getPipelineRunDisplayStatus(run, {
    isActive: props.isActiveRun,
  });
  const runReason = getRunReason(run, displayStatus);
  const inferredHint =
    inferredMetrics.jobsCreated.quality === "unavailable"
      ? t("runs.details.inferredUnavailable")
      : t("runs.details.inferredHint");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <RunStatusBadge status={displayStatus} />
        <span className="text-sm text-muted-foreground">
          {t("runs.details.started", {
            date: formatDateTime(run.startedAt) ?? run.startedAt,
          })}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard
          label={t("runs.metrics.duration")}
          value={formatPipelineDuration(exactMetrics.durationMs)}
        />
        <MetricCard
          label={t("runs.metrics.jobsDiscovered")}
          value={run.jobsDiscovered.toLocaleString()}
        />
        <MetricCard
          label={t("runs.metrics.jobsProcessed")}
          value={run.jobsProcessed.toLocaleString()}
        />
        <MetricCard
          label={t("runs.metrics.completed")}
          value={
            formatDateTime(run.completedAt) ?? t("runs.values.notRecorded")
          }
        />
      </div>

      {runReason ? (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
          <div className="font-medium">{t("runs.details.notes")}</div>
          <div className="mt-1 text-muted-foreground">{runReason}</div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="font-medium">{t("runs.details.savedSettings")}</div>
        {savedDetails ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="text-sm font-medium">
                {t("runs.details.requestedRun")}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label={t("runs.details.topN")}
                  value={savedDetails.requestedConfig.topN.toLocaleString()}
                />
                <MetricCard
                  label={t("runs.details.minSuitabilityScore")}
                  value={savedDetails.requestedConfig.minSuitabilityScore.toLocaleString()}
                />
                <MetricCard
                  label={t("runs.details.sources")}
                  value={formatSourceList(
                    savedDetails.requestedConfig.sources.map(sourceLabel),
                  )}
                />
                <MetricCard
                  label={t("runs.details.crawling")}
                  value={formatToggleState(
                    savedDetails.requestedConfig.enableCrawling,
                  )}
                />
                <MetricCard
                  label={t("runs.details.scoring")}
                  value={formatToggleState(
                    savedDetails.requestedConfig.enableScoring,
                  )}
                />
                <MetricCard
                  label={t("runs.details.importing")}
                  value={formatToggleState(
                    savedDetails.requestedConfig.enableImporting,
                  )}
                />
                <MetricCard
                  label={t("runs.details.autoTailoring")}
                  value={formatToggleState(
                    savedDetails.requestedConfig.enableAutoTailoring,
                  )}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="text-sm font-medium">
                {t("runs.details.effectiveSettings")}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label={t("runs.details.country")}
                  value={
                    savedDetails.effectiveConfig.countryLabel ??
                    t("runs.values.notRestricted")
                  }
                />
                <MetricCard
                  label={t("runs.details.cities")}
                  value={
                    savedDetails.effectiveConfig.searchCities.length > 0
                      ? savedDetails.effectiveConfig.searchCities.join(", ")
                      : t("runs.values.notRestricted")
                  }
                />
                <MetricCard
                  label={t("runs.details.workplaceTypes")}
                  value={
                    savedDetails.effectiveConfig.workplaceTypes.length > 0
                      ? savedDetails.effectiveConfig.workplaceTypes.join(", ")
                      : t("runs.values.notRestricted")
                  }
                />
                <MetricCard
                  label={t("runs.details.locationMatching")}
                  value={`${formatStageLabel(
                    savedDetails.effectiveConfig.locationSearchScope,
                  )}; ${formatStageLabel(
                    savedDetails.effectiveConfig.locationMatchStrictness,
                  )}`}
                />
                <MetricCard
                  label={t("runs.details.compatibleSources")}
                  value={formatSourceList(
                    savedDetails.effectiveConfig.compatibleSources.map(
                      sourceLabel,
                    ),
                  )}
                />
                <MetricCard
                  label={t("runs.details.skippedSources")}
                  value={
                    savedDetails.effectiveConfig.skippedSources.length > 0
                      ? savedDetails.effectiveConfig.skippedSources
                          .map((entry) => sourceLabel(entry.source))
                          .join(", ")
                      : t("runs.values.none")
                  }
                  hint={
                    savedDetails.effectiveConfig.skippedSources.length > 0
                      ? savedDetails.effectiveConfig.skippedSources
                          .map((entry) => entry.reason)
                          .join(" ")
                      : null
                  }
                />
                <MetricCard
                  label={t("runs.details.searchTerms")}
                  value={savedDetails.effectiveConfig.searchTermsCount.toLocaleString()}
                />
                <MetricCard
                  label={t("runs.details.blockedCompanyFilters")}
                  value={savedDetails.effectiveConfig.blockedCompanyKeywordsCount.toLocaleString()}
                />
                <MetricCard
                  label={t("runs.details.autoSkipThreshold")}
                  value={
                    savedDetails.effectiveConfig.autoSkipScoreThreshold == null
                      ? t("runs.values.off")
                      : savedDetails.effectiveConfig.autoSkipScoreThreshold.toLocaleString()
                  }
                />
                <MetricCard
                  label={t("runs.details.pdfRenderer")}
                  value={savedDetails.effectiveConfig.pdfRenderer}
                />
                <MetricCard
                  label={t("runs.details.sourceLimits")}
                  value={`Indeed ${savedDetails.effectiveConfig.sourceLimits.jobspyResultsWanted}; UK Visa Jobs ${savedDetails.effectiveConfig.sourceLimits.ukvisajobsMaxJobs}`}
                  hint={`Adzuna ${savedDetails.effectiveConfig.sourceLimits.adzunaMaxJobsPerTerm}; Gradcracker ${savedDetails.effectiveConfig.sourceLimits.gradcrackerMaxJobsPerTerm}; startup.jobs ${savedDetails.effectiveConfig.sourceLimits.startupjobsMaxJobsPerTerm}; Jobindex ${savedDetails.effectiveConfig.sourceLimits.jobindexMaxJobsPerTerm}`}
                />
                <MetricCard
                  label={t("runs.details.resumeProjects")}
                  value={t("runs.details.resumeProjectsMax", {
                    max: savedDetails.effectiveConfig.resumeProjects
                      .maxProjects,
                  })}
                  hint={t("runs.details.resumeProjectsHint", {
                    locked:
                      savedDetails.effectiveConfig.resumeProjects
                        .lockedProjectCount,
                    selectable:
                      savedDetails.effectiveConfig.resumeProjects
                        .aiSelectableProjectCount,
                  })}
                />
                <MetricCard
                  label={t("runs.details.models")}
                  value={savedDetails.effectiveConfig.models.scorer}
                  hint={t("runs.details.modelsHint", {
                    tailoring: savedDetails.effectiveConfig.models.tailoring,
                    projectSelection:
                      savedDetails.effectiveConfig.models.projectSelection,
                  })}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="text-sm font-medium">
                {t("runs.details.executionSummary")}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label={t("runs.details.lastRecordedStage")}
                  value={formatStageLabel(savedDetails.resultSummary.stage)}
                />
                <MetricCard
                  label={t("runs.details.jobsScored")}
                  value={
                    savedDetails.resultSummary.jobsScored == null
                      ? t("runs.values.notRecorded")
                      : savedDetails.resultSummary.jobsScored.toLocaleString()
                  }
                />
                <MetricCard
                  label={t("runs.details.jobsSelected")}
                  value={
                    savedDetails.resultSummary.jobsSelected == null
                      ? t("runs.values.notRecorded")
                      : savedDetails.resultSummary.jobsSelected.toLocaleString()
                  }
                />
                <MetricCard
                  label={t("runs.details.sourceErrors")}
                  value={savedDetails.resultSummary.sourceErrors.length.toLocaleString()}
                />
              </div>
              {savedDetails.resultSummary.sourceErrors.length > 0 ? (
                <div className="mt-3 rounded-lg border border-border/60 bg-background/40 p-3 text-sm text-muted-foreground">
                  {savedDetails.resultSummary.sourceErrors.join(" ")}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
            {t("runs.details.savedSettingsUnavailable")}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-medium">{t("runs.details.whatChanged")}</div>
          <Badge variant="outline">{t("runs.details.inferredBadge")}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{inferredHint}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label={t("runs.details.jobsCreated")}
            value={
              inferredMetrics.jobsCreated.value == null
                ? t("runs.values.notAvailable")
                : inferredMetrics.jobsCreated.value.toLocaleString()
            }
          />
          <MetricCard
            label={t("runs.details.jobsUpdated")}
            value={
              inferredMetrics.jobsUpdated.value == null
                ? t("runs.values.notAvailable")
                : inferredMetrics.jobsUpdated.value.toLocaleString()
            }
          />
          <MetricCard
            label={t("runs.metrics.jobsProcessed")}
            value={
              inferredMetrics.jobsProcessed.value == null
                ? t("runs.values.notAvailable")
                : inferredMetrics.jobsProcessed.value.toLocaleString()
            }
          />
        </div>
      </div>
    </div>
  );
}

export const OverviewPipelineRunsSection: React.FC = () => {
  const { t } = useTranslation("overview");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const pipelineStatusQuery = useQuery({
    queryKey: queryKeys.pipeline.status(),
    queryFn: api.getPipelineStatus,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });
  const pipelineRunsQuery = useQuery({
    queryKey: queryKeys.pipeline.runs(),
    queryFn: api.getPipelineRuns,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });
  const runInsightsQuery = useQuery({
    queryKey: queryKeys.pipeline.runInsights(selectedRunId ?? ""),
    queryFn: () => api.getPipelineRunInsights(selectedRunId as string),
    enabled: selectedRunId != null,
  });

  const recentRuns = useMemo(
    () => (pipelineRunsQuery.data ?? []).slice(0, RECENT_RUN_LIMIT),
    [pipelineRunsQuery.data],
  );
  const latestRun = pipelineStatusQuery.data?.lastRun ?? recentRuns[0] ?? null;
  const activeRunId = pipelineStatusQuery.data?.isRunning
    ? (latestRun?.id ?? null)
    : null;
  const currentStatus = latestRun
    ? getPipelineRunDisplayStatus(latestRun, {
        isActive: activeRunId === latestRun.id,
      })
    : null;
  const currentStatusText = pipelineStatusQuery.data?.isRunning
    ? t("runs.current.inProgress")
    : latestRun
      ? (getRunReason(latestRun, currentStatus as PipelineRunDisplayStatus) ??
        t("runs.current.latestShown"))
      : t("runs.current.noneRecorded");
  const selectedRun = useMemo(
    () =>
      (pipelineRunsQuery.data ?? []).find((run) => run.id === selectedRunId) ??
      (latestRun?.id === selectedRunId ? latestRun : null),
    [latestRun, pipelineRunsQuery.data, selectedRunId],
  );

  const isLoading =
    pipelineStatusQuery.isLoading ||
    pipelineRunsQuery.isLoading ||
    (selectedRunId != null && runInsightsQuery.isLoading);
  const error =
    pipelineStatusQuery.error ??
    pipelineRunsQuery.error ??
    runInsightsQuery.error;
  const statusError = pipelineStatusQuery.error;
  const runsError = pipelineRunsQuery.error;

  return (
    <>
      <Card className="border-border/60 bg-card shadow-none">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <CardTitle>{t("runs.title")}</CardTitle>
              </div>
              <CardDescription>{t("runs.description")}</CardDescription>
            </div>
            {currentStatus ? <RunStatusBadge status={currentStatus} /> : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {pipelineStatusQuery.data?.isRunning ? (
            <PipelineProgress isRunning />
          ) : null}

          {isLoading && !latestRun && recentRuns.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("runs.current.loading")}</span>
            </div>
          ) : null}

          {error && !latestRun && recentRuns.length === 0 ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : t("runs.current.loadError")}
            </div>
          ) : null}

          {latestRun ? (
            <>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>{t("runs.current.heading")}</span>
                  </div>
                  {statusError ? (
                    <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                      {t("runs.current.liveUnavailable")}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {currentStatus ? (
                      <RunStatusBadge status={currentStatus} />
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      {currentStatusText}
                    </span>
                  </div>
                  {pipelineStatusQuery.data?.nextScheduledRun ? (
                    <div className="mt-3 text-xs text-muted-foreground">
                      {t("runs.current.nextScheduled", {
                        date:
                          formatDateTime(
                            pipelineStatusQuery.data.nextScheduledRun,
                          ) ?? pipelineStatusQuery.data.nextScheduledRun,
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label={t("runs.current.lastRun")}
                    value={
                      formatDateTime(latestRun.startedAt) ?? latestRun.startedAt
                    }
                  />
                  <MetricCard
                    label={t("runs.metrics.duration")}
                    value={formatPipelineDuration(getDurationMs(latestRun))}
                  />
                  <MetricCard
                    label={t("runs.metrics.jobsDiscovered")}
                    value={latestRun.jobsDiscovered.toLocaleString()}
                  />
                  <MetricCard
                    label={t("runs.metrics.jobsProcessed")}
                    value={latestRun.jobsProcessed.toLocaleString()}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  <div className="font-medium">
                    {t("runs.current.recentRuns")}
                  </div>
                </div>
                {runsError ? (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    {t("runs.current.recentRefreshError")}
                  </div>
                ) : null}
                <RunsList
                  runs={recentRuns}
                  activeRunId={activeRunId}
                  selectedRunId={selectedRunId}
                  onSelectRun={setSelectedRunId}
                />
              </div>
            </>
          ) : null}

          {!isLoading && !error && !latestRun ? (
            <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
              <div className="font-medium">{t("runs.current.emptyTitle")}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t("runs.current.emptyDescription")}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Sheet
        open={selectedRunId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedRunId(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-2xl"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-4 w-4" />
              {t("runs.details.title")}
            </SheetTitle>
            <SheetDescription>
              {selectedRun
                ? t("runs.details.descriptionForRun", {
                    id: selectedRun.id.slice(0, 8),
                  })
                : t("runs.details.descriptionSelected")}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {runInsightsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("runs.details.loading")}</span>
              </div>
            ) : null}

            {runInsightsQuery.error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {runInsightsQuery.error instanceof Error
                  ? runInsightsQuery.error.message
                  : t("runs.details.loadError")}
              </div>
            ) : null}

            {runInsightsQuery.data ? (
              <RunInsightsBody
                insights={runInsightsQuery.data}
                isActiveRun={activeRunId === runInsightsQuery.data.run.id}
              />
            ) : null}

            {!runInsightsQuery.isLoading &&
            !runInsightsQuery.error &&
            selectedRunId != null &&
            !runInsightsQuery.data ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>{t("runs.details.unavailableTitle")}</span>
                </div>
                <div className="mt-2">
                  {t("runs.details.unavailableDescription")}
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
