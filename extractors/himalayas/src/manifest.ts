import type {
  ExtractorManifest,
  ExtractorProgressEvent,
} from "@shared/types/extractors";
import { type HimalayasProgressEvent, runHimalayas } from "./run";

function toProgress(event: HimalayasProgressEvent): ExtractorProgressEvent {
  if (event.type === "term_start") {
    return {
      phase: "list",
      termsProcessed: Math.max(event.termIndex - 1, 0),
      termsTotal: event.termTotal,
      currentUrl: event.searchTerm,
      detail: `Himalayas: term ${event.termIndex}/${event.termTotal} (${event.searchTerm})`,
    };
  }

  return {
    phase: "list",
    termsProcessed: event.termIndex,
    termsTotal: event.termTotal,
    currentUrl: event.searchTerm,
    jobPagesEnqueued: event.jobsFoundTerm,
    jobPagesProcessed: event.jobsFoundTerm,
    detail: `Himalayas: completed ${event.termIndex}/${event.termTotal} (${event.searchTerm}) with ${event.jobsFoundTerm} jobs`,
  };
}

export const manifest: ExtractorManifest = {
  id: "himalayas",
  displayName: "Himalayas",
  providesSources: ["himalayas"],
  capabilities: { locationEvidence: true },
  locationCapabilities: {
    // Remote jobs: the API filters by the country a candidate lives in.
    himalayas: { supportedCountryKeys: null },
  },
  async run(context) {
    if (context.shouldCancel?.()) {
      return { success: true, jobs: [] };
    }

    const parsedMaxJobsPerTerm = context.settings.jobspyResultsWanted
      ? Number.parseInt(context.settings.jobspyResultsWanted, 10)
      : Number.NaN;
    const maxJobsPerTerm = Number.isFinite(parsedMaxJobsPerTerm)
      ? Math.max(1, parsedMaxJobsPerTerm)
      : 50;

    const result = await runHimalayas({
      searchTerms: context.searchTerms,
      selectedCountry: context.selectedCountry,
      workplaceTypes: context.settings.workplaceTypes
        ? JSON.parse(context.settings.workplaceTypes)
        : undefined,
      maxJobsPerTerm,
      apiKey: process.env.HIMALAYAS_API_KEY?.trim() || undefined,
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
