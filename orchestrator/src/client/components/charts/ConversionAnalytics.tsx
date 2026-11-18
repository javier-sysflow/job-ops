/**
 * Conversion Analytics
 * Shows Application → Response conversion metrics including funnel, time-series, and insights.
 */

import { formatDate } from "@client/i18n/format";
import { getEffectiveStageHistory } from "@shared/stage-history";
import type { StageEvent } from "@shared/types.js";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ChartKpiPanel } from "./ChartKpiPanel";

type FunnelStage = {
  name: string;
  value: number;
  fill: string;
};

type ConversionDataPoint = {
  date: string;
  conversionRate: number;
  appliedCount: number;
  convertedCount: number;
};

type JobWithEvents = {
  id: string;
  datePosted: string | null;
  discoveredAt: string;
  appliedAt: string | null;
  events: StageEvent[];
};

// Stage definitions for funnel
const FUNNEL_STAGES = [
  { key: "applied", color: "#3b82f6" },
  { key: "screening", color: "#8b5cf6" },
  { key: "interview", color: "#f59e0b" },
  { key: "offer", color: "#10b981" },
  { key: "rejected", color: "#ef4444" },
] as const;

type FunnelStageKey = (typeof FUNNEL_STAGES)[number]["key"];

// Stages that count as "screening"
const SCREENING_STAGES = new Set(["recruiter_screen", "assessment"]);

// Stages that count as "interview" (for funnel display)
const INTERVIEW_STAGES = new Set([
  "hiring_manager_screen",
  "technical_interview",
  "onsite",
]);

// Stages that count as conversion (any positive response from company)
const CONVERSION_STAGES = new Set([
  "recruiter_screen",
  "assessment",
  "hiring_manager_screen",
  "technical_interview",
  "onsite",
  "offer",
]);

// Stages that count as "offer"
const OFFER_STAGES = new Set(["offer"]);

const isRejectedEvent = (event: StageEvent) =>
  event.outcome === "rejected" || event.metadata?.reasonCode === "rejected";

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Build funnel data from jobs with their stage events
const buildFunnelData = (
  jobsWithEvents: JobWithEvents[],
  labels: Record<FunnelStageKey, string>,
): FunnelStage[] => {
  let applied = 0;
  let screening = 0;
  let interview = 0;
  let offer = 0;
  let rejected = 0;

  for (const job of jobsWithEvents) {
    if (!job.appliedAt) continue;
    applied++;

    const reachedStages = new Set<string>();
    for (const event of job.events) {
      reachedStages.add(event.toStage);
    }

    // Check if reached screening
    for (const stage of SCREENING_STAGES) {
      if (reachedStages.has(stage)) {
        screening++;
        break;
      }
    }

    // Check if reached interview
    for (const stage of INTERVIEW_STAGES) {
      if (reachedStages.has(stage)) {
        interview++;
        break;
      }
    }

    // Check if reached offer
    for (const stage of OFFER_STAGES) {
      if (reachedStages.has(stage)) {
        offer++;
        break;
      }
    }

    const reachedRejected = job.events.some(isRejectedEvent);
    if (reachedRejected) {
      rejected++;
    }
  }

  return [
    { name: labels.applied, value: applied, fill: FUNNEL_STAGES[0].color },
    { name: labels.screening, value: screening, fill: FUNNEL_STAGES[1].color },
    { name: labels.interview, value: interview, fill: FUNNEL_STAGES[2].color },
    { name: labels.offer, value: offer, fill: FUNNEL_STAGES[3].color },
    { name: labels.rejected, value: rejected, fill: FUNNEL_STAGES[4].color },
  ];
};

// Build conversion rate time-series data
const buildConversionTimeSeries = (
  jobsWithEvents: JobWithEvents[],
  daysToShow: number,
): ConversionDataPoint[] => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (daysToShow - 1));
  start.setHours(0, 0, 0, 0);

  // Group jobs by application date
  const jobsByDate = new Map<string, JobWithEvents[]>();

  for (const job of jobsWithEvents) {
    if (!job.appliedAt) continue;
    const date = new Date(job.appliedAt);
    if (Number.isNaN(date.getTime())) continue;
    if (date < start || date > end) continue;

    const key = toDateKey(date);
    const list = jobsByDate.get(key) ?? [];
    list.push(job);
    jobsByDate.set(key, list);
  }

  // Build time series with rolling conversion rate
  const data: ConversionDataPoint[] = [];
  const rollingWindow = Math.min(7, daysToShow); // 7-day rolling average, capped by daysToShow

  for (
    let day = new Date(start);
    day <= end;
    day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
  ) {
    const key = toDateKey(day);

    // Calculate rolling window range
    const windowStart = new Date(day);
    windowStart.setDate(windowStart.getDate() - rollingWindow + 1);

    let appliedCount = 0;
    let convertedCount = 0;

    // Sum up jobs in the rolling window
    for (
      let windowDay = new Date(windowStart);
      windowDay <= day;
      windowDay = new Date(
        windowDay.getFullYear(),
        windowDay.getMonth(),
        windowDay.getDate() + 1,
      )
    ) {
      const windowKey = toDateKey(windowDay);
      const jobs = jobsByDate.get(windowKey) ?? [];

      for (const job of jobs) {
        appliedCount++;

        // Check if reached any conversion stage
        const reachedConversion = job.events.some((event) =>
          CONVERSION_STAGES.has(event.toStage),
        );
        if (reachedConversion) {
          convertedCount++;
        }
      }
    }

    const conversionRate =
      appliedCount > 0 ? (convertedCount / appliedCount) * 100 : 0;

    data.push({
      date: key,
      conversionRate,
      appliedCount,
      convertedCount,
    });
  }

  return data;
};

