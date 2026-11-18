import { logger } from "@infra/logger";
import { getPrivateDataScope } from "@server/tenancy/private-scope";
import type {
  PipelineFanoutProgress,
  PipelinePendingChallenge,
  PipelineProgressCurrentJob,
  PipelineProgressState,
  PipelineProgressStep,
} from "@shared/types";

/**
 * Pipeline progress tracking with Server-Sent Events.
 */

export type PipelineStep = PipelineProgressStep;

export type PendingChallenge = PipelinePendingChallenge;

export type CrawlSource = string;

export type PipelineProgress = PipelineProgressState;

// Event emitter for progress updates
type ProgressListener = (progress: PipelineProgress) => void;
const listenersByTenant = new Map<string, Set<ProgressListener>>();

/** UI translation keys for progress text (client namespace "pipeline"). */
const MESSAGE_KEY_PREFIX = "pipeline:progress.messages.";
const DETAIL_KEY_PREFIX = "pipeline:progress.details.";

type ProgressTextParams = Record<string, string | number>;

function messageText(
  key: string,
  params?: ProgressTextParams,
): Pick<PipelineProgress, "messageKey" | "messageParams"> {
  return {
    messageKey: `${MESSAGE_KEY_PREFIX}${key}`,
    ...(params ? { messageParams: params } : {}),
  };
}

function detailText(
  key: string,
  params?: ProgressTextParams,
): Pick<PipelineProgress, "detailKey" | "detailParams"> {
  return {
    detailKey: `${DETAIL_KEY_PREFIX}${key}`,
    ...(params ? { detailParams: params } : {}),
  };
}

function createIdleProgress(): PipelineProgress {
  return {
    step: "idle",
    message: "Ready",
    ...messageText("ready"),
    crawlingSource: null,
    crawlingSourcesCompleted: 0,
    crawlingSourcesTotal: 0,
    crawlingTermsProcessed: 0,
    crawlingTermsTotal: 0,
    crawlingListPagesProcessed: 0,
    crawlingListPagesTotal: 0,
    crawlingJobCardsFound: 0,
    crawlingJobPagesEnqueued: 0,
    crawlingJobPagesSkipped: 0,
    crawlingJobPagesProcessed: 0,
    jobsDiscovered: 0,
    jobsScored: 0,
    jobsExceptional: 0,
    jobsProcessed: 0,
    totalToProcess: 0,
  };
}

const currentProgressByTenant = new Map<string, PipelineProgress>();

const currentSourceStatsByTenant = new Map<
  string,
  Map<CrawlSource, SourceCrawlingStats>
>();

type FanoutUnitState = "queued" | "running" | "complete" | "check";
type FanoutTask = {
  states: FanoutUnitState[];
  unitsPerRole: number;
  completedTerms: number;
  termProgressStarted: boolean;
};
type FanoutTracker = {
  roles: string[];
  tasks: Map<string, FanoutTask>;
  locations: string[];
  sources: string[];
  locationCount: number;
  sourceCount: number;
  capacity: number;
  results: number;
  unique: number;
};
const fanoutTrackersByTenant = new Map<string, FanoutTracker>();

function getProgressScopeKey(): string {
  return getPrivateDataScope().scopeKey;
}

function getCurrentProgressForTenant(tenantId: string): PipelineProgress {
  const current = currentProgressByTenant.get(tenantId);
  if (current) return current;
  const idle = createIdleProgress();
  currentProgressByTenant.set(tenantId, idle);
  return idle;
}

function getCurrentSourceStatsForTenant(
  tenantId: string,
): Map<CrawlSource, SourceCrawlingStats> {
  let stats = currentSourceStatsByTenant.get(tenantId);
  if (!stats) {
    stats = new Map<CrawlSource, SourceCrawlingStats>();
    currentSourceStatsByTenant.set(tenantId, stats);
  }
  return stats;
}

