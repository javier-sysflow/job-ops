import { getUiLocale } from "@client/i18n/language";
import NumberFlow from "@number-flow/react";
import type { PipelineProgressState } from "@shared/types";
import { useReducedMotion } from "framer-motion";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { CircleX } from "@/components/icons";
import "slot-text/style.css";
import { SlotText } from "slot-text/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PipelineActionRequired } from "./PipelineActionRequired";
import { PipelineFanoutCard } from "./PipelineFanoutCard";
import {
  progressDetailText,
  progressMessageText,
} from "./pipelineProgressText";

const noop = () => {};

export interface PipelineProgressCardProps {
  progress: PipelineProgressState;
  elapsedSeconds?: number;
  solvingExtractor?: string | null;
  skippingExtractor?: string | null;
  onSolveChallenge?: (extractorId: string) => void;
  onSkipChallengeSearch?: (extractorId: string) => void;
  resumingScoring?: boolean;
  onResumeScoring?: () => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getPercentage = (progress: PipelineProgressState): number => {
  switch (progress.step) {
    case "challenge_required":
      return 15;
    case "crawling":
      return progress.crawlingTermsTotal > 0
        ? clamp(
            5 +
              (progress.crawlingTermsProcessed / progress.crawlingTermsTotal) *
                10,
            5,
            15,
          )
        : 5;
    case "importing":
      return 20;
    case "scoring":
      return progress.jobsDiscovered > 0
        ? clamp(
            20 + (progress.jobsScored / progress.jobsDiscovered) * 30,
            20,
            50,
          )
        : 25;
    case "processing":
      return progress.totalToProcess > 0
        ? clamp(
            50 + (progress.jobsProcessed / progress.totalToProcess) * 50,
            50,
            100,
          )
        : 55;
    case "completed":
    case "cancelled":
    case "failed":
    case "configuration_required":
      return 100;
    default:
      return 0;
  }
};

const Metric = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col gap-1 px-4 py-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <NumberFlow
      className="font-mono text-lg font-semibold tabular-nums"
      value={value}
      locales={getUiLocale()}
      isolate
    />
  </div>
);

// Stands in for the job title so the sentence can be split around it; the
// title's position differs between English and Japanese.
const TITLE_MARKER = "\u0000title\u0000";

const liveStageCopy = (
  progress: PipelineProgressState,
  t: TFunction<"pipeline">,
): { before: string; title: string; after: string; text: string } | null => {
  if (!progress.currentJob) return null;
  if (
    progress.step !== "importing" &&
    progress.step !== "scoring" &&
    progress.step !== "processing"
  ) {
    return null;
  }

  const key = `progress.live.${progress.step}` as const;
  const title = progress.currentJob.title;
  const [before = "", after = ""] = t(key, { title: TITLE_MARKER }).split(
    TITLE_MARKER,
  );
  return { before, title, after, text: t(key, { title }) };
};

const RollingStageText = ({ text }: { text: string }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span className="font-medium text-foreground" data-live-job-title="">
      {prefersReducedMotion ? (
        text
      ) : (
        <SlotText
          text={text}
          options={{
            direction: "up",
            stagger: 12,
            duration: 240,
            bounce: 0.25,
            interrupt: false,
          }}
        />
      )}
    </span>
  );
};

