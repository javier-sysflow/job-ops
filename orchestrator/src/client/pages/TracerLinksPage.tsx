import * as api from "@client/api";
import { PageHeader, PageMain, SectionCard } from "@client/components/layout";
import i18n from "@client/i18n";
import { formatDate, formatDateTime, formatTime } from "@client/i18n/format";
import type {
  JobTracerLinkAnalyticsItem,
  TracerAnalyticsResponse,
  TracerAnalyticsTopJob,
} from "@shared/types.js";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Copy, ExternalLink, Loader2 } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { queryKeys } from "@/client/lib/queryKeys";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bucketClicks, bucketCount, trackProductEvent } from "@/lib/analytics";
import { copyTextToClipboard } from "@/lib/utils";

function formatUnixTimestamp(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";
  return formatDateTime(value * 1000, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}

function formatRecentActivity(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";
  const date = new Date(value * 1000);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const timeText = formatTime(date, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (date >= today) return i18n.t("tracer:time.today", { time: timeText });
  if (date >= yesterday) {
    return i18n.t("tracer:time.yesterday", { time: timeText });
  }
  return formatDate(date, {
    month: "short",
    day: "numeric",
  });
}

function toUnixStartOfDay(value: string): number | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return Math.floor(date.getTime() / 1000);
}

function toUnixEndOfDay(value: string): number | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59`);
  if (Number.isNaN(date.getTime())) return undefined;
  return Math.floor(date.getTime() / 1000);
}

function formatDayLabel(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return formatDate(date, {
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return i18n.t("tracer:time.noActivity");
  }
  const diffSeconds = Math.max(0, Math.floor(Date.now() / 1000) - value);
  if (diffSeconds < 60) return i18n.t("tracer:time.justNow");
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return i18n.t("tracer:time.minutesAgo", { count: diffMinutes });
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return i18n.t("tracer:time.hoursAgo", { count: diffHours });
  }
  const diffDays = Math.floor(diffHours / 24);
  return i18n.t("tracer:time.daysAgo", { count: diffDays });
}

export const TracerLinksPage: React.FC = () => {
  const { t } = useTranslation("tracer");
  const chartConfig = {
    clicks: {
      label: t("chart.series"),
      color: "var(--chart-1)",
    },
  };
  const [selectedDrilldownJobId, setSelectedDrilldownJobId] = useState<
    string | null
  >(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [includeBots, setIncludeBots] = useState(false);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [drilldownMode, setDrilldownMode] = useState<"human" | "all">("human");

  const query = useMemo(
    () => ({
      from: toUnixStartOfDay(fromDate),
      to: toUnixEndOfDay(toDate),
      includeBots,
      limit: 20,
    }),
    [fromDate, toDate, includeBots],
  );

  const analyticsQuery = useQuery<TracerAnalyticsResponse>({
    queryKey: queryKeys.tracer.analytics(query),
    queryFn: () => api.getTracerAnalytics(query),
  });
  const analytics = analyticsQuery.data ?? null;
  const isLoading = analyticsQuery.isPending;

  const jobDrilldownQuery = useQuery({
    queryKey: queryKeys.tracer.jobLinks(selectedDrilldownJobId ?? "", {
      from: query.from,
      to: query.to,
      includeBots,
    }),
    queryFn: () =>
      api.getJobTracerLinks(selectedDrilldownJobId ?? "", {
        from: query.from,
        to: query.to,
        includeBots,
      }),
    enabled: Boolean(isDrilldownOpen && selectedDrilldownJobId),
  });
  const jobDrilldown = jobDrilldownQuery.data ?? null;
  const isDrilldownLoading =
    jobDrilldownQuery.isPending || jobDrilldownQuery.isFetching;
  const error =
    analyticsQuery.error instanceof Error
      ? analyticsQuery.error.message
      : jobDrilldownQuery.error instanceof Error
        ? jobDrilldownQuery.error.message
        : null;

  const chartData = analytics?.timeSeries ?? [];
  const totalViews = analytics?.totals.clicks ?? 0;
  const humanClicks = analytics?.totals.humanClicks ?? 0;
  const uniqueJobsReached = useMemo(() => {
    if (!analytics) return 0;
    const jobIds = new Set(analytics.topJobs.map((job) => job.jobId));
    if (jobIds.size > 0) return jobIds.size;
    for (const row of analytics.topLinks) {
      jobIds.add(row.jobId);
    }
    return jobIds.size;
  }, [analytics]);

  const visibleDays = useMemo(() => {
    if (query.from && query.to && query.to >= query.from) {
      const secondsPerDay = 24 * 60 * 60;
      return Math.floor((query.to - query.from) / secondsPerDay) + 1;
    }
    return chartData.length > 0 ? chartData.length : 30;
  }, [chartData.length, query.from, query.to]);

  const selectedJobId = jobDrilldown?.job.id ?? null;
  const drilldownGroupedLinks = useMemo(() => {
    if (!jobDrilldown) {
      return { active: [], inactive: [] } as const;
    }

    const hasActivity = (row: JobTracerLinkAnalyticsItem) =>
      drilldownMode === "human" ? row.humanClicks > 0 : row.clicks > 0;
    const uniqueOpens = (row: JobTracerLinkAnalyticsItem) =>
      drilldownMode === "human" ? row.humanClicks : row.uniqueOpens;

    const active = jobDrilldown.links.filter(hasActivity).sort((a, b) => {
      const lastClickDelta = (b.lastClickedAt ?? 0) - (a.lastClickedAt ?? 0);
      if (lastClickDelta !== 0) return lastClickDelta;
      const uniqueDelta = uniqueOpens(b) - uniqueOpens(a);
      if (uniqueDelta !== 0) return uniqueDelta;
      return b.humanClicks - a.humanClicks;
    });

    const inactive = jobDrilldown.links
      .filter((row) => !hasActivity(row))
      .sort((a, b) => a.destinationUrl.localeCompare(b.destinationUrl));

    return { active, inactive } as const;
  }, [drilldownMode, jobDrilldown]);
  const drilldownSummary = useMemo(() => {
    if (!jobDrilldown) return null;
    const rows = jobDrilldown.links;
    const humanClicks = rows.reduce((total, row) => total + row.humanClicks, 0);
    const totalClicks = rows.reduce(
      (total, row) =>
        total + (drilldownMode === "human" ? row.humanClicks : row.clicks),
      0,
    );
    const lastActivityAt = rows.reduce<number | null>((latest, row) => {
      const count = drilldownMode === "human" ? row.humanClicks : row.clicks;
      if (count <= 0 || row.lastClickedAt === null) return latest;
      if (latest === null || row.lastClickedAt > latest)
        return row.lastClickedAt;
      return latest;
    }, null);
    return { humanClicks, totalClicks, lastActivityAt };
  }, [drilldownMode, jobDrilldown]);

  const handleCopyDestination = async (
    destinationUrl: string,
    isActiveLink: boolean,
  ) => {
    try {
      await copyTextToClipboard(destinationUrl);
      trackProductEvent("tracer_destination_copied", {
        drilldown_mode: drilldownMode,
        is_active_link: isActiveLink,
      });
      toast.success(t("toasts.linkCopied"));
    } catch {
      toast.error(t("toasts.copyFailed"));
    }
  };
  const getRowClicks = (row: JobTracerLinkAnalyticsItem) =>
    drilldownMode === "human" ? row.humanClicks : row.clicks;

  const getDateRangeDaysBucket = () => {
    if (!query.from || !query.to || query.to < query.from) return "unset";
    const secondsPerDay = 24 * 60 * 60;
    const days = Math.floor((query.to - query.from) / secondsPerDay) + 1;
    return bucketCount(days);
  };

  const trackFiltersApplied = () => {
    trackProductEvent("tracer_filters_applied", {
      include_bots: includeBots,
      has_from: Boolean(fromDate),
      has_to: Boolean(toDate),
      date_range_days_bucket: getDateRangeDaysBucket(),
    });
  };

  const handleSelectTopJob = (job: TracerAnalyticsTopJob, rank: number) => {
    trackProductEvent("tracer_drilldown_opened", {
      rank,
      human_clicks_bucket: bucketClicks(job.humanClicks),
      total_clicks_bucket: bucketClicks(job.clicks),
    });
    setSelectedDrilldownJobId(job.jobId);
    setIsDrilldownOpen(true);
  };

  const handleSetDrilldownMode = (mode: "human" | "all") => {
    if (drilldownMode === mode) return;
    setDrilldownMode(mode);
    trackProductEvent("tracer_drilldown_mode_changed", {
      mode,
    });
  };

  return (
    <>
      <PageHeader
        icon={BarChart3}
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />

      <PageMain>
        <SectionCard className="p-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="filters" className="border-none">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="text-sm font-semibold">
                  {t("filters.title")}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="space-y-1">
                    <Label htmlFor="tracer-from-date">
                      {t("filters.fromDate")}
                    </Label>
                    <Input
                      id="tracer-from-date"
                      type="date"
                      value={fromDate}
                      onChange={(event) => setFromDate(event.target.value)}
                      onBlur={trackFiltersApplied}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tracer-to-date">
                      {t("filters.toDate")}
                    </Label>
                    <Input
                      id="tracer-to-date"
                      type="date"
                      value={toDate}
                      onChange={(event) => setToDate(event.target.value)}
                      onBlur={trackFiltersApplied}
                    />
                  </div>
                  <label
                    htmlFor="tracer-include-bots"
                    className="flex cursor-pointer items-end gap-2 pb-2"
                  >
                    <Checkbox
                      id="tracer-include-bots"
                      checked={includeBots}
                      onCheckedChange={(checked) => {
                        setIncludeBots(Boolean(checked));
                        trackProductEvent("tracer_filters_applied", {
                          include_bots: Boolean(checked),
                          has_from: Boolean(fromDate),
                          has_to: Boolean(toDate),
                          date_range_days_bucket: getDateRangeDaysBucket(),
                        });
                      }}
                    />
                    <span className="text-sm">{t("filters.includeBots")}</span>
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SectionCard>

        {error && (
          <SectionCard>
            <p className="text-sm text-destructive">{error}</p>
          </SectionCard>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <SectionCard className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("stats.totalViews")}
            </p>
            <p className="text-3xl font-semibold tabular-nums">
              {totalViews.toLocaleString()}
            </p>
          </SectionCard>
          <SectionCard className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("stats.uniqueJobsReached")}
            </p>
            <p className="text-3xl font-semibold tabular-nums">
              {uniqueJobsReached.toLocaleString()}
            </p>
          </SectionCard>
          <SectionCard className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("stats.humanClicks")}
            </p>
            <p className="text-3xl font-semibold tabular-nums">
              {humanClicks.toLocaleString()}
            </p>
          </SectionCard>
        </div>

        <SectionCard className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">
                {t("chart.title", { days: visibleDays })}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("chart.description")}
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex h-[240px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("chart.loading")}
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tickFormatter={(value) => formatDayLabel(String(value))}
                />
                <YAxis axisLine={false} tickLine={false} width={30} />
                <ChartTooltip
                  cursor={{ fill: "var(--color-clicks)", opacity: 0.18 }}
                  content={
                    <ChartTooltipContent
                      nameKey="clicks"
                      labelFormatter={(value) => formatDayLabel(String(value))}
                    />
                  }
                />
                <Bar
                  dataKey="clicks"
                  fill="var(--color-clicks)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </SectionCard>

        <SectionCard>
          <div className="mb-3">
            <h3 className="text-sm font-semibold">{t("activity.title")}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("activity.job")}</TableHead>
                <TableHead className="w-[90px]">
                  {t("activity.clicks")}
                </TableHead>
                <TableHead className="w-[140px]">
                  {t("activity.lastActive")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(analytics?.topJobs ?? []).map((row, index) => (
                <TableRow
                  key={row.jobId}
                  className="cursor-pointer"
                  data-state={
                    selectedJobId === row.jobId ? "selected" : undefined
                  }
                  onClick={() => handleSelectTopJob(row, index + 1)}
                >
                  <TableCell>
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.employer}
                    </div>
                  </TableCell>
                  <TableCell>{row.clicks}</TableCell>
                  <TableCell>
                    {formatRecentActivity(row.lastClickedAt)}
                  </TableCell>
                </TableRow>
              ))}
              {(analytics?.topJobs.length ?? 0) === 0 && !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-sm text-muted-foreground"
                  >
                    {t("activity.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </SectionCard>

        <Dialog open={isDrilldownOpen} onOpenChange={setIsDrilldownOpen}>
          <DialogContent className="max-h-[80vh] max-w-3xl overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                {jobDrilldown
                  ? t("drilldown.titleWithJob", {
                      title: jobDrilldown.job.title,
                    })
                  : t("drilldown.title")}
              </DialogTitle>
              <DialogDescription>
                {t("drilldown.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 overflow-y-auto pr-1">
              {isDrilldownLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("drilldown.loading")}
                </div>
              ) : jobDrilldown ? (
                <>
                  <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                    <div className="grid gap-2 text-xs sm:grid-cols-3">
                      <p>
                        {t("drilldown.humanClicks")}{" "}
                        <span className="font-semibold tabular-nums">
                          {drilldownSummary?.humanClicks ?? 0}
                        </span>
                      </p>
                      <p>
                        {t("drilldown.totalClicks")}{" "}
                        <span className="font-semibold tabular-nums">
                          {drilldownSummary?.totalClicks ?? 0}
                        </span>
                      </p>
                      <p>
                        {t("drilldown.lastActivity")}{" "}
                        <span className="font-semibold">
                          {formatRelativeTime(
                            drilldownSummary?.lastActivityAt ?? null,
                          )}
                        </span>
                      </p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          drilldownMode === "human" ? "default" : "outline"
                        }
                        onClick={() => handleSetDrilldownMode("human")}
                      >
                        {t("drilldown.humanOnly")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          drilldownMode === "all" ? "default" : "outline"
                        }
                        onClick={() => handleSetDrilldownMode("all")}
                      >
                        {t("drilldown.humanAndBots")}
                      </Button>
                    </div>
                  </div>
                  {drilldownGroupedLinks.active.map((row) => (
                    <div
                      key={row.tracerLinkId}
                      className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm">{row.destinationUrl}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t("drilldown.lastClick", {
                            date: formatUnixTimestamp(row.lastClickedAt),
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold tabular-nums">
                          {t("drilldown.rowClicks", {
                            value: getRowClicks(row),
                          })}
                        </p>
                        <a
                          href={row.destinationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex"
                          onClick={() =>
                            trackProductEvent("tracer_external_link_opened", {
                              origin: "drilldown",
                              drilldown_mode: drilldownMode,
                            })
                          }
                        >
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            void handleCopyDestination(row.destinationUrl, true)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {drilldownGroupedLinks.inactive.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="inactive-links">
                        <AccordionTrigger className="py-2 text-sm hover:no-underline">
                          {t("drilldown.inactiveLinks", {
                            value: drilldownGroupedLinks.inactive.length,
                          })}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pt-1">
                          {drilldownGroupedLinks.inactive.map((row) => (
                            <div
                              key={row.tracerLinkId}
                              className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm">
                                  {row.destinationUrl}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {t("drilldown.lastClick", {
                                    date: formatUnixTimestamp(
                                      row.lastClickedAt,
                                    ),
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold tabular-nums">
                                  {t("drilldown.rowClicks", {
                                    value: getRowClicks(row),
                                  })}
                                </p>
                                <a
                                  href={row.destinationUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex"
                                  onClick={() =>
                                    trackProductEvent(
                                      "tracer_external_link_opened",
                                      {
                                        origin: "drilldown",
                                        drilldown_mode: drilldownMode,
                                      },
                                    )
                                  }
                                >
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    void handleCopyDestination(
                                      row.destinationUrl,
                                      false,
                                    )
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                  {jobDrilldown.links.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {t("drilldown.noLinks")}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("drilldown.selectJob")}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </PageMain>
    </>
  );
};