let currentProgress: PipelineProgress = {
  step: "idle",
  message: "Ready",
  ...messageText("ready"),
  crawlingSource: null,
  crawlingSourcesCompleted: 0,
  crawlingSourcesTotal: 0,
  crawlingTermsProcessed: 0,
  crawlingTermsTotal: 0,
  crawlingListPagesProcessed: 0,
  crawlingListPagesTotal: 0,
  crawlingJobCardsFound: 0,
  crawlingJobPagesEnqueued: 0,
  crawlingJobPagesSkipped: 0,
  crawlingJobPagesProcessed: 0,
  jobsDiscovered: 0,
  jobsScored: 0,
  jobsExceptional: 0,
  jobsProcessed: 0,
  totalToProcess: 0,
};

const emptyCrawlingStats = {
  crawlingTermsProcessed: 0,
  crawlingTermsTotal: 0,
  crawlingListPagesProcessed: 0,
  crawlingListPagesTotal: 0,
  crawlingJobCardsFound: 0,
  crawlingJobPagesEnqueued: 0,
  crawlingJobPagesSkipped: 0,
  crawlingJobPagesProcessed: 0,
  crawlingPhase: undefined,
  crawlingCurrentUrl: undefined,
};

type SourceCrawlingStats = {
  termsProcessed: number;
  termsTotal: number;
  listPagesProcessed: number;
  listPagesTotal: number;
  jobCardsFound: number;
  jobPagesEnqueued: number;
  jobPagesSkipped: number;
  jobPagesProcessed: number;
};

const emptySourceCrawlingStats = (): SourceCrawlingStats => ({
  termsProcessed: 0,
  termsTotal: 0,
  listPagesProcessed: 0,
  listPagesTotal: 0,
  jobCardsFound: 0,
  jobPagesEnqueued: 0,
  jobPagesSkipped: 0,
  jobPagesProcessed: 0,
});

function aggregateCrawlingStats(tenantId = getProgressScopeKey()) {
  const crawlingStatsBySource = getCurrentSourceStatsForTenant(tenantId);
  let termsProcessed = 0;
  let termsTotal = 0;
  let listPagesProcessed = 0;
  let listPagesTotal = 0;
  let jobCardsFound = 0;
  let jobPagesEnqueued = 0;
  let jobPagesSkipped = 0;
  let jobPagesProcessed = 0;

  for (const stats of crawlingStatsBySource.values()) {
    termsProcessed += stats.termsProcessed;
    termsTotal += stats.termsTotal;
    listPagesProcessed += stats.listPagesProcessed;
    listPagesTotal += stats.listPagesTotal;
    jobCardsFound += stats.jobCardsFound;
    jobPagesEnqueued += stats.jobPagesEnqueued;
    jobPagesSkipped += stats.jobPagesSkipped;
    jobPagesProcessed += stats.jobPagesProcessed;
  }

  return {
    termsProcessed,
    termsTotal,
    listPagesProcessed,
    listPagesTotal,
    jobCardsFound,
    jobPagesEnqueued,
    jobPagesSkipped,
    jobPagesProcessed,
  };
}

function buildFanoutProgress(tracker: FanoutTracker): PipelineFanoutProgress {
  const roles = tracker.roles.map((role, index) => {
    const states = [...tracker.tasks.values()].flatMap((task) =>
      task.states.slice(
        index * task.unitsPerRole,
        (index + 1) * task.unitsPerRole,
      ),
    );
    return {
      role,
      complete: states.filter((state) => state === "complete").length,
      running: states.filter((state) => state === "running").length,
      queued: states.filter((state) => state === "queued").length,
      check: states.filter((state) => state === "check").length,
    };
  });
  return {
    termCount: tracker.roles.length,
    locationCount: tracker.locationCount,
    sourceCount: tracker.sourceCount,
    locations: tracker.locations,
    sources: tracker.sources,
    total: roles.reduce(
      (sum, role) =>
        sum + role.complete + role.running + role.queued + role.check,
      0,
    ),
    capacity: tracker.capacity,
    results: tracker.results,
    unique: tracker.unique,
    roles,
  };
}

function emitFanout(tracker: FanoutTracker): void {
  updateProgress({ fanout: buildFanoutProgress(tracker) });
}

function getFanoutTracker(): FanoutTracker | undefined {
  return fanoutTrackersByTenant.get(getProgressScopeKey());
}

