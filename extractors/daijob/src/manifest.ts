import { resolveSearchCities } from "@shared/search-cities.js";
import type {
  ExtractorManifest,
  ExtractorProgressEvent,
} from "@shared/types/extractors";
import { type DaijobProgressEvent, runDaijob } from "./run";

function toProgress(event: DaijobProgressEvent): ExtractorProgressEvent {
  if (event.type === "run_start") {
    return {
      phase: "list",
      termsProcessed: 0,
      termsTotal: event.termTotal,
      detail: `Daijob: searching ${event.termTotal} term(s)`,
    };
  }
  return {
    phase: "list",
    termsProcessed: event.termTotal,
    termsTotal: event.termTotal,
    jobPagesEnqueued: event.jobsFound,
    jobPagesProcessed: event.jobsFound,
    detail: `Daijob: completed with ${event.jobsFound} jobs`,
  };
}

/** Fork: Daijob (bilingual jobs) through an Apify actor (needs APIFY_TOKEN). */
export const manifest: ExtractorManifest = {
  id: "daijob",
  displayName: "Daijob",
  providesSources: ["daijob"],
  requiredEnvVars: ["APIFY_TOKEN"],
  capabilities: { locationEvidence: true },
  locationCapabilities: {
    daijob: { supportedCountryKeys: ["japan"] },
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

    const result = await runDaijob({
      searchTerms: context.searchTerms,
      cities,
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
