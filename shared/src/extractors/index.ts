import { z } from "zod";

export const EXTRACTOR_SOURCE_IDS = [
  "gradcracker",
  "indeed",
  "linkedin",
  "glassdoor",
  "ukvisajobs",
  "adzuna",
  "hiringcafe",
  "startupjobs",
  "workingnomads",
  "golangjobs",
  "jobindex",
  "seek",
  "naukri",
  "fiveamsat",
  "wazzuf",
  "freehire",
  "himalayas",
  "japandev",
  "mynavi",
  "googlejobs",
  "kyujinbox",
  "daijob",
  "manual",
] as const;

export type ExtractorSourceId = (typeof EXTRACTOR_SOURCE_IDS)[number];

export interface ExtractorSourceMetadata {
  label: string;
  order: number;
  category: "pipeline" | "manual";
  requiresCredentials?: boolean;
  ukOnly?: boolean;
}

export const EXTRACTOR_SOURCE_METADATA: Record<
  ExtractorSourceId,
  ExtractorSourceMetadata
> = {
  gradcracker: {
    label: "Gradcracker",
    order: 10,
    category: "pipeline",
    ukOnly: true,
  },
  indeed: { label: "Indeed", order: 20, category: "pipeline" },
  linkedin: { label: "LinkedIn", order: 30, category: "pipeline" },
  glassdoor: { label: "Glassdoor", order: 40, category: "pipeline" },
  ukvisajobs: {
    label: "UK Visa Jobs",
    order: 50,
    category: "pipeline",
    requiresCredentials: true,
    ukOnly: true,
  },
  adzuna: {
    label: "Adzuna",
    order: 60,
    category: "pipeline",
    requiresCredentials: true,
  },
  hiringcafe: { label: "Hiring Cafe", order: 70, category: "pipeline" },
  startupjobs: { label: "startup.jobs", order: 80, category: "pipeline" },
  workingnomads: {
    label: "Working Nomads",
    order: 90,
    category: "pipeline",
  },
  golangjobs: {
    label: "Golang Jobs",
    order: 100,
    category: "pipeline",
  },
  jobindex: {
    label: "Jobindex",
    order: 103,
    category: "pipeline",
  },
  seek: {
    label: "Seek",
    order: 105,
    category: "pipeline",
    requiresCredentials: true,
  },
  naukri: {
    label: "Naukri",
    order: 107,
    category: "pipeline",
  },
  fiveamsat: { label: "Khamsat", order: 109, category: "pipeline" },
  wazzuf: { label: "WUZZUF", order: 110, category: "pipeline" },
  freehire: { label: "FreeHire", order: 115, category: "pipeline" },
  himalayas: { label: "Himalayas", order: 116, category: "pipeline" },
  japandev: { label: "Japan Dev", order: 117, category: "pipeline" },
  // Fork: マイナビ転職 through an Apify actor (needs APIFY_TOKEN).
  mynavi: {
    label: "Mynavi 転職",
    order: 118,
    category: "pipeline",
    requiresCredentials: true,
  },
  // Fork: Google Jobs, 求人ボックス and Daijob through Apify actors.
  googlejobs: {
    label: "Google Jobs",
    order: 119,
    category: "pipeline",
    requiresCredentials: true,
  },
  kyujinbox: {
    label: "求人ボックス",
    order: 119.1,
    category: "pipeline",
    requiresCredentials: true,
  },
  daijob: {
    label: "Daijob",
    order: 119.2,
    category: "pipeline",
    requiresCredentials: true,
  },
  manual: { label: "Manual", order: 120, category: "manual" },
};

/**
 * Fork: sources nobody can pick for a search run. The ids stay in
 * EXTRACTOR_SOURCE_IDS so jobs already found there keep their label and filter.
 * - hiringcafe: asks for a browser check on nearly every search from the
 *   hosted server, and adds little for jobs in Japan.
 * - golangjobs: Go programming jobs only; this instance serves a non-IT
 *   job search.
 */
export const DISABLED_PIPELINE_SOURCE_IDS: readonly ExtractorSourceId[] = [
  "hiringcafe",
  "golangjobs",
];

export const PIPELINE_EXTRACTOR_SOURCE_IDS = EXTRACTOR_SOURCE_IDS.filter(
  (source) =>
    EXTRACTOR_SOURCE_METADATA[source].category === "pipeline" &&
    !DISABLED_PIPELINE_SOURCE_IDS.includes(source),
);

const extractorSourceTuple = EXTRACTOR_SOURCE_IDS as unknown as [
  ExtractorSourceId,
  ...ExtractorSourceId[],
];

export const extractorSourceEnum = z.enum(extractorSourceTuple);

export function isExtractorSourceId(value: string): value is ExtractorSourceId {
  return EXTRACTOR_SOURCE_IDS.includes(value as ExtractorSourceId);
}

export function sourceLabel(source: ExtractorSourceId): string {
  return EXTRACTOR_SOURCE_METADATA[source].label;
}

export function sortSources<T extends { source: ExtractorSourceId }>(
  values: T[],
): T[] {
  return [...values].sort(
    (left, right) =>
      EXTRACTOR_SOURCE_METADATA[left.source].order -
      EXTRACTOR_SOURCE_METADATA[right.source].order,
  );
}
