import i18n from "@client/i18n";
import { isJapaneseUi } from "@client/i18n/format";
import { countryLabel as localizedCountryLabel } from "@client/i18n/labels";
import {
  EXTRACTOR_SOURCE_METADATA,
  type ExtractorSourceId,
} from "@shared/extractors";
import type { LocationSourcePlan } from "@shared/location-intelligence.js";
import { formatCountryLabel } from "@shared/location-support.js";
import { sourceLabel } from "@/lib/utils";

export interface AutomaticSourceStatus {
  badgeLabel: string;
  detail: string;
  available: boolean;
}

function getKnownJobSource(
  source: LocationSourcePlan["source"],
): ExtractorSourceId | null {
  return source in EXTRACTOR_SOURCE_METADATA
    ? (source as ExtractorSourceId)
    : null;
}

export function getSourceStatus(args: {
  countrySelected: boolean;
  plan: LocationSourcePlan;
}): AutomaticSourceStatus {
  const { countrySelected, plan } = args;
  const { source, requestedCountry, requestedCities } = plan;
  const knownSource = getKnownJobSource(source);
  // English keeps the shared label; other languages use Intl country names.
  const countryLabel = requestedCountry
    ? isJapaneseUi()
      ? localizedCountryLabel(
          requestedCountry,
          formatCountryLabel(requestedCountry),
        )
      : formatCountryLabel(requestedCountry)
    : "";
  const sourceName = knownSource ? sourceLabel[knownSource] : source;
  const isUkOnlySource = knownSource
    ? Boolean(EXTRACTOR_SOURCE_METADATA[knownSource]?.ukOnly)
    : false;

  if (!countrySelected) {
    if (source === "glassdoor" || isUkOnlySource) {
      return {
        badgeLabel: i18n.t("jobs:automaticRun.sourceStatus.selectCountry"),
        detail: i18n.t("jobs:automaticRun.sourceStatus.selectCountryDetail"),
        available: false,
      };
    }

    return {
      badgeLabel: i18n.t("jobs:automaticRun.sourceStatus.available"),
      detail: i18n.t("jobs:automaticRun.sourceStatus.availableWithoutCountry"),
      available: true,
    };
  }

  if (source === "glassdoor") {
    if (
      plan.capabilities.supportedCountryKeys !== null &&
      requestedCountry !== null &&
      !plan.capabilities.supportedCountryKeys.includes(requestedCountry)
    ) {
      return {
        badgeLabel: i18n.t("jobs:automaticRun.sourceStatus.blocked"),
        detail: i18n.t("jobs:automaticRun.sourceStatus.glassdoorCountry"),
        available: false,
      };
    }

    if (
      plan.capabilities.requiresCityLocations &&
      requestedCities.length === 0
    ) {
      return {
        badgeLabel: i18n.t("jobs:automaticRun.sourceStatus.needsCity"),
        detail: i18n.t("jobs:automaticRun.sourceStatus.glassdoorNeedsCity"),
        available: false,
      };
    }

    return {
      badgeLabel: i18n.t("jobs:automaticRun.sourceStatus.available"),
      detail: i18n.t("jobs:automaticRun.sourceStatus.glassdoorAvailable"),
      available: true,
    };
  }

  if (isUkOnlySource && !plan.canRun) {
    return {
      badgeLabel: i18n.t("jobs:automaticRun.sourceStatus.ukOnly"),
      detail: i18n.t("jobs:automaticRun.sourceStatus.ukOnlyDetail", {
        source: sourceName,
      }),
      available: false,
    };
  }

  if (!plan.canRun) {
    return {
      badgeLabel: i18n.t("jobs:automaticRun.sourceStatus.blocked"),
      detail: i18n.t("jobs:automaticRun.sourceStatus.notAvailableIn", {
        source: sourceName,
        country:
          countryLabel ||
          i18n.t("jobs:automaticRun.sourceStatus.theSelectedCountry"),
      }),
      available: false,
    };
  }

  return {
    badgeLabel: i18n.t("jobs:automaticRun.sourceStatus.available"),
    detail: i18n.t("jobs:automaticRun.sourceStatus.availableForIntent"),
    available: true,
  };
}