export const PipelineProgressCard = ({
  progress,
  elapsedSeconds,
  solvingExtractor = null,
  skippingExtractor = null,
  onSolveChallenge = () => {},
  onSkipChallengeSearch = () => {},
  resumingScoring = false,
  onResumeScoring,
}: PipelineProgressCardProps) => {
  const { t } = useTranslation("pipeline");
  if (
    progress.fanout &&
    (progress.step === "crawling" || progress.step === "challenge_required")
  ) {
    return (
      <PipelineFanoutCard
        fanout={progress.fanout}
        elapsedSeconds={elapsedSeconds ?? 0}
        activity={progressDetailText(progress) || progressMessageText(progress)}
        challenges={progress.pendingChallenges}
        solvingExtractor={solvingExtractor}
        skippingExtractor={skippingExtractor}
        onSolveChallenge={onSolveChallenge}
        onSkipChallengeSearch={onSkipChallengeSearch}
      />
    );
  }

  const percentage = getPercentage(progress);
  const remaining = Math.max(
    progress.totalToProcess - progress.jobsProcessed,
    0,
  );
  const awaitingScore = Math.max(
    progress.jobsDiscovered - progress.jobsScored,
    0,
  );
  const isScoring =
    progress.step === "scoring" || progress.step === "configuration_required";
  const stageCopy = liveStageCopy(progress, t);
  const stageText = stageCopy ? stageCopy.text : null;
  const stepLabel = t(`progress.stepLabels.${progress.step}`);
  const detailText = progressDetailText(progress);
  const showMetrics = progress.step !== "idle";
  const badgeVariant =
    progress.step === "failed"
      ? "destructive"
      : progress.step === "completed"
        ? "secondary"
        : "outline";

  return (
    <Card className="w-full max-w-6xl overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="gap-4 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle className="text-2xl tracking-tight">
              {t(`progress.stepTitles.${progress.step}`)}
            </CardTitle>
            <CardDescription
              className="overflow-hidden text-base leading-6"
              title={stageText ?? undefined}
            >
              {stageCopy ? (
                <>
                  {stageCopy.before}
                  <RollingStageText text={stageCopy.title} />
                  {stageCopy.after}
                </>
              ) : (
                progressMessageText(progress)
              )}
            </CardDescription>
            {detailText ? (
              <p className="text-xs text-muted-foreground">{detailText}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {elapsedSeconds !== undefined ? (
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {t("progress.elapsed", {
                  time: `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`,
                })}
              </span>
            ) : null}
            <Badge variant={badgeVariant}>{stepLabel}</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="self-end font-mono text-xs tabular-nums text-muted-foreground">
            {Math.round(percentage)}%
          </span>
          <Progress
            value={percentage}
            aria-label={`${stepLabel}: ${Math.round(percentage)}%`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percentage)}
          />
        </div>
      </CardHeader>

      {showMetrics || progress.error ? (
        <>
          <Separator />
          <CardContent className="flex flex-col gap-4 p-6">
            {showMetrics ? (
              <section className="grid overflow-hidden rounded-lg border divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                <Metric
                  label={t("progress.metrics.discovered")}
                  value={progress.jobsDiscovered}
                />
                <Metric
                  label={t("progress.metrics.scored")}
                  value={progress.jobsScored}
                />
                <Metric
                  label={
                    isScoring
                      ? t("progress.metrics.awaitingScore")
                      : t("progress.metrics.prepared")
                  }
                  value={isScoring ? awaitingScore : progress.jobsProcessed}
                />
                <Metric
                  label={
                    isScoring
                      ? t("progress.metrics.exceptional")
                      : t("progress.metrics.toPrepare")
                  }
                  value={isScoring ? progress.jobsExceptional : remaining}
                />
              </section>
            ) : null}

            {progress.step === "failed" && progress.error ? (
              <Alert variant="destructive">
                <CircleX />
                <AlertTitle>{t("progress.pipelineStopped")}</AlertTitle>
                <AlertDescription>{progress.error}</AlertDescription>
              </Alert>
            ) : null}

            {progress.step === "configuration_required" && progress.error ? (
              <PipelineActionRequired
                title={t("progress.llmConfigRequired")}
                description={progress.error}
                actionLabel={t("progress.restartScoring")}
                pendingLabel={t("progress.resuming")}
                pending={resumingScoring}
                onAction={onResumeScoring ?? noop}
              />
            ) : null}
          </CardContent>
        </>
      ) : null}
    </Card>
  );
};