// Calculate overall conversion rate
const calculateOverallConversion = (
  jobsWithEvents: JobWithEvents[],
): { rate: number; total: number; converted: number } => {
  let total = 0;
  let converted = 0;

  for (const job of jobsWithEvents) {
    if (!job.appliedAt) continue;
    total++;

    const reachedConversion = job.events.some((event) =>
      CONVERSION_STAGES.has(event.toStage),
    );
    if (reachedConversion) {
      converted++;
    }
  }

  const rate = total > 0 ? (converted / total) * 100 : 0;
  return { rate, total, converted };
};

interface ConversionAnalyticsProps {
  jobsWithEvents: JobWithEvents[];
  error: string | null;
  daysToShow: number;
}

export function ConversionAnalytics({
  jobsWithEvents,
  error,
  daysToShow,
}: ConversionAnalyticsProps) {
  const { t } = useTranslation("overview");
  const chartConfig = {
    conversionRate: {
      label: t("conversion.rateLabel"),
      color: "var(--chart-1)",
    },
  };
  const effectiveJobs = useMemo(
    () =>
      jobsWithEvents.map((job) => ({
        ...job,
        events: getEffectiveStageHistory(job.events),
      })),
    [jobsWithEvents],
  );

  const funnelData = useMemo(() => {
    return buildFunnelData(effectiveJobs, {
      applied: t("funnel.applied"),
      screening: t("funnel.screening"),
      interview: t("funnel.interview"),
      offer: t("funnel.offer"),
      rejected: t("funnel.rejected"),
    });
  }, [effectiveJobs, t]);

  const conversionTimeSeries = useMemo(() => {
    return buildConversionTimeSeries(effectiveJobs, daysToShow);
  }, [effectiveJobs, daysToShow]);

  const overallConversion = useMemo(() => {
    return calculateOverallConversion(effectiveJobs);
  }, [effectiveJobs]);

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col gap-2 border-b !p-0 sm:flex-row sm:items-stretch">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>{t("conversion.title")}</CardTitle>
          <CardDescription>{t("conversion.description")}</CardDescription>
        </div>
        <ChartKpiPanel
          label={t("conversion.rateLabel")}
          rate={overallConversion.rate}
          subtext={t("conversion.subtext", {
            converted: overallConversion.converted,
            total: overallConversion.total,
          })}
        />
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {error ? (
          <div className="px-4 py-6 text-sm text-destructive">{error}</div>
        ) : (
          <div className="space-y-6">
            {/* Funnel Chart */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                {t("conversion.funnelTitle")}
              </h4>
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[200px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelData}
                    layout="vertical"
                    margin={{ left: 60, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--chart-1)", opacity: 0.3 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload as FunnelStage;
                        return (
                          <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs shadow-sm">
                            <div className="font-medium">{data.name}</div>
                            <div className="mt-1 text-muted-foreground">
                              {t("conversion.funnelTooltip", {
                                value: data.value,
                              })}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {funnelData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        className="text-xs fill-foreground"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Time Series Chart */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t("conversion.timeSeriesTitle", {
                    days: Math.min(7, daysToShow),
                  })}
                </h4>
              </div>
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[200px] w-full"
              >
                <LineChart
                  data={conversionTimeSeries}
                  margin={{ left: 12, right: 12, top: 5, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) =>
                      formatDate(value, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    domain={[0, "auto"]}
                  />
                  <ChartTooltip
                    cursor={{ fill: "var(--chart-1)", opacity: 0.3 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload as ConversionDataPoint;
                      return (
                        <div className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs shadow-sm">
                          <div className="mb-2 text-[11px] font-medium text-muted-foreground">
                            {formatDate(label as string, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">
                                {t("conversion.rateLabel")}
                              </span>
                              <span className="font-semibold text-foreground">
                                {data.conversionRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">
                                {t("conversion.tooltipApplied", {
                                  days: Math.min(7, daysToShow),
                                })}
                              </span>
                              <span className="font-semibold text-foreground">
                                {data.appliedCount}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">
                                {t("conversion.tooltipConverted")}
                              </span>
                              <span className="font-semibold text-foreground">
                                {data.convertedCount}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversionRate"
                    stroke="var(--color-conversionRate)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
