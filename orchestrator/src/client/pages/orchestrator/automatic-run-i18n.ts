/**
 * Japanese-aware labels for the automatic run tab.
 *
 * Shared helpers (`formatCountryLabel`, `getSourceStatus`,
 * `summarizeLocationPreferences`) build English text. In English the UI keeps
 * that text unchanged; in Japanese these helpers return translated text.
 */
import i18n from "@client/i18n";
import { isJapaneseUi } from "@client/i18n/format";
import { countryLabel } from "@client/i18n/labels";
import { normalizeLocationIntent } from "@shared/location-intelligence.js";
import {
  formatCountryLabel,
  normalizeCountryKey,
} from "@shared/location-support.js";
import type { AutomaticRunValues } from "./automatic-run";
import type { AutomaticSourceStatus } from "./automatic-run-source-status";

/** Country name in the UI language; English keeps the existing label. */
export function localizedCountryLabel(country: string): string {
  const english = formatCountryLabel(country);
  if (!isJapaneseUi() || !english) return english;
  return countryLabel(country, english);
}

const SOURCE_BADGE_KEYS = {
  "Select country": "pipeline:sources.status.badge.selectCountry",
  Available: "pipeline:sources.status.badge.available",
  Blocked: "pipeline:sources.status.badge.blocked",
  "Needs city": "pipeline:sources.status.badge.needsCity",
  "UK only": "pipeline:sources.status.badge.ukOnly",
} as const;

const SOURCE_DETAIL_KEYS = {
  "Pick a country first to check whether this source is available.":
    "pipeline:sources.status.detail.pickCountry",
  "This source is available without a country selection.":
    "pipeline:sources.status.detail.availableWithoutCountry",
  "Glassdoor is not available for the selected country.":
    "pipeline:sources.status.detail.glassdoorCountry",
  "Add at least one city in Location preferences to enable Glassdoor.":
    "pipeline:sources.status.detail.glassdoorCity",
  "Glassdoor is available for this location intent.":
    "pipeline:sources.status.detail.glassdoorAvailable",
  "Available for this location intent.":
    "pipeline:sources.status.detail.available",
} as const;

const UK_ONLY_DETAIL =
  /^(.+) is available only when country is United Kingdom\.$/;
const NOT_AVAILABLE_DETAIL = /^(.+) is not available for (.+)\.$/;

function translateSourceDetail(
  detail: string,
  requestedCountry: string | null,
): string {
  const key = SOURCE_DETAIL_KEYS[detail as keyof typeof SOURCE_DETAIL_KEYS];
  if (key) return i18n.t(key);

  const ukOnly = UK_ONLY_DETAIL.exec(detail);
  if (ukOnly) {
    return i18n.t("pipeline:sources.status.detail.ukOnly", {
      source: ukOnly[1],
    });
  }

  const notAvailable = NOT_AVAILABLE_DETAIL.exec(detail);
  if (notAvailable) {
    const [, source, country] = notAvailable;
    if (country === "the selected country" || !requestedCountry) {
      return i18n.t("pipeline:sources.status.detail.notAvailableForSelected", {
        source,
      });
    }
    return i18n.t("pipeline:sources.status.detail.notAvailableFor", {
      source,
      country: countryLabel(requestedCountry, country),
    });
  }

  return detail;
}

/** Source availability text in the UI language (unchanged in English). */
export function localizeSourceStatus(
  status: AutomaticSourceStatus,
  requestedCountry: string | null,
): AutomaticSourceStatus {
  if (!isJapaneseUi()) return status;
  const badgeKey =
    SOURCE_BADGE_KEYS[status.badgeLabel as keyof typeof SOURCE_BADGE_KEYS];
  return {
    ...status,
    badgeLabel: badgeKey ? i18n.t(badgeKey) : status.badgeLabel,
    detail: translateSourceDetail(status.detail, requestedCountry),
  };
}

type LocationSummaryValues = Pick<
  AutomaticRunValues,
  | "country"
  | "cityLocations"
  | "proximity"
  | "workplaceTypes"
  | "searchScope"
  | "matchStrictness"
>;

