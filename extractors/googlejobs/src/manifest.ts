import { resolveSearchCities } from "@shared/search-cities.js";
import type {
  ExtractorManifest,
  ExtractorProgressEvent,
} from "@shared/types/extractors";
import { type GoogleJobsProgressEvent, runGoogleJobs } from "./run";

function toProgress(event: GoogleJobsProgressEvent): ExtractorProgressEvent {
  if (event.type === "term_start") {
    return {
      phase: "list",
      termsProcessed: Math.max(event.termIndex - 1, 0),
      termsTotal: event.termTotal,
      currentUrl: event.searchTerm,
      detail: `Google Jobs: term ${event.termIndex}/${event.termTotal} (${event.searchTerm})`,
    };
  }
  return {
    phase: "list",
    termsProcessed: event.termIndex,
    termsTotal: event.termTotal,
    currentUrl: event.searchTerm,
    jobPagesEnqueued: event.jobsFoundTerm,
    jobPagesProcessed: event.jobsFoundTerm,
    detail: `Google Jobs: completed ${event.termIndex}/${event.termTotal} (${event.searchTerm}) with ${event.jobsFoundTerm} jobs`,
  };
}

/** Fork: Google Jobs through an Apify actor (needs APIFY_TOKEN). */
export const manifest: ExtractorManifest = {
  id: "googlejobs",
  displayName: "Google Jobs",
  providesSources: ["googlejobs"],
  requiredEnvVars: ["APIFY_TOKEN"],
  capabilities: { locationEvidence: true },
  locationCapabilities: {
    googlejobs: { supportedCountryKeys: ["japan"] },
  },
  async run(context) {
    if (context.shouldCancel?.()) {
      return { success: true, jobs: [] };
    }

    const parsedMaxJobsPerTerm = context.settings.jobspyResultsWanted
      ? Number.parseInt(context.settings.jobspyResultsWanted, 10)
      : Number.NaN;
    const cities = resolveSearchCities({
      list:
        context.sourceLocationPlan?.requestedCities ??
        context.locationIntent?.cityLocations,
      single: context.settings.searchCities ?? context.settings.jobspyLocation,
    });

    const result = await runGoogleJobs({
      searchTerms: context.searchTerms,
      cities,
      country:
        context.locationIntent?.selectedCountry ??
        context.selectedCountry ??
        context.settings.jobspyCountryIndeed ??
        null,
      maxJobsPerTerm: Number.isFinite(parsedMaxJobsPerTerm)
        ? parsedMaxJobsPerTerm
        : undefined,
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
