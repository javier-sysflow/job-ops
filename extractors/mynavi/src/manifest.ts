import { resolveSearchCities } from "@shared/search-cities.js";
import type {
  ExtractorManifest,
  ExtractorProgressEvent,
} from "@shared/types/extractors";
import { type MynaviProgressEvent, runMynavi } from "./run";

type MynaviContext = Parameters<ExtractorManifest["run"]>[0];

function toProgress(event: MynaviProgressEvent): ExtractorProgressEvent {
  if (event.type === "term_start") {
    return {
      phase: "list",
      termsProcessed: Math.max(event.termIndex - 1, 0),
      termsTotal: event.termTotal,
      currentUrl: event.searchTerm,
      detail: `Mynavi: term ${event.termIndex}/${event.termTotal} (${event.searchTerm})`,
    };
  }

  return {
    phase: "list",
    termsProcessed: event.termIndex,
    termsTotal: event.termTotal,
    currentUrl: event.searchTerm,
    jobPagesEnqueued: event.jobsFoundTerm,
    jobPagesProcessed: event.jobsFoundTerm,
    detail: `Mynavi: completed ${event.termIndex}/${event.termTotal} (${event.searchTerm}) with ${event.jobsFoundTerm} jobs`,
  };
}

function parseWorkplaceTypes(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : undefined;
  } catch {
    return undefined;
  }
}

function isRemoteOnly(context: MynaviContext): boolean {
  const intentTypes = context.locationIntent?.workplaceTypes;
  const types =
    intentTypes && intentTypes.length > 0
      ? [...intentTypes]
      : parseWorkplaceTypes(context.settings.workplaceTypes);
  return types?.length === 1 && types[0] === "remote";
}

export const manifest: ExtractorManifest = {
  id: "mynavi",
  displayName: "Mynavi 転職",
  providesSources: ["mynavi"],
  requiredEnvVars: ["APIFY_TOKEN"],
  capabilities: { locationEvidence: true },
  locationCapabilities: {
    mynavi: { supportedCountryKeys: ["japan"] },
  },
  async run(context) {
    if (context.shouldCancel?.()) {
      return { success: true, jobs: [] };
    }

    const parsedMaxJobsPerTerm = context.settings.jobspyResultsWanted
      ? Number.parseInt(context.settings.jobspyResultsWanted, 10)
      : Number.NaN;
    const maxJobsPerTerm = Number.isFinite(parsedMaxJobsPerTerm)
      ? parsedMaxJobsPerTerm
      : 50;

    const cities = resolveSearchCities({
      list:
        context.sourceLocationPlan?.requestedCities ??
        context.locationIntent?.cityLocations,
      single: context.settings.searchCities ?? context.settings.jobspyLocation,
    });

    const result = await runMynavi({
      searchTerms: context.searchTerms,
      cities,
      remoteOnly: isRemoteOnly(context),
      maxJobsPerTerm,
      shouldCancel: context.shouldCancel,
      onProgress: (event) => {
        if (context.shouldCancel?.()) return;
        context.onProgress?.(toProgress(event));
      },
    });

    if (!result.success) {
      return { success: false, jobs: [], error: result.error };
    }
    return { success: true, jobs: result.jobs };
  },
};

export default manifest;
