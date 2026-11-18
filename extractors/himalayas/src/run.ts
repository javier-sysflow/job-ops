import {
  getCountryIso2Code,
  normalizeCountryKey,
} from "@shared/location-support.js";
import type { CreateJobInput } from "@shared/types/jobs";

/**
 * Himalayas (https://himalayas.app) lists remote jobs and exposes a public
 * search API. Terms of use we follow: Apply buttons use `applicationLink`
 * unchanged, every job links back to its Himalayas page (`jobUrl`), and
 * expired jobs are dropped. See https://himalayas.app/api.
 */
const HIMALAYAS_SEARCH_URL = "https://himalayas.app/jobs/api/search";
const HIMALAYAS_PAGE_SIZE = 20;
const MAX_PAGES_PER_TERM = 10;
const REQUEST_DELAY_MS = 400;
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RETRY_AFTER_MS = 30_000;

export type HimalayasWorkplaceType = "remote" | "hybrid" | "onsite";

export type HimalayasProgressEvent =
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

export interface RunHimalayasOptions {
  searchTerms?: string[];
  selectedCountry?: string;
  workplaceTypes?: HimalayasWorkplaceType[];
  maxJobsPerTerm?: number;
  apiKey?: string;
  onProgress?: (event: HimalayasProgressEvent) => void;
  shouldCancel?: () => boolean;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export interface HimalayasResult {
  success: boolean;
  jobs: CreateJobInput[];
  error?: string;
}

interface HimalayasJob {
  guid?: unknown;
  title?: unknown;
  companyName?: unknown;
  companyLogo?: unknown;
  employmentType?: unknown;
  minSalary?: unknown;
  maxSalary?: unknown;
  salaryPeriod?: unknown;
  currency?: unknown;
  seniority?: unknown;
  locationRestrictions?: unknown;
  parentCategories?: unknown;
  description?: unknown;
  pubDate?: unknown;
  expiryDate?: unknown;
  applicationLink?: unknown;
}

interface HimalayasSearchResponse {
  jobs?: HimalayasJob[];
}

const SALARY_INTERVAL_BY_PERIOD: Record<string, string> = {
  hourly: "hourly",
  weekly: "weekly",
  monthly: "monthly",
  annual: "yearly",
};

const SALARY_UNIT_LABEL: Record<string, string> = {
  hourly: "hour",
  weekly: "week",
  fortnightly: "fortnight",
  monthly: "month",
  annual: "year",
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && !!item.trim(),
      )
    : [];
}

function unixSecondsToIso(value: unknown): string | undefined {
  const seconds = asNumber(value);
  return seconds === undefined
    ? undefined
    : new Date(seconds * 1000).toISOString();
}

function formatSalary(job: HimalayasJob): string | undefined {
  const min = asNumber(job.minSalary);
  const max = asNumber(job.maxSalary);
  if (min === undefined && max === undefined) return undefined;
  const currency = asString(job.currency) ?? "";
  const period = asString(job.salaryPeriod) ?? "annual";
  const amount =
    min !== undefined && max !== undefined && min !== max
      ? `${min.toLocaleString("en-US")}–${max.toLocaleString("en-US")}`
      : (min ?? max ?? 0).toLocaleString("en-US");
  const unit = SALARY_UNIT_LABEL[period] ?? "year";
  return `${currency ? `${currency} ` : ""}${amount} / ${unit}`;
}

/**
 * Resolve the `country` (or `worldwide`) query parameter. Himalayas
 * includes worldwide-open roles in country results, which is what a
 * job seeker based in that country wants.
 */
export function resolveCountryQuery(selectedCountry: string | undefined): {
  country?: string;
  worldwide?: boolean;
} {
  const countryKey = normalizeCountryKey(selectedCountry);
  if (!countryKey || countryKey === "worldwide") return { worldwide: true };
  const iso2 = getCountryIso2Code(countryKey);
  return iso2 ? { country: iso2 } : { worldwide: true };
}

const MAX_LISTED_COUNTRIES = 4;

/**
 * Some roles list dozens of eligible countries; keep the label readable and
 * lead with the candidate's own country when it is one of them. The full
 * list stays in locationEvidence.rawLocation for location matching.
 */
export function formatRemoteLocation(
  restrictions: string[],
  preferredCountry?: string,
): string {
  if (restrictions.length === 0) return "Remote (Worldwide)";
  if (restrictions.length <= MAX_LISTED_COUNTRIES) {
    return `Remote (${restrictions.join(", ")})`;
  }
  const preferred = preferredCountry?.trim().toLowerCase();
  const match = preferred
    ? restrictions.find((country) => country.toLowerCase() === preferred)
    : undefined;
  return match
    ? `Remote (${match} + ${restrictions.length - 1} other countries)`
    : `Remote (${restrictions.length} countries)`;
}

