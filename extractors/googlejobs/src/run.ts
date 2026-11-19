import { createHash } from "node:crypto";
import { toEnglishJapanPlace } from "@shared/japan-places.js";
import {
  formatCountryLabel,
  getCountryIso2Code,
  normalizeCountryKey,
} from "@shared/location-support.js";
import type { CreateJobInput } from "@shared/types/jobs";
import { ApifyClient } from "apify-client";

/**
 * Fork: Google Jobs (Google's job search) through an Apify actor. Google
 * gathers postings from many boards (JAC Recruitment, エコリク, OpenWork,
 * Indeed, company career pages...), so it covers boards that have no scraper
 * of their own, such as doda. The actor charges per results page (~10 jobs).
 */
const DEFAULT_ACTOR_ID = "johnvc/Google-Jobs-Scraper";
const DEFAULT_POSTED_WITHIN = "30d";
const JOBS_PER_PAGE = 10;
const MAX_PAGES_PER_SEARCH = 3;

/** The two Apify client calls this runner uses (injectable for tests). */
export interface ApifyLike {
  actor(id: string): {
    call(input: Record<string, unknown>): Promise<{ defaultDatasetId: string }>;
  };
  dataset(id: string): {
    listItems(options: { limit: number }): Promise<{ items: unknown[] }>;
  };
}

export type GoogleJobsProgressEvent =
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

export interface RunGoogleJobsOptions {
  searchTerms?: string[];
  /** Cities as the user typed them (Tokyo, 東京...); empty = whole country. */
  cities?: string[];
  /** Selected country key, e.g. "japan". */
  country?: string | null;
  maxJobsPerTerm?: number;
  token?: string;
  actorId?: string;
  client?: ApifyLike;
  now?: Date;
  onProgress?: (event: GoogleJobsProgressEvent) => void;
  shouldCancel?: () => boolean;
}

export interface GoogleJobsResult {
  success: boolean;
  jobs: CreateJobInput[];
  error?: string;
}

function toStr(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

/** Drops utm_* tracking parameters that Google adds to apply links. */
function stripTracking(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^utm_/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Turns Google's relative age ("8 日前", "11 時間前", "3 days ago", "30+ days
 * ago") into a YYYY-MM-DD date. Unknown text gives undefined.
 */
export function parseRelativePostedAt(
  text: string | undefined,
  now: Date = new Date(),
): string | undefined {
  if (!text) return undefined;
  const match = text.match(
    /(\d+)\+?\s*(分|時間|日|週間|か月|ヶ月|minute|hour|day|week|month)/i,
  );
  if (!match) return undefined;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const days =
    unit === "分" ||
    unit.startsWith("minute") ||
    unit === "時間" ||
    unit.startsWith("hour")
      ? 0
      : unit === "日" || unit.startsWith("day")
        ? amount
        : unit === "週間" || unit.startsWith("week")
          ? amount * 7
          : amount * 30;
  const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

/**
 * Google location to search: "Tokyo, Japan" for a city (東京 is sent as
 * Tokyo), the country name without one.
 */
export function resolveGoogleJobsLocations(
  cities: readonly string[] | undefined,
  country: string | null | undefined,
): Array<string | undefined> {
  const countryKey = normalizeCountryKey(country ?? "");
  const countryLabel = countryKey ? formatCountryLabel(countryKey) : "";
  const places = [
    ...new Set(
      (cities ?? [])
        .map((city) => city.trim())
        .filter(Boolean)
        .map((city) => toEnglishJapanPlace(city)),
    ),
  ];
  if (places.length === 0) return [countryLabel || undefined];
  return places.map((place) =>
    countryLabel && !place.toLowerCase().includes(countryLabel.toLowerCase())
      ? `${place}, ${countryLabel}`
      : place,
  );
}

export function mapGoogleJobsItem(
  item: Record<string, unknown>,
  options: { searchCountry?: string | null; now?: Date } = {},
): CreateJobInput | null {
  const applyOptions = Array.isArray(item.apply_options)
    ? item.apply_options.map(record)
    : [];
  const firstApplyLink = toStr(applyOptions[0]?.link);
  const rawUrl =
    toStr(item.source_link) ??
    (firstApplyLink ? stripTracking(firstApplyLink) : undefined) ??
    toStr(item.share_link);
  if (!rawUrl) return null;
  const jobUrl = stripTracking(rawUrl);

  const extensions = record(item.detected_extensions);
  const via = toStr(item.via);
  const location = toStr(item.location);
  const country = getCountryIso2Code(options.searchCountry ?? "");
  const description = toStr(item.description);
  const sourceKey = toStr(item.job_id) ?? jobUrl;

  return {
    source: "googlejobs",
    sourceJobId: createHash("sha1")
      .update(sourceKey)
      .digest("hex")
      .slice(0, 16),
    title: toStr(item.title) ?? toStr(item.job_title) ?? "Unknown Title",
    employer: toStr(item.company_name) ?? "Unknown Employer",
    jobUrl,
    applicationLink: firstApplyLink ? stripTracking(firstApplyLink) : jobUrl,
    location,
    locationEvidence: location
      ? {
          location,
          ...(country ? { country } : {}),
          source: "googlejobs",
        }
      : undefined,
    salary: toStr(extensions.salary),
    jobType: toStr(extensions.schedule_type),
    isRemote: extensions.work_from_home === true ? true : undefined,
    datePosted: parseRelativePostedAt(toStr(extensions.posted_at), options.now),
    jobDescription:
      [via ? `掲載元 / Listed on: ${via}` : undefined, description]
        .filter(Boolean)
        .join("\n\n") || undefined,
  };
}

export async function runGoogleJobs(
  options: RunGoogleJobsOptions = {},
): Promise<GoogleJobsResult> {
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
    options.actorId ??
    process.env.GOOGLEJOBS_APIFY_ACTOR_ID ??
    DEFAULT_ACTOR_ID;
  const searchTerms = (options.searchTerms ?? [])
    .map((term) => term.trim())
    .filter(Boolean);
  if (searchTerms.length === 0) return { success: true, jobs: [] };

  const countryCode = getCountryIso2Code(options.country ?? "")?.toLowerCase();
  const locations = resolveGoogleJobsLocations(options.cities, options.country);
  const maxJobsPerTerm = Math.min(
    MAX_PAGES_PER_SEARCH * JOBS_PER_PAGE,
    Math.max(1, options.maxJobsPerTerm ?? JOBS_PER_PAGE),
  );
  const perRun = Math.max(1, Math.ceil(maxJobsPerTerm / locations.length));
  const pages = Math.min(
    MAX_PAGES_PER_SEARCH,
    Math.max(1, Math.ceil(perRun / JOBS_PER_PAGE)),
  );
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
          query: searchTerm,
          ...(location ? { location } : {}),
          ...(countryCode ? { country: countryCode } : {}),
          num_results: perRun,
          max_pagination: pages,
          posted_within: DEFAULT_POSTED_WITHIN,
        });
        const { items } = await client
          .dataset(run.defaultDatasetId)
          .listItems({ limit: perRun });

        for (const raw of items) {
          if (!raw || typeof raw !== "object") continue;
          const job = mapGoogleJobsItem(raw as Record<string, unknown>, {
            searchCountry: options.country,
            now: options.now,
          });
          if (!job) continue;
          if (seen.has(job.jobUrl)) continue;
          seen.add(job.jobUrl);
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
