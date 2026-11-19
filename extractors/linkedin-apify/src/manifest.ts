import { JOBSPY_SUPPORTED_COUNTRY_KEYS } from "@shared/location-support.js";
import { resolveSearchCities } from "@shared/search-cities.js";
import type {
  ExtractorManifest,
  ExtractorProgressEvent,
} from "@shared/types/extractors";
import { type LinkedInProgressEvent, runLinkedIn } from "./run";

function toProgress(event: LinkedInProgressEvent): ExtractorProgressEvent {
  if (event.type === "term_start") {
    return {
      phase: "list",
      termsProcessed: Math.max(event.termIndex - 1, 0),
      termsTotal: event.termTotal,
      currentUrl: event.searchTerm,
      detail: `LinkedIn: term ${event.termIndex}/${event.termTotal} (${event.searchTerm})`,
    };
  }

  return {
    phase: "list",
    termsProcessed: event.termIndex,
    termsTotal: event.termTotal,
    currentUrl: event.searchTerm,
    jobPagesEnqueued: event.jobsFoundTerm,
    jobPagesProcessed: event.jobsFoundTerm,
    detail: `LinkedIn: completed ${event.termIndex}/${event.termTotal} (${event.searchTerm}) with ${event.jobsFoundTerm} jobs`,
  };
}

/**
 * Fork: provides the "linkedin" source (JobSpy keeps Indeed and Glassdoor),
 * so existing LinkedIn jobs, labels and saved source choices stay the same.
 */
export const manifest: ExtractorManifest = {
  id: "linkedin-apify",
  displayName: "LinkedIn",
  providesSources: ["linkedin"],
  requiredEnvVars: ["APIFY_TOKEN"],
  capabilities: { locationEvidence: true },
  locationCapabilities: {
    linkedin: { supportedCountryKeys: JOBSPY_SUPPORTED_COUNTRY_KEYS },
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

    const result = await runLinkedIn({
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
