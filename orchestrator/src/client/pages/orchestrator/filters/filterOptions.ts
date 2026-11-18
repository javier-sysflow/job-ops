import i18n from "@client/i18n";
import type {
  DateFilterPreset,
  FilterTab,
  JobSort,
  SalaryFilterMode,
  ScoreFilterMode,
  SponsorFilter,
} from "../constants";

// Labels are getters so they are translated when read (at render time).

export const sponsorOptions: Array<{
  value: SponsorFilter;
  label: string;
}> = [
  {
    value: "all",
    get label() {
      return i18n.t("jobs:filters.sponsor.options.all");
    },
  },
  {
    value: "confirmed",
    get label() {
      return i18n.t("jobs:filters.sponsor.options.confirmed");
    },
  },
  {
    value: "potential",
    get label() {
      return i18n.t("jobs:filters.sponsor.options.potential");
    },
  },
  {
    value: "not_found",
    get label() {
      return i18n.t("jobs:filters.sponsor.options.not_found");
    },
  },
  {
    value: "unknown",
    get label() {
      return i18n.t("jobs:filters.sponsor.options.unknown");
    },
  },
];

export const salaryModeOptions: Array<{
  value: SalaryFilterMode;
  label: string;
}> = [
  {
    value: "at_least",
    get label() {
      return i18n.t("jobs:filters.salary.modes.at_least");
    },
  },
  {
    value: "at_most",
    get label() {
      return i18n.t("jobs:filters.salary.modes.at_most");
    },
  },
  {
    value: "between",
    get label() {
      return i18n.t("jobs:filters.salary.modes.between");
    },
  },
];

export const scoreModeOptions: Array<{
  value: ScoreFilterMode;
  label: string;
}> = [
  {
    value: "any",
    get label() {
      return i18n.t("jobs:filters.score.modes.any");
    },
  },
  {
    value: "has",
    get label() {
      return i18n.t("jobs:filters.score.modes.has");
    },
  },
  {
    value: "missing",
    get label() {
      return i18n.t("jobs:filters.score.modes.missing");
    },
  },
];

export const sortFieldOrder: JobSort["key"][] = [
  "score",
  "datePosted",
  "discoveredAt",
  "salary",
  "title",
  "employer",
];

export const tabDescriptions: Partial<Record<FilterTab, string>> = {
  get discovered() {
    return i18n.t("jobs:tabs.descriptions.discovered");
  },
  get ready() {
    return i18n.t("jobs:tabs.descriptions.ready");
  },
};

export const datePresetOptions: Array<{
  value: Exclude<DateFilterPreset, "custom">;
  label: string;
}> = [
  {
    value: "7",
    get label() {
      return i18n.t("jobs:filters.dates.presetDays", { days: 7 });
    },
  },
  {
    value: "14",
    get label() {
      return i18n.t("jobs:filters.dates.presetDays", { days: 14 });
    },
  },
  {
    value: "30",
    get label() {
      return i18n.t("jobs:filters.dates.presetDays", { days: 30 });
    },
  },
  {
    value: "90",
    get label() {
      return i18n.t("jobs:filters.dates.presetDays", { days: 90 });
    },
  },
];
