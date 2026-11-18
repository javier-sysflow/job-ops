import i18n from "@client/i18n";
import { jobStatusLabel } from "@client/i18n/labels";
import {
  EXTRACTOR_SOURCE_IDS,
  EXTRACTOR_SOURCE_METADATA,
  PIPELINE_EXTRACTOR_SOURCE_IDS,
} from "@shared/extractors";
import type { JobSource, JobStatus } from "@shared/types";

// Labels below are getters so they are translated when read (at render
// time), not when this module loads.

export const DEFAULT_PIPELINE_SOURCES: JobSource[] = [
  "gradcracker",
  "indeed",
  "linkedin",
  "ukvisajobs",
];
export const PIPELINE_SOURCES_STORAGE_KEY = "jobops.pipeline.sources";
export const PIPELINE_WATCHLIST_SOURCES_STORAGE_KEY =
  "jobops.pipeline.watchlist-sources";
export const IN_PROGRESS_BOARD_APPLIED_COLLAPSED_STORAGE_KEY =
  "jobops.in-progress-board.applied-collapsed";

export const orderedSources = [...PIPELINE_EXTRACTOR_SOURCE_IDS].sort(
  (left, right) =>
    EXTRACTOR_SOURCE_METADATA[left].order -
    EXTRACTOR_SOURCE_METADATA[right].order,
);
export const orderedFilterSources: JobSource[] = [...EXTRACTOR_SOURCE_IDS].sort(
  (left, right) =>
    EXTRACTOR_SOURCE_METADATA[left].order -
    EXTRACTOR_SOURCE_METADATA[right].order,
);

export const statusTokens: Record<
  JobStatus,
  { label: string; badge: string; dot: string }
