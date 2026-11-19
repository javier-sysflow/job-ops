import { toEnglishJapanPlace } from "@shared/japan-places.js";
import {
  formatCountryLabel,
  getCountryIso2Code,
  normalizeCountryKey,
} from "@shared/location-support.js";
import { matchesRequestedCountry } from "@shared/search-cities.js";
import type { CreateJobInput, JobLocationEvidence } from "@shared/types/jobs";
import { ApifyClient } from "apify-client";

/**
 * Fork: LinkedIn jobs through an Apify actor. LinkedIn answers HTTP 429 to
 * JobSpy's direct requests from Railway's IP, so the search runs on Apify
 * with the server's APIFY_TOKEN. The default actor takes keywords, location,
 * datePosted and limit, and returns full descriptions.
 */
const DEFAULT_ACTOR_ID = "valig/linkedin-jobs-scraper";
/** Past month; the actor also accepts r604800 (week) and r86400 (day). */
const DEFAULT_DATE_POSTED = "r2592000";
const MAX_JOBS_PER_RUN = 100;

/** The two Apify client calls this runner uses (injectable for tests). */
export interface ApifyLike {
  actor(id: string): {
    call(input: Record<string, unknown>): Promise<{ defaultDatasetId: string }>;
  };
  dataset(id: string): {
    listItems(options: { limit: number }): Promise<{ items: unknown[] }>;
  };
}

export type LinkedInProgressEvent =
  | {
      type: "term_start";
      termIndex: number;
      termTotal: number;
      searchTerm: string;
    }
  | {
      type: "term_complete";
      termIndex: number;
      termTotal: number;
      searchTerm: string;
      jobsFoundTerm: number;
    };

export interface RunLinkedInOptions {
  searchTerms?: string[];
  /** Cities as the user typed them (Tokyo, 東京...); empty = whole country. */
  cities?: string[];
  /** Selected country key, e.g. "japan". */
  country?: string | null;
  maxJobsPerTerm?: number;
  token?: string;
  actorId?: string;
  datePosted?: string;
  client?: ApifyLike;
  onProgress?: (event: LinkedInProgressEvent) => void;
  shouldCancel?: () => boolean;
}

export interface LinkedInResult {
  success: boolean;
  jobs: CreateJobInput[];
  error?: string;
}

