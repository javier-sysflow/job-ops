import i18n from "@client/i18n";
import type { PipelineRun } from "@shared/types";

export type PipelineRunDisplayStatus = PipelineRun["status"] | "incomplete";

export function getPipelineRunDisplayStatus(
  run: PipelineRun,
  options?: { isActive?: boolean },
): PipelineRunDisplayStatus {
  if (options?.isActive && run.status === "running") {
    return "running";
  }

  if (run.status === "running" && run.completedAt == null) {
    return "incomplete";
  }

  return run.status;
}

export function getPipelineRunStatusLabel(
  status: PipelineRunDisplayStatus,
): string {
  switch (status) {
    case "running":
      return i18n.t("overview:runs.status.running");
    case "completed":
      return i18n.t("overview:runs.status.completed");
    case "failed":
      return i18n.t("overview:runs.status.failed");
    case "cancelled":
      return i18n.t("overview:runs.status.cancelled");
    case "incomplete":
      return i18n.t("overview:runs.status.incomplete");
  }
}

export function formatPipelineDuration(durationMs: number | null): string {
  if (durationMs == null) return "—";

  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return i18n.t("overview:runs.duration.hoursMinutes", { hours, minutes });
  }
  if (minutes > 0) {
    return i18n.t("overview:runs.duration.minutesSeconds", {
      minutes,
      seconds,
    });
  }
  return i18n.t("overview:runs.duration.seconds", { seconds });
}
