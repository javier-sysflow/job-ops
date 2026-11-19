import { findPrefecture } from "@shared/japan-places.js";
import type { CreateJobInput } from "@shared/types/jobs";
import { ApifyClient } from "apify-client";

/**
 * Fork: 求人ボックス (Kyujin Box, a large Japanese job aggregator) through an
 * Apify actor. Many listings it shows come from doda or BizReach and their
 * Kyujin Box page answers 404 ("お探しの求人は…掲載が終了したか、掲載準備中");
 * 9 of 10 results in our November 2026 tests. Those are dead links with no
 * description, so they are dropped; only live listings are imported.
 */
const DEFAULT_ACTOR_ID = "getascraper/kyujinbox-scraper";
const MAX_JOBS_PER_RUN = 100;
const UNAVAILABLE_MARKERS = [
  "掲載が終了",
  "ご覧になれません",
  "見つかりませんでした",
];

/** The two Apify client calls this runner uses (injectable for tests). */
export interface ApifyLike {
  actor(id: string): {
    call(input: Record<string, unknown>): Promise<{ defaultDatasetId: string }>;
  };
  dataset(id: string): {
    listItems(options: { limit: number }): Promise<{ items: unknown[] }>;
  };
}

export type KyujinBoxProgressEvent =
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

export interface RunKyujinBoxOptions {
  searchTerms?: string[];
  /** Places the user searches in (Tokyo, 東京, 横浜...); empty = all Japan. */
  cities?: string[];
  maxJobsPerTerm?: number;
  token?: string;
  actorId?: string;
  client?: ApifyLike;
  onProgress?: (event: KyujinBoxProgressEvent) => void;
  shouldCancel?: () => boolean;
}

export interface KyujinBoxResult {
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

/** The actor escapes slashes in titles ("営業\/法人"). */
function unescapeSlashes(value: string | undefined): string | undefined {
  return value?.replace(/\\\//g, "/");
}

export function isUnavailableListing(item: Record<string, unknown>): boolean {
  const description = toStr(item.description_text);
  if (!description) return true;
  return UNAVAILABLE_MARKERS.some((marker) => description.includes(marker));
}

/** Prefecture names (東京都) for the searched places; [undefined] = all Japan. */
export function resolveKyujinBoxLocations(
  cities: readonly string[] | undefined,
): Array<string | undefined> {
  const names = new Set<string>();
  for (const city of cities ?? []) {
    const prefecture = findPrefecture(city);
    if (prefecture) names.add(prefecture.ja);
  }
  return names.size > 0 ? [...names] : [undefined];
}

export function mapKyujinBoxItem(
  item: Record<string, unknown>,
): CreateJobInput | null {
  const jobUrl = toStr(item.url);
  if (!jobUrl || isUnavailableListing(item)) return null;

  const location = toStr(item.location);
  const prefecture = location ? findPrefecture(location.split(/\s/)[0]) : null;
  const salaryMin = toNum(item.salary_min);
  const salaryMax = toNum(item.salary_max);
  const period = toStr(item.salary_period);
  const station = toStr(item.station);
  const walk = toNum(item.walk_minutes);
  const via = toStr(item.source);
  const facts = [
    via ? `掲載元: ${via}` : undefined,
    toStr(item.employment_type)
      ? `雇用形態: ${toStr(item.employment_type)}`
      : undefined,
    toStr(item.salary_raw) ? `給与: ${toStr(item.salary_raw)}` : undefined,
    station
      ? `最寄駅: ${station}${walk !== undefined ? `（徒歩${walk}分）` : ""}`
      : undefined,
  ].filter(Boolean);

  return {
    source: "kyujinbox",
    sourceJobId: toStr(item.job_id) ?? jobUrl,
    title: unescapeSlashes(toStr(item.title)) ?? "Unknown Title",
    employer: toStr(item.company) ?? "Unknown Employer",
    jobUrl,
    applicationLink: jobUrl,
    location,
    locationEvidence: location
      ? {
          location,
          country: "JP",
          countryKey: "japan",
          city: prefecture?.en ?? null,
          source: "kyujinbox",
        }
      : undefined,
    salary: toStr(item.salary_raw),
    salaryMinAmount: salaryMin,
    salaryMaxAmount: salaryMax,
    salaryInterval:
      salaryMin !== undefined || salaryMax !== undefined
        ? period === "annual"
          ? "yearly"
          : period
        : undefined,
    salaryCurrency:
      salaryMin !== undefined || salaryMax !== undefined ? "JPY" : undefined,
    jobType: toStr(item.employment_type),
    jobDescription:
      [
        facts.join("\n"),
        toStr(item.description_text),
        toStr(item.requirements_text),
      ]
        .filter(Boolean)
        .join("\n\n") || undefined,
  };
}

export async function runKyujinBox(
  options: RunKyujinBoxOptions = {},
): Promise<KyujinBoxResult> {
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
    options.actorId ?? process.env.KYUJINBOX_APIFY_ACTOR_ID ?? DEFAULT_ACTOR_ID;
  const searchTerms = (options.searchTerms ?? [])
    .map((term) => term.trim())
    .filter(Boolean);
  if (searchTerms.length === 0) return { success: true, jobs: [] };

  const locations = resolveKyujinBoxLocations(options.cities);
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
          keyword: searchTerm,
          ...(location ? { location } : {}),
          includeDescription: true,
          maxItems: perRun,
        });
        const { items } = await client
          .dataset(run.defaultDatasetId)
          .listItems({ limit: perRun });

        for (const raw of items) {
          if (!raw || typeof raw !== "object") continue;
          const job = mapKyujinBoxItem(raw as Record<string, unknown>);
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