function toStr(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * LinkedIn location strings to search. A city gets the country appended
 * ("Tokyo, Japan") because LinkedIn otherwise picks the best-known place with
 * that name; 東京 is sent as Tokyo. No city searches the whole country.
 */
export function resolveLinkedInLocations(
  cities: readonly string[] | undefined,
  country: string | null | undefined,
): Array<string | undefined> {
  const countryKey = normalizeCountryKey(country ?? "");
  const countryLabel = countryKey ? formatCountryLabel(countryKey) : "";
  const places = (cities ?? [])
    .map((city) => city.trim())
    .filter(Boolean)
    .map((city) => toEnglishJapanPlace(city));
  if (places.length === 0) return [countryLabel || undefined];

  return [
    ...new Set(
      places.map((place) =>
        countryLabel &&
        getCountryIso2Code(countryKey) &&
        !matchesRequestedCountry(place, countryKey)
          ? `${place}, ${countryLabel}`
          : place,
      ),
    ),
  ];
}

function buildLocationEvidence(
  location: string | undefined,
  searchCountry: string | null | undefined,
): JobLocationEvidence | undefined {
  if (!location) return undefined;
  const parts = location.split(",").map((part) => part.trim());
  // "Chiyoda, Tokyo, Japan" names its country; "Tokyo, Tokyo" does not, and
  // the search country is the best evidence then.
  const country =
    getCountryIso2Code(parts.at(-1) ?? "") ??
    getCountryIso2Code(searchCountry ?? "");
  return {
    location,
    ...(country ? { country } : {}),
    source: "linkedin",
  };
}

/** LinkedIn's job number, from the result id or the end of its URL. */
function getLinkedInJobNumber(
  item: Record<string, unknown>,
  url: string,
): string | undefined {
  const id = toStr(item.id);
  if (id && /^\d+$/.test(id)) return id;
  return url.match(/\/jobs\/view\/(?:[^/?#]*-)?(\d+)/)?.[1];
}

/** Removes LinkedIn's tracking query (?refId=...&trackingId=...). */
function cleanJobUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

export function mapLinkedInItem(
  item: Record<string, unknown>,
  options: { searchCountry?: string | null } = {},
): CreateJobInput | null {
  const rawUrl = toStr(item.url) ?? toStr(item.link);
  if (!rawUrl) return null;
  // Fork: the same URL and id format JobSpy stored (www.linkedin.com/jobs/
  // view/<number>, "li-<number>"), so jobs found before the switch to Apify
  // are recognised and not imported a second time.
  const jobNumber = getLinkedInJobNumber(item, rawUrl);
  const jobUrl = jobNumber
    ? `https://www.linkedin.com/jobs/view/${jobNumber}`
    : cleanJobUrl(rawUrl);
  const location = toStr(item.location);
  const postedDate = toStr(item.postedDate) ?? toStr(item.postedAt);

  return {
    source: "linkedin",
    sourceJobId: jobNumber ? `li-${jobNumber}` : (toStr(item.id) ?? jobUrl),
    title: toStr(item.title) ?? "Unknown Title",
    employer: toStr(item.companyName) ?? "Unknown Employer",
    employerUrl: toStr(item.companyUrl) ?? toStr(item.companyLinkedinUrl),
    jobUrl,
    applicationLink: toStr(item.applyUrl) ?? jobUrl,
    location,
    locationEvidence: buildLocationEvidence(location, options.searchCountry),
    salary: toStr(item.salary),
    datePosted: postedDate?.slice(0, 10),
    jobType: toStr(item.contractType) ?? toStr(item.employmentType),
    jobLevel: toStr(item.experienceLevel) ?? toStr(item.seniorityLevel),
    // valig's "workType" holds the industry, e.g. "Business Consulting".
    companyIndustry:
      toStr(item.sector) ?? toStr(item.workType) ?? toStr(item.industries),
    jobDescription: toStr(item.description) ?? toStr(item.descriptionText),
  };
}

export async function runLinkedIn(
  options: RunLinkedInOptions = {},
): Promise<LinkedInResult> {
  const token = options.token ?? process.env.APIFY_TOKEN?.trim();
  if (!options.client && !token) {
    return {
      success: false,
      jobs: [],
      error: "Missing Apify credentials (APIFY_TOKEN)",
    };
  }

  const client: ApifyLike =
    options.client ?? (new ApifyClient({ token }) as unknown as ApifyLike);
  const actorId =
    options.actorId ?? process.env.LINKEDIN_APIFY_ACTOR_ID ?? DEFAULT_ACTOR_ID;
  const datePosted =
    options.datePosted ??
    process.env.LINKEDIN_APIFY_DATE_POSTED ??
    DEFAULT_DATE_POSTED;
  const searchTerms = (options.searchTerms ?? [])
    .map((term) => term.trim())
    .filter(Boolean);
  if (searchTerms.length === 0) return { success: true, jobs: [] };

  const locations = resolveLinkedInLocations(options.cities, options.country);
  const maxJobsPerTerm = Math.min(
    MAX_JOBS_PER_RUN,
    Math.max(1, options.maxJobsPerTerm ?? 25),
  );
  const perRun = Math.max(1, Math.ceil(maxJobsPerTerm / locations.length));
  const termTotal = searchTerms.length * locations.length;

  const jobs: CreateJobInput[] = [];
  const seen = new Set<string>();
  const errors: string[] = [];
  let termIndex = 0;

  for (const location of locations) {
    for (const searchTerm of searchTerms) {
      if (options.shouldCancel?.()) return { success: true, jobs };
      termIndex += 1;
      options.onProgress?.({
        type: "term_start",
        termIndex,
        termTotal,
        searchTerm,
      });

      let jobsFoundTerm = 0;
      try {
        const run = await client.actor(actorId).call({
          keywords: searchTerm,
          ...(location ? { location } : {}),
          datePosted,
          limit: perRun,
        });
        const { items } = await client
          .dataset(run.defaultDatasetId)
          .listItems({ limit: perRun });

        for (const raw of items) {
          if (!raw || typeof raw !== "object") continue;
          const job = mapLinkedInItem(raw as Record<string, unknown>, {
            searchCountry: options.country,
          });
          if (!job) continue;
          const key = job.sourceJobId ?? job.jobUrl;
          if (seen.has(key)) continue;
          seen.add(key);
          jobs.push(job);
          jobsFoundTerm += 1;
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }

      options.onProgress?.({
        type: "term_complete",
        termIndex,
        termTotal,
        searchTerm,
        jobsFoundTerm,
      });
    }
  }

  if (jobs.length === 0 && errors.length > 0) {
    return { success: false, jobs: [], error: errors[0] };
  }
  return { success: true, jobs };
}