function describeGeography(
  selectedCountry: string | null,
  cityLocations: string[],
): string {
  const country = selectedCountry
    ? localizedCountryLabel(selectedCountry) ||
      i18n.t("pipeline:summary.yourSelectedArea")
    : i18n.t("pipeline:summary.yourSelectedArea");

  if (!selectedCountry) {
    if (cityLocations.length === 0) return country;
    if (cityLocations.length === 1) return cityLocations[0] ?? country;
    if (cityLocations.length === 2) {
      return i18n.t("pipeline:summary.twoCities", {
        first: cityLocations[0],
        second: cityLocations[1],
      });
    }
    return i18n.t("pipeline:summary.selectedCities", {
      total: cityLocations.length,
    });
  }

  const cities = cityLocations.filter(
    (city) =>
      normalizeCountryKey(city) !== normalizeCountryKey(selectedCountry),
  );
  if (cities.length === 0) return country;
  if (cities.length === 1) {
    return i18n.t("pipeline:summary.cityInCountry", {
      city: cities[0],
      country,
    });
  }
  if (cities.length === 2) {
    return i18n.t("pipeline:summary.twoCitiesInCountry", {
      first: cities[0],
      second: cities[1],
      country,
    });
  }
  return i18n.t("pipeline:summary.selectedCitiesInCountry", {
    total: cities.length,
    country,
  });
}

function describeNonRemoteTypes(
  workplaceTypes: Array<"remote" | "hybrid" | "onsite">,
): string {
  const labels = workplaceTypes
    .filter((type) => type !== "remote")
    .map((type) =>
      type === "onsite"
        ? i18n.t("pipeline:summary.workplaceTypes.onsite")
        : i18n.t("pipeline:summary.workplaceTypes.hybrid"),
    );
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0] ?? "";
  return i18n.t("pipeline:summary.workplaceTypes.and", {
    first: labels[0],
    second: labels.slice(1).join(i18n.t("pipeline:listSeparator")),
  });
}

/**
 * Japanese version of the shared location summary
 * (shared/location-domain `describeLocationIntent`), same branches.
 */
function describeLocationSummary(values: LocationSummaryValues): string {
  const intent = normalizeLocationIntent({
    selectedCountry: values.country,
    cityLocations: values.cityLocations,
    proximity: values.proximity,
    workplaceTypes: values.workplaceTypes,
    geoScope: values.searchScope,
    matchStrictness: values.matchStrictness,
  });
  const geography = describeGeography(
    intent.selectedCountry,
    intent.cityLocations,
  );
  const remoteSelected = intent.workplaceTypes.includes("remote");
  const types = describeNonRemoteTypes(intent.workplaceTypes);

  if (intent.proximity) {
    const count = intent.proximity.radiusMiles;
    return intent.geoScope !== "selected_only" && remoteSelected
      ? i18n.t("pipeline:summary.radiusPlusRemote", { count })
      : i18n.t("pipeline:summary.radius", { count });
  }

  let summary: string;
  switch (intent.geoScope) {
    case "selected_plus_remote_worldwide":
      if (remoteSelected) {
        summary = types
          ? i18n.t("pipeline:summary.plusRemoteTyped", { types, geography })
          : i18n.t("pipeline:summary.plusRemoteOnly", { geography });
      } else {
        summary = i18n.t("pipeline:summary.onlyIn", { geography });
      }
      break;
    case "remote_worldwide_prioritize_selected":
      if (remoteSelected) {
        summary = i18n.t("pipeline:summary.remoteFirst", { geography });
      } else if (types) {
        summary = i18n.t("pipeline:summary.typedFirst", { types, geography });
      } else {
        summary = i18n.t("pipeline:summary.first", { geography });
      }
      break;
    default:
      if (types && !remoteSelected) {
        summary = i18n.t("pipeline:summary.onlyTypedExplicit", {
          types,
          geography,
        });
      } else if (remoteSelected && intent.workplaceTypes.length === 1) {
        summary = i18n.t("pipeline:summary.onlyRemoteExplicit", { geography });
      } else {
        summary = i18n.t("pipeline:summary.onlyExplicit", { geography });
      }
      break;
  }

  return intent.matchStrictness === "flexible"
    ? i18n.t("pipeline:summary.flexible", { summary })
    : summary;
}

/** Location summary in the UI language; English keeps the shared text. */
export function localizedLocationSummary(
  values: LocationSummaryValues,
  englishSummary: string,
): string {
  return isJapaneseUi() ? describeLocationSummary(values) : englishSummary;
}
