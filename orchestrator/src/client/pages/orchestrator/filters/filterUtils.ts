import i18n from "@client/i18n";
import { formatNumber } from "@client/i18n/format";
import type {
  DateFilterDimension,
  DateFilterPreset,
  JobDateFilter,
  JobSort,
  SalaryFilter,
  ScoreFilter,
} from "../constants";
import { dateFilterDimensionOrder } from "../constants";

export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDateRangeForPreset = (
  preset: Exclude<DateFilterPreset, "custom">,
) => {
  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(start.getDate() - (Number.parseInt(preset, 10) - 1));

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
};

export const getDirectionOptions = (
  key: JobSort["key"],
): Array<{ value: JobSort["direction"]; label: string }> => {
  if (key === "datePosted" || key === "discoveredAt") {
    return [
      {
        value: "desc",
        label: i18n.t("jobs:filters.sort.directions.mostRecent"),
      },
      {
        value: "asc",
        label: i18n.t("jobs:filters.sort.directions.leastRecent"),
      },
    ];
  }
  if (key === "score" || key === "salary") {
    return [
      {
        value: "desc",
        label: i18n.t("jobs:filters.sort.directions.largestFirst"),
      },
      {
        value: "asc",
        label: i18n.t("jobs:filters.sort.directions.smallestFirst"),
      },
    ];
  }
  return [
    { value: "asc", label: i18n.t("jobs:filters.sort.directions.aToZ") },
    { value: "desc", label: i18n.t("jobs:filters.sort.directions.zToA") },
  ];
};

export const toggleDimension = (
  filter: JobDateFilter,
  dimension: DateFilterDimension,
): JobDateFilter => {
  const nextDimensions = filter.dimensions.includes(dimension)
    ? filter.dimensions.filter((value) => value !== dimension)
    : [...filter.dimensions, dimension].sort(
        (left, right) =>
          dateFilterDimensionOrder.indexOf(left) -
          dateFilterDimensionOrder.indexOf(right),
      );

  return {
    ...filter,
    dimensions: nextDimensions,
  };
};

export const formatMoney = (value: number) => formatNumber(value);

export const isSalaryFilterActive = (salaryFilter: SalaryFilter) =>
  (typeof salaryFilter.min === "number" && salaryFilter.min > 0) ||
  (typeof salaryFilter.max === "number" && salaryFilter.max > 0);

export const formatSalarySummary = (
  salaryFilter: SalaryFilter,
): string | null => {
  if (!isSalaryFilterActive(salaryFilter)) {
    return null;
  }

  if (salaryFilter.mode === "between") {
    return `${salaryFilter.min ? formatMoney(salaryFilter.min) : "0"}–${
      salaryFilter.max ? formatMoney(salaryFilter.max) : "∞"
    }`;
  }
  if (salaryFilter.mode === "at_most" && salaryFilter.max) {
    return `≤ ${formatMoney(salaryFilter.max)}`;
  }
  if (salaryFilter.min) {
    return `≥ ${formatMoney(salaryFilter.min)}`;
  }
  return null;
};

export const isScoreFilterActive = (scoreFilter: ScoreFilter) =>
  scoreFilter.mode !== "any";

export const formatScoreSummary = (scoreFilter: ScoreFilter): string | null => {
  if (scoreFilter.mode === "missing") {
    return i18n.t("jobs:filters.score.modes.missing");
  }
  if (scoreFilter.mode !== "has") return null;

  if (scoreFilter.min != null && scoreFilter.max != null) {
    return `${scoreFilter.min}–${scoreFilter.max}`;
  }
  if (scoreFilter.min != null) return `≥ ${scoreFilter.min}`;
  if (scoreFilter.max != null) return `≤ ${scoreFilter.max}`;
  return i18n.t("jobs:filters.score.modes.has");
};