export function mapHimalayasJob(
  job: HimalayasJob,
  nowMs: number,
  preferredCountry?: string,
): CreateJobInput | null {
  const jobUrl = asString(job.guid);
  const title = asString(job.title);
  const employer = asString(job.companyName);
  if (!jobUrl || !title || !employer) return null;

  const expirySeconds = asNumber(job.expiryDate);
  if (expirySeconds !== undefined && expirySeconds * 1000 < nowMs) {
    return null;
  }

  const restrictions = asStringArray(job.locationRestrictions);
  const location = formatRemoteLocation(restrictions, preferredCountry);
  const period = asString(job.salaryPeriod);
  const seniority = asStringArray(job.seniority);
  const categories = asStringArray(job.parentCategories);

  return {
    source: "himalayas",
    sourceJobId: jobUrl,
    title,
    employer,
    jobUrl,
    applicationLink: asString(job.applicationLink) ?? jobUrl,
    jobDescription: asString(job.description),
    location,
    locationEvidence: {
      location,
      rawLocation: restrictions.join(", ") || null,
      isRemote: true,
      workplaceType: "remote",
      regionHints: restrictions,
      source: "himalayas",
    },
    datePosted: unixSecondsToIso(job.pubDate),
    deadline: unixSecondsToIso(job.expiryDate),
    jobType: asString(job.employmentType),
    jobLevel: seniority.length > 0 ? seniority.join(", ") : undefined,
    jobFunction: categories.length > 0 ? categories.join(", ") : undefined,
    salary: formatSalary(job),
    salaryMinAmount: asNumber(job.minSalary),
    salaryMaxAmount: asNumber(job.maxSalary),
    salaryCurrency: asString(job.currency),
    salaryInterval: period ? SALARY_INTERVAL_BY_PERIOD[period] : undefined,
    salarySource: formatSalary(job) ? "himalayas" : undefined,
    companyLogo: asString(job.companyLogo),
    isRemote: true,
    workFromHomeType: "remote",
  };
}

function parseRetryAfterMs(value: string | null): number {
  const seconds = value ? Number.parseFloat(value) : Number.NaN;
  if (!Number.isFinite(seconds) || seconds <= 0) return 5_000;
  return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runHimalayas(
  options: RunHimalayasOptions = {},
): Promise<HimalayasResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const nowMs = (options.now ?? Date.now)();

  // Every Himalayas job is remote; skip when the run excludes remote work.
  if (
    options.workplaceTypes &&
    options.workplaceTypes.length > 0 &&
    !options.workplaceTypes.includes("remote")
  ) {
    return { success: true, jobs: [] };
  }

  const searchTerms = (options.searchTerms ?? [])
    .map((term) => term.trim())
    .filter(Boolean);
  if (searchTerms.length === 0) searchTerms.push("");

  const maxJobsPerTerm = Math.max(1, Math.floor(options.maxJobsPerTerm ?? 50));
  const countryQuery = resolveCountryQuery(options.selectedCountry);
  const countryKey = normalizeCountryKey(options.selectedCountry);
  const preferredCountry =
    countryKey && countryKey !== "worldwide"
      ? countryKey.replace(/\b\w/g, (char) => char.toUpperCase())
      : undefined;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.apiKey) headers.Authorization = `Bearer ${options.apiKey}`;

  const jobsById = new Map<string, CreateJobInput>();
  let requestCount = 0;

  try {
    for (const [index, searchTerm] of searchTerms.entries()) {
      if (options.shouldCancel?.()) break;
      const termIndex = index + 1;
      options.onProgress?.({
        type: "term_start",
        termIndex,
        termTotal: searchTerms.length,
        searchTerm,
      });

      let foundForTerm = 0;
      for (let page = 1; page <= MAX_PAGES_PER_TERM; page++) {
        if (options.shouldCancel?.() || foundForTerm >= maxJobsPerTerm) break;

        const url = new URL(HIMALAYAS_SEARCH_URL);
        if (searchTerm) url.searchParams.set("q", searchTerm);
        if (countryQuery.country) {
          url.searchParams.set("country", countryQuery.country);
        } else {
          url.searchParams.set("worldwide", "true");
        }
        url.searchParams.set("sort", "recent");
        url.searchParams.set("page", String(page));

        if (requestCount > 0) await sleep(REQUEST_DELAY_MS);
        let response: Response | undefined;
        for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
          requestCount += 1;
          response = await fetchImpl(url.toString(), { headers });
          if (response.status !== 429) break;
          if (attempt === MAX_RATE_LIMIT_RETRIES) break;
          await sleep(parseRetryAfterMs(response.headers.get("retry-after")));
        }
        if (!response?.ok) {
          throw new Error(
            `Himalayas API returned ${response?.status ?? "no response"}`,
          );
        }

        const payload = (await response.json()) as HimalayasSearchResponse;
        const pageJobs = Array.isArray(payload.jobs) ? payload.jobs : [];
        if (pageJobs.length === 0) break;

        for (const rawJob of pageJobs) {
          if (foundForTerm >= maxJobsPerTerm) break;
          const job = mapHimalayasJob(rawJob, nowMs, preferredCountry);
          if (!job) continue;
          foundForTerm += 1;
          jobsById.set(job.jobUrl, job);
        }

        if (pageJobs.length < HIMALAYAS_PAGE_SIZE) break;
      }

      options.onProgress?.({
        type: "term_complete",
        termIndex,
        termTotal: searchTerms.length,
        searchTerm,
        jobsFoundTerm: foundForTerm,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (jobsById.size === 0) {
      return { success: false, jobs: [], error: message };
    }
  }

  return { success: true, jobs: [...jobsById.values()] };
}