> = {
  discovered: {
    get label() {
      return jobStatusLabel("discovered");
    },
    badge: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    dot: "bg-sky-400",
  },
  processing: {
    get label() {
      return jobStatusLabel("processing");
    },
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    dot: "bg-amber-400",
  },
  ready: {
    get label() {
      return jobStatusLabel("ready");
    },
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
  },
  applied: {
    get label() {
      return jobStatusLabel("applied");
    },
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
  },
  in_progress: {
    get label() {
      return jobStatusLabel("in_progress");
    },
    badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
    dot: "bg-cyan-400",
  },
  skipped: {
    get label() {
      return jobStatusLabel("skipped");
    },
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    dot: "bg-rose-400",
  },
  expired: {
    get label() {
      return jobStatusLabel("expired");
    },
    badge: "border-muted-foreground/20 bg-muted/30 text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export const defaultStatusToken = {
  get label() {
    return i18n.t("jobs:status.unknown");
  },
  badge: "border-muted-foreground/20 bg-muted/30 text-muted-foreground",
  dot: "bg-muted-foreground",
};

export const appliedDuplicateIndicator = {
  get label() {
    return i18n.t("jobs:status.previouslyApplied");
  },
  dot: "bg-yellow-400",
};

export type FilterTab = "ready" | "discovered" | "all";
export type DateFilterPreset = "7" | "14" | "30" | "90" | "custom";
export type DateFilterDimension = "ready" | "applied" | "closed" | "discovered";

export type SortKey =
  | "datePosted"
  | "discoveredAt"
  | "score"
  | "salary"
  | "title"
  | "employer";
export type SortDirection = "asc" | "desc";
export type SponsorFilter =
  | "all"
  | "confirmed"
  | "potential"
  | "not_found"
  | "unknown";
export type SalaryFilterMode = "at_least" | "at_most" | "between";

export interface SalaryFilter {
  mode: SalaryFilterMode;
  min: number | null;
  max: number | null;
}

export type ScoreFilterMode = "any" | "has" | "missing";

export interface ScoreFilter {
  mode: ScoreFilterMode;
  min: number | null;
  max: number | null;
}

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary";

export const employmentTypeOptions: Array<{
  value: EmploymentType;
  label: string;
}> = [
  {
    value: "full_time",
    get label() {
      return i18n.t("jobs:filters.employment.types.full_time");
    },
  },
  {
    value: "part_time",
    get label() {
      return i18n.t("jobs:filters.employment.types.part_time");
    },
  },
  {
    value: "contract",
    get label() {
      return i18n.t("jobs:filters.employment.types.contract");
    },
  },
  {
    value: "internship",
    get label() {
      return i18n.t("jobs:filters.employment.types.internship");
    },
  },
  {
    value: "temporary",
    get label() {
      return i18n.t("jobs:filters.employment.types.temporary");
    },
  },
];

export const employmentTypeValues: EmploymentType[] = employmentTypeOptions.map(
  (option) => option.value,
);

/** Presets for the "posted within the last N days" filter. */
export const postedWithinOptions: Array<{ value: number; label: string }> = [
  {
    value: 1,
    get label() {
      return i18n.t("jobs:filters.posted.options.hours24");
    },
  },
  {
    value: 3,
    get label() {
      return i18n.t("jobs:filters.posted.options.days3");
    },
  },
  {
    value: 7,
    get label() {
      return i18n.t("jobs:filters.posted.options.days7");
    },
  },
  {
    value: 14,
    get label() {
      return i18n.t("jobs:filters.posted.options.days14");
    },
  },
  {
    value: 30,
    get label() {
      return i18n.t("jobs:filters.posted.options.days30");
    },
  },
];

export const postedWithinValues: number[] = postedWithinOptions.map(
  (option) => option.value,
);

export interface JobSort {
  key: SortKey;
  direction: SortDirection;
}

export interface JobDateFilter {
  dimensions: DateFilterDimension[];
  startDate: string | null;
  endDate: string | null;
  preset: DateFilterPreset | null;
}

/**
 * Full set of client-side filter inputs applied to the in-memory job list.
 * Passed as a single object to {@link useFilteredJobs} so new filters can be
 * added without growing the call signature.
 */
export interface JobFilters {
  activeTab: FilterTab;
  dateFilter: JobDateFilter;
  sourceFilter: JobSource | "all";
  sponsorFilter: SponsorFilter;
  salaryFilter: SalaryFilter;
  scoreFilter: ScoreFilter;
  postedWithinDays: number | null;
  employmentTypes: EmploymentType[];
  location: string;
  sort: JobSort;
}

export const DEFAULT_SORT: JobSort = { key: "score", direction: "desc" };
export const DEFAULT_DATE_FILTER: JobDateFilter = {
  dimensions: [],
  startDate: null,
  endDate: null,
  preset: null,
};

export const sortLabels: Record<JobSort["key"], string> = {
  get datePosted() {
    return i18n.t("jobs:filters.sort.fields.datePosted");
  },
  get discoveredAt() {
    return i18n.t("jobs:filters.sort.fields.discoveredAt");
  },
  get score() {
    return i18n.t("jobs:filters.sort.fields.score");
  },
  get salary() {
    return i18n.t("jobs:filters.sort.fields.salary");
  },
  get title() {
    return i18n.t("jobs:filters.sort.fields.title");
  },
  get employer() {
    return i18n.t("jobs:filters.sort.fields.employer");
  },
};

export const defaultSortDirection: Record<JobSort["key"], SortDirection> = {
  datePosted: "desc",
  discoveredAt: "desc",
  score: "desc",
  salary: "desc",
  title: "asc",
  employer: "asc",
};

export const tabs: Array<{
  id: FilterTab;
  label: string;
  statuses: JobStatus[];
}> = [
  {
    id: "ready",
    get label() {
      return i18n.t("jobs:tabs.ready");
    },
    statuses: ["ready", "processing"],
  },
  {
    id: "discovered",
    get label() {
      return i18n.t("jobs:tabs.discovered");
    },
    statuses: ["discovered", "processing"],
  },
  {
    id: "all",
    get label() {
      return i18n.t("jobs:tabs.all");
    },
    statuses: [],
  },
];

export const emptyStateCopy: Record<FilterTab, string> = {
  get ready() {
    return i18n.t("jobs:list.emptyState.ready");
  },
  get discovered() {
    return i18n.t("jobs:list.emptyState.discovered");
  },
  get all() {
    return i18n.t("jobs:list.emptyState.all");
  },
};

export const dateFilterDimensionLabels: Record<DateFilterDimension, string> = {
  get ready() {
    return i18n.t("jobs:filters.dates.dimensions.ready");
  },
  get applied() {
    return i18n.t("jobs:filters.dates.dimensions.applied");
  },
  get closed() {
    return i18n.t("jobs:filters.dates.dimensions.closed");
  },
  get discovered() {
    return i18n.t("jobs:filters.dates.dimensions.discovered");
  },
};

export const dateFilterDimensionOrder: DateFilterDimension[] = [
  "ready",
  "applied",
  "closed",
  "discovered",
];