/**
 * Update the current progress and notify all listeners.
 */
export function updateProgress(update: Partial<PipelineProgress>): void {
  const tenantId = getProgressScopeKey();
  const next: PipelineProgress = {
    ...getCurrentProgressForTenant(tenantId),
    ...update,
  };
  // New text without a translation key (or a key without params) must not
  // keep the previous key/params, or the UI would show stale translated text.
  if ("message" in update && !("messageKey" in update)) delete next.messageKey;
  if ("message" in update && !("messageParams" in update)) {
    delete next.messageParams;
  }
  if ("detail" in update && !("detailKey" in update)) delete next.detailKey;
  if ("detail" in update && !("detailParams" in update)) {
    delete next.detailParams;
  }
  currentProgress = next;
  currentProgressByTenant.set(tenantId, currentProgress);

  // Notify all listeners
  for (const listener of listenersByTenant.get(tenantId) ?? []) {
    try {
      listener(currentProgress);
    } catch (error) {
      logger.error("Error in progress listener", error);
    }
  }
}

/**
 * Get the current progress state.
 */
export function getProgress(): PipelineProgress {
  return { ...getCurrentProgressForTenant(getProgressScopeKey()) };
}

/**
 * Subscribe to progress updates.
 */
export function subscribeToProgress(listener: ProgressListener): () => void {
  const tenantId = getProgressScopeKey();
  const listeners = listenersByTenant.get(tenantId) ?? new Set();
  listenersByTenant.set(tenantId, listeners);
  listeners.add(listener);

  // Send current state immediately
  listener(getCurrentProgressForTenant(tenantId));

  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Reset progress to idle state.
 */
export function resetProgress(): void {
  const tenantId = getProgressScopeKey();
  currentSourceStatsByTenant.set(tenantId, new Map());
  fanoutTrackersByTenant.delete(tenantId);
  currentProgress = createIdleProgress();
  currentProgressByTenant.set(tenantId, currentProgress);
}

/**
 * Helper to create progress updates for each step.
 */
export const progressHelpers = {
  initializeFanout: (options: {
    roles: string[];
    tasks: Array<{ id: string; unitsPerRole: number }>;
    locations: string[];
    sources: string[];
    locationCount: number;
    sourceCount: number;
    capacity: number;
  }) => {
    const tracker: FanoutTracker = {
      roles: options.roles,
      tasks: new Map(
        options.tasks.map((task) => [
          task.id,
          {
            unitsPerRole: task.unitsPerRole,
            completedTerms: 0,
            termProgressStarted: false,
            states: Array.from(
              { length: options.roles.length * task.unitsPerRole },
              () => "queued" as const,
            ),
          },
        ]),
      ),
      locations: options.locations,
      sources: options.sources,
      locationCount: options.locationCount,
      sourceCount: options.sourceCount,
      capacity: options.capacity,
      results: 0,
      unique: 0,
    };
    fanoutTrackersByTenant.set(getProgressScopeKey(), tracker);
    emitFanout(tracker);
  },

  startFanoutTask: (taskId: string) => {
    const tracker = getFanoutTracker();
    const task = tracker?.tasks.get(taskId);
    if (!tracker || !task) return;
    if (
      !task.termProgressStarted &&
      task.states.every((state) => state === "queued")
    ) {
      task.states = task.states.map(() => "running" as const);
    } else {
      task.states = task.states.map((state) =>
        state === "check" ? "running" : state,
      );
    }
    emitFanout(tracker);
  },

  updateFanoutTaskTerms: (
    taskId: string,
    role: string,
    termsProcessed: number,
    termsTotal?: number,
  ) => {
    const tracker = getFanoutTracker();
    const task = tracker?.tasks.get(taskId);
    if (!tracker || !task) return;
    const roleIndex = tracker.roles.indexOf(role);
    if (roleIndex < 0) return;
    if (!task.termProgressStarted) {
      task.states.fill("queued");
      task.termProgressStarted = true;
    }
    const total = Math.max(1, termsTotal ?? tracker.roles.length);
    const processed = Math.max(0, Math.min(total, termsProcessed));
    const unitsPerTerm = Math.max(1, Math.round(task.states.length / total));
    const roleStart = roleIndex * task.unitsPerRole;
    const roleEnd = roleStart + task.unitsPerRole;
    const roleStates = task.states.slice(roleStart, roleEnd);
    if (processed > task.completedTerms) {
      let remaining = (processed - task.completedTerms) * unitsPerTerm;
      for (
        let index = 0;
        index < roleStates.length && remaining > 0;
        index += 1
      ) {
        if (roleStates[index] === "complete") continue;
        task.states[roleStart + index] = "complete";
        remaining -= 1;
      }
      task.completedTerms = processed;
    } else if (
      processed === task.completedTerms &&
      !roleStates.includes("running")
    ) {
      let remaining = unitsPerTerm;
      for (
        let index = 0;
        index < roleStates.length && remaining > 0;
        index += 1
      ) {
        if (roleStates[index] !== "queued") continue;
        task.states[roleStart + index] = "running";
        remaining -= 1;
      }
    }
    emitFanout(tracker);
  },

  settleFanoutTask: (taskId: string, state: "complete" | "check") => {
    const tracker = getFanoutTracker();
    const task = tracker?.tasks.get(taskId);
    if (!tracker || !task) return;
    if (state === "complete") {
      task.states.fill("complete");
    } else {
      task.states = task.states.map((unit) =>
        unit === "running" || (!task.termProgressStarted && unit === "queued")
          ? "check"
          : unit,
      );
    }
    emitFanout(tracker);
  },

  updateFanoutResults: (results: number, unique: number) => {
    const tracker = getFanoutTracker();
    if (!tracker) return;
    tracker.results = results;
    tracker.unique = unique;
    emitFanout(tracker);
  },

  startCrawling: (sourcesTotal = 0, preserveStartedAt = false) =>
    (() => {
      const tenantId = getProgressScopeKey();
      const crawlingStatsBySource = getCurrentSourceStatsForTenant(tenantId);
      crawlingStatsBySource.clear();
      updateProgress({
        step: "crawling",
        message: "Fetching jobs from sources...",
        ...messageText("fetchingSources"),
        detail: "Starting crawler",
        ...detailText("startingCrawler"),
        startedAt: preserveStartedAt
          ? getProgress().startedAt
          : new Date().toISOString(),
        crawlingSource: null,
        crawlingSourcesCompleted: 0,
        crawlingSourcesTotal: sourcesTotal,
        ...emptyCrawlingStats,
        jobsDiscovered: 0,
        jobsScored: 0,
        jobsExceptional: 0,
        jobsProcessed: 0,
        totalToProcess: 0,
      });
    })(),

  startSource: (
    source: CrawlSource,
    sourcesCompleted: number,
    sourcesTotal: number,
    options?: { termsTotal?: number; detail?: string },
  ) => {
    const tenantId = getProgressScopeKey();
    const crawlingStatsBySource = getCurrentSourceStatsForTenant(tenantId);
    const existing =
      crawlingStatsBySource.get(source) ?? emptySourceCrawlingStats();
    crawlingStatsBySource.set(source, {
      ...emptySourceCrawlingStats(),
      termsTotal: options?.termsTotal ?? existing.termsTotal,
    });
    const aggregated = aggregateCrawlingStats(tenantId);

    updateProgress({
      step: "crawling",
      message: `Fetching jobs from ${source}...`,
      ...messageText("fetchingSource", { source }),
      // Source-specific detail comes from the extractor and stays as sent.
      detail: options?.detail,
      crawlingSource: source,
      crawlingSourcesCompleted: sourcesCompleted,
      crawlingSourcesTotal: sourcesTotal,
      crawlingTermsProcessed: aggregated.termsProcessed,
      crawlingTermsTotal: aggregated.termsTotal,
      crawlingListPagesProcessed: aggregated.listPagesProcessed,
      crawlingListPagesTotal: aggregated.listPagesTotal,
      crawlingJobCardsFound: aggregated.jobCardsFound,
      crawlingJobPagesEnqueued: aggregated.jobPagesEnqueued,
      crawlingJobPagesSkipped: aggregated.jobPagesSkipped,
      crawlingJobPagesProcessed: aggregated.jobPagesProcessed,
      crawlingPhase: undefined,
      crawlingCurrentUrl: undefined,
    });
  },

  completeSource: (sourcesCompleted: number, sourcesTotal: number) =>
    updateProgress({
      crawlingSourcesCompleted: sourcesCompleted,
      crawlingSourcesTotal: sourcesTotal,
      crawlingCurrentUrl: undefined,
      crawlingPhase: undefined,
    }),

  crawlingUpdate: (update: {
    source?: CrawlSource;
    termsProcessed?: number;
    termsTotal?: number;
    listPagesProcessed?: number;
    listPagesTotal?: number;
    jobCardsFound?: number;
    jobPagesEnqueued?: number;
    jobPagesSkipped?: number;
    jobPagesProcessed?: number;
    phase?: "list" | "job";
    currentUrl?: string;
  }) => {
    const tenantId = getProgressScopeKey();
    const crawlingStatsBySource = getCurrentSourceStatsForTenant(tenantId);
    const current = getProgress();
    if (update.source) {
      const existing =
        crawlingStatsBySource.get(update.source) ?? emptySourceCrawlingStats();
      const nextForSource: SourceCrawlingStats = {
        termsProcessed: update.termsProcessed ?? existing.termsProcessed,
        termsTotal: update.termsTotal ?? existing.termsTotal,
        listPagesProcessed:
          update.listPagesProcessed ?? existing.listPagesProcessed,
        listPagesTotal: update.listPagesTotal ?? existing.listPagesTotal,
        jobCardsFound: update.jobCardsFound ?? existing.jobCardsFound,
        jobPagesEnqueued: update.jobPagesEnqueued ?? existing.jobPagesEnqueued,
        jobPagesSkipped: update.jobPagesSkipped ?? existing.jobPagesSkipped,
        jobPagesProcessed:
          update.jobPagesProcessed ?? existing.jobPagesProcessed,
      };
      crawlingStatsBySource.set(update.source, nextForSource);
    }

    const aggregated = aggregateCrawlingStats(tenantId);
    const next = {
      ...current,
      crawlingSource: update.source ?? current.crawlingSource,
      crawlingTermsProcessed: update.source
        ? aggregated.termsProcessed
        : (update.termsProcessed ?? current.crawlingTermsProcessed),
      crawlingTermsTotal: update.source
        ? aggregated.termsTotal
        : (update.termsTotal ?? current.crawlingTermsTotal),
      crawlingListPagesProcessed: update.source
        ? aggregated.listPagesProcessed
        : (update.listPagesProcessed ?? current.crawlingListPagesProcessed),
      crawlingListPagesTotal: update.source
        ? aggregated.listPagesTotal
        : (update.listPagesTotal ?? current.crawlingListPagesTotal),
      crawlingJobCardsFound: update.source
        ? aggregated.jobCardsFound
        : (update.jobCardsFound ?? current.crawlingJobCardsFound),
      crawlingJobPagesEnqueued: update.source
        ? aggregated.jobPagesEnqueued
        : (update.jobPagesEnqueued ?? current.crawlingJobPagesEnqueued),
      crawlingJobPagesSkipped: update.source
        ? aggregated.jobPagesSkipped
        : (update.jobPagesSkipped ?? current.crawlingJobPagesSkipped),
      crawlingJobPagesProcessed: update.source
        ? aggregated.jobPagesProcessed
        : (update.jobPagesProcessed ?? current.crawlingJobPagesProcessed),
      crawlingPhase: update.phase ?? current.crawlingPhase,
      crawlingCurrentUrl: update.currentUrl ?? current.crawlingCurrentUrl,
    };

    const sourcesPart =
      next.crawlingListPagesTotal > 0
        ? `${next.crawlingListPagesProcessed}/${next.crawlingListPagesTotal}`
        : `${next.crawlingListPagesProcessed}`;

    const pagesPart = `${next.crawlingJobPagesProcessed}/${next.crawlingJobPagesEnqueued}`;
    const termsPart =
      next.crawlingTermsTotal > 0
        ? `, terms ${next.crawlingTermsProcessed}/${next.crawlingTermsTotal}`
        : "";
    const skippedPart =
      next.crawlingJobPagesSkipped > 0
        ? `, skipped ${next.crawlingJobPagesSkipped}`
        : "";
    const cardsPart =
      next.crawlingJobCardsFound > 0
        ? `, cards ${next.crawlingJobCardsFound}`
        : "";

    const message = `Crawling jobs (list pages ${sourcesPart}, job pages ${pagesPart}${termsPart}${skippedPart}${cardsPart})...`;
    // One translation key per combination of the optional parts above.
    const messageKeySuffix = `${termsPart ? "Terms" : ""}${skippedPart ? "Skipped" : ""}${cardsPart ? "Cards" : ""}`;
    const messageI18n = messageText(`crawling${messageKeySuffix}`, {
      listPages: sourcesPart,
      jobPages: pagesPart,
      termsProcessed: next.crawlingTermsProcessed,
      termsTotal: next.crawlingTermsTotal,
      skipped: next.crawlingJobPagesSkipped,
      cards: next.crawlingJobCardsFound,
    });
    const detail =
      next.crawlingCurrentUrl && next.crawlingPhase
        ? `${next.crawlingPhase === "list" ? "List" : "Job"}: ${next.crawlingCurrentUrl}`
        : next.crawlingCurrentUrl
          ? next.crawlingCurrentUrl
          : "Running crawler";
    const detailI18n =
      next.crawlingCurrentUrl && next.crawlingPhase
        ? detailText(next.crawlingPhase === "list" ? "listUrl" : "jobUrl", {
            url: next.crawlingCurrentUrl,
          })
        : next.crawlingCurrentUrl
          ? {}
          : detailText("runningCrawler");

    updateProgress({
      step: "crawling",
      message,
      ...messageI18n,
      detail,
      ...detailI18n,
      crawlingSource: next.crawlingSource,
      crawlingTermsProcessed: next.crawlingTermsProcessed,
      crawlingTermsTotal: next.crawlingTermsTotal,
      crawlingListPagesProcessed: next.crawlingListPagesProcessed,
      crawlingListPagesTotal: next.crawlingListPagesTotal,
      crawlingJobCardsFound: next.crawlingJobCardsFound,
      crawlingJobPagesEnqueued: next.crawlingJobPagesEnqueued,
      crawlingJobPagesSkipped: next.crawlingJobPagesSkipped,
      crawlingJobPagesProcessed: next.crawlingJobPagesProcessed,
      crawlingPhase: next.crawlingPhase,
      crawlingCurrentUrl: next.crawlingCurrentUrl,
    });
  },

  crawlingComplete: (jobsFound: number) =>
    updateProgress({
      step: "importing",
      message: `Found ${jobsFound} jobs, importing to database...`,
      ...messageText("foundJobs", { jobsFound }),
      detail: "Deduplicating and saving",
      ...detailText("deduplicating"),
      jobsDiscovered: jobsFound,
      crawlingSource: null,
      crawlingCurrentUrl: undefined,
    }),

  importingJob: (
    index: number,
    total: number,
    job: PipelineProgressCurrentJob,
  ) =>
    updateProgress({
      step: "importing",
      message: `Importing jobs (${index}/${total})...`,
      ...messageText("importingJobs", { index, total }),
      detail: "Checking for duplicates and saving new jobs",
      ...detailText("checkingDuplicates"),
      currentJob: job,
    }),

  importComplete: (created: number, skipped: number) =>
    updateProgress({
      step: "scoring",
      message: `Imported ${created} new jobs (${skipped} duplicates). Scoring...`,
      ...messageText("imported", { created, skipped }),
      detail: "Using AI to evaluate job fit",
      ...detailText("evaluatingFit"),
      currentJob: undefined,
    }),

  scoringJob: (
    index: number,
    total: number,
    job: PipelineProgressCurrentJob,
    exceptional: number,
  ) =>
    updateProgress({
      step: "scoring",
      message: `Scoring jobs (${index}/${total})...`,
      ...messageText("scoringJobs", { index, total }),
      detail: "Using AI to evaluate job fit",
      ...detailText("evaluatingFit"),
      jobsScored: index,
      jobsExceptional: exceptional,
      currentJob: job,
    }),

  scoringComplete: (totalScored: number) =>
    updateProgress({
      step: "scoring",
      message: `Scored ${totalScored} jobs.`,
      ...messageText("scored", { totalScored }),
      detail: "Ready for manual processing",
      ...detailText("readyForManual"),
      jobsScored: totalScored,
      totalToProcess: 0,
      jobsProcessed: 0,
      currentJob: undefined,
    }),

  processingJob: (
    index: number,
    total: number,
    job: { id: string; title: string; employer: string },
  ) =>
    updateProgress({
      step: "processing",
      message: `Processing job ${index}/${total}...`,
      ...messageText("processingJob", { index, total }),
      detail: `${job.title} @ ${job.employer}`,
      ...detailText("jobAtEmployer", {
        title: job.title,
        employer: job.employer,
      }),
      totalToProcess: total,
      currentJob: job,
    }),

  generatingSummary: (job: { title: string; employer: string }) =>
    updateProgress({
      detail: `Generating summary for ${job.title}...`,
      ...detailText("generatingSummary", { title: job.title }),
    }),

  generatingPdf: (job: { title: string; employer: string }) =>
    updateProgress({
      detail: `Generating PDF for ${job.title}...`,
      ...detailText("generatingPdf", { title: job.title }),
    }),

  jobComplete: (index: number, total: number) =>
    updateProgress({
      jobsProcessed: index,
      detail: `Completed ${index}/${total} jobs`,
      ...detailText("jobsCompleted", { index, total }),
    }),

  complete: (discovered: number, processed: number) =>
    updateProgress({
      step: "completed",
      message: `Search complete! Discovered ${discovered} jobs, processed ${processed}.`,
      ...messageText("complete", { discovered, processed }),
      detail: "Ready for review",
      ...detailText("readyForReview"),
      completedAt: new Date().toISOString(),
      currentJob: undefined,
    }),

  cancelled: (reason: string) =>
    updateProgress({
      step: "cancelled",
      message: "Search cancelled",
      ...messageText("cancelled"),
      detail: reason,
      completedAt: new Date().toISOString(),
      currentJob: undefined,
    }),

  failed: (error: string) =>
    updateProgress({
      step: "failed",
      message: "Search failed",
      ...messageText("failed"),
      detail: error,
      error,
      completedAt: new Date().toISOString(),
    }),

  configurationRequired: (error: string) =>
    updateProgress({
      step: "configuration_required",
      message: "Configuration required",
      ...messageText("configurationRequired"),
      detail: error,
      error,
      completedAt: new Date().toISOString(),
    }),

  challengeRequired: (challenges: PendingChallenge[]) =>
    updateProgress({
      step: "challenge_required",
      message: `${challenges.length} extractor${challenges.length > 1 ? "s need" : " needs"} a Cloudflare challenge solved`,
      ...messageText(
        challenges.length > 1 ? "challengesNeededMany" : "challengesNeededOne",
        { extractors: challenges.length },
      ),
      detail: challenges.map((c) => c.extractorName).join(", "),
      pendingChallenges: challenges,
    }),

  challengeResolved: (remaining: PendingChallenge[]) =>
    updateProgress({
      step: "challenge_required",
      message:
        remaining.length > 0
          ? `${remaining.length} challenge${remaining.length > 1 ? "s" : ""} remaining`
          : "All challenges solved, resuming...",
      ...(remaining.length > 0
        ? messageText(
            remaining.length > 1
              ? "challengesRemainingMany"
              : "challengesRemainingOne",
            { remaining: remaining.length },
          )
        : messageText("allChallengesSolved")),
      detail:
        remaining.length > 0
          ? remaining.map((c) => c.extractorName).join(", ")
          : "Re-running extractors",
      ...(remaining.length > 0 ? {} : detailText("rerunningExtractors")),
      pendingChallenges: remaining,
    }),
};
