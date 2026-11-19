import { toEnglishJapanPlace } from "@shared/japan-places.js";
import type { CreateJobInput } from "@shared/types/jobs";
import { ApifyClient } from "apify-client";

/**
 * Fork: Daijob (daijob.com, bilingual Japanese/English jobs) through an
 * Apify actor. The actor takes every search keyword in one run and returns a
 * job found by several keywords once, so a whole search is a single run.
 */
const DEFAULT_ACTOR_ID = "santamaria-automations/daijob-jobs-scraper";
const MAX_JOBS_PER_TERM = 100;

/** The two Apify client calls this runner uses (injectable for tests). */
export interface ApifyLike {
  actor(id: string): {
    call(input: Record<string, unknown>): Promise<{ defaultDatasetId: string }>;
  };
  dataset(id: string): {
    listItems(options: { limit: number }): Promise<{ items: unknown[] }>;
  };
}

export type DaijobProgressEvent =
  | { type: "run_start"; termTotal: number }
  | { type: "run_complete"; termTotal: number; jobsFound: number };

export interface RunDaijobOptions {
  searchTerms?: string[];
  /** Cities as the user typed them (Tokyo, 東京...); empty = anywhere. */
  cities?: string[];
  maxJobsPerTerm?: number;
  token?: string;
  actorId?: string;
  client?: ApifyLike;
  onProgress?: (event: DaijobProgressEvent) => void;
  shouldCancel?: () => boolean;
}

export interface DaijobResult {
  success: boolean;
  jobs: CreateJobInput[];
  error?: string;
}

function toStr(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toNum(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function toStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

/**
 * Daijob place paths ("Asia > Japan > Tokyo > Chiyoda") as job-board style
 * labels ("Chiyoda, Tokyo, Japan"), joined with " / ".
 */
export function formatDaijobLocations(paths: string[]): string | undefined {
  const labels = paths
    .map((path) =>
      path
        .split(">")
        .map((part) => part.trim())
        .filter((part) => part && part !== "Asia")
        .reverse()
        .join(", "),
    )
    .filter(Boolean);
  return labels.length > 0 ? [...new Set(labels)].join(" / ") : undefined;
}

/** English place words for the actor's location filter (東京 → Tokyo). */
export function resolveDaijobLocations(
  cities: readonly string[] | undefined,
): string[] {
  return [
    ...new Set(
      (cities ?? [])
        .map((city) => city.trim())
        .filter(Boolean)
        .map((city) => toEnglishJapanPlace(city)),
    ),
  ];
}

export function mapDaijobItem(
  item: Record<string, unknown>,
): CreateJobInput | null {
  const jobUrl = toStr(item.job_url);
  if (!jobUrl) return null;

  const location = formatDaijobLocations(toStrings(item.locations));
  const countries = toStrings(item.countries);
  const salaryMin = toNum(item.salary_min);
  const salaryMax = toNum(item.salary_max);
  const currency = toStr(item.salary_currency);
  const languages = Array.isArray(item.language_levels)
    ? item.language_levels
        .map((entry) => {
          const level = entry as Record<string, unknown>;
          const language = toStr(level.language);
          const value = toStr(level.level);
          return language && value ? `${language}: ${value}` : undefined;
        })
        .filter(Boolean)
    : [];
  const facts = [
    languages.length > 0
      ? `Language / 語学: ${languages.join(" / ")}`
      : undefined,
    toStr(item.salary_text)
      ? `Salary / 給与: ${toStr(item.salary_text)}`
      : undefined,
    toStr(item.working_hours_text)
      ? `Working hours / 勤務時間: ${toStr(item.working_hours_text)}`
      : undefined,
  ].filter(Boolean);

  return {
    source: "daijob",
    sourceJobId: toStr(item.id) ?? jobUrl,
    title: toStr(item.title) ?? "Unknown Title",
    employer: toStr(item.company_name) ?? "Unknown Employer",
    employerUrl: toStr(item.company_website),
    jobUrl,
    applicationLink: jobUrl,
    location,
    locationEvidence: location
      ? {
          location,
          country:
            countries.includes("Japan") || /Japan/.test(location) ? "JP" : null,
          source: "daijob",
        }
      : undefined,
    salary: toStr(item.salary_text),
    salaryMinAmount: salaryMin,
    salaryMaxAmount: salaryMax,
    salaryInterval:
      salaryMin !== undefined || salaryMax !== undefined ? "yearly" : undefined,
    salaryCurrency:
      salaryMin !== undefined || salaryMax !== undefined ? currency : undefined,
    datePosted: toStr(item.posted_at),
    deadline: toStr(item.valid_through),
    isRemote: item.remote === true ? true : undefined,
    jobLevel: toStr(item.position_level),
    jobFunction: toStrings(item.job_types).join(", ") || undefined,
    companyIndustry: toStrings(item.industries).join(", ") || undefined,
    jobDescription:
      [
        facts.join("\n"),
        toStr(item.description_text) ?? toStr(item.snippet),
        toStr(item.requirements_text),
      ]
        .filter(Boolean)
        .join("\n\n") || undefined,
  };
}

export async function runDaijob(
  options: RunDaijobOptions = {},
): Promise<DaijobResult> {
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
    options.actorId ?? process.env.DAIJOB_APIFY_ACTOR_ID ?? DEFAULT_ACTOR_ID;
  const searchTerms = [
    ...new Set(
      (options.searchTerms ?? []).map((term) => term.trim()).filter(Boolean),
    ),
  ];
  if (searchTerms.length === 0) return { success: true, jobs: [] };
  if (options.shouldCancel?.()) return { success: true, jobs: [] };

  const perTerm = Math.min(
    MAX_JOBS_PER_TERM,
    Math.max(1, options.maxJobsPerTerm ?? 25),
  );
  const limit = perTerm * searchTerms.length;
  const locations = resolveDaijobLocations(options.cities);

  options.onProgress?.({ type: "run_start", termTotal: searchTerms.length });
  try {
    const run = await client.actor(actorId).call({
      searchQueries: searchTerms,
      ...(locations.length > 0 ? { locations } : {}),
      maxResultsPerQuery: perTerm,
      maxResults: limit,
      includeDetails: true,
    });
    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems({ limit });

    const jobs: CreateJobInput[] = [];
    const seen = new Set<string>();
    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const job = mapDaijobItem(raw as Record<string, unknown>);
      if (!job) continue;
      const key = job.sourceJobId ?? job.jobUrl;
      if (seen.has(key)) continue;
      seen.add(key);
      jobs.push(job);
    }
    options.onProgress?.({
      type: "run_complete",
      termTotal: searchTerms.length,
      jobsFound: jobs.length,
    });
    return { success: true, jobs };
  } catch (error) {
    return {
      success: false,
      jobs: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
