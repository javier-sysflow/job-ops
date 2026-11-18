import type { CreateJobInput } from "@shared/types/jobs";
import { ApifyClient } from "apify-client";
import { findPrefecture, PREFECTURES, type Prefecture } from "./prefectures";

/**
 * マイナビ転職 (tenshoku.mynavi.jp) through an Apify actor. Mynavi blocks
 * plain scraping, so the actor runs on Apify with the server's APIFY_TOKEN.
 */
const DEFAULT_ACTOR_ID = "getascraper/mynavi-scraper";
const ALL_JAPAN = "0";
const MAX_JOBS_PER_RUN = 100;
const DISPLAY_LOCATION_LIMIT = 3;

/** The two Apify client calls this runner uses (injectable for tests). */
export interface ApifyLike {
  actor(id: string): {
    call(input: Record<string, unknown>): Promise<{ defaultDatasetId: string }>;
  };
  dataset(id: string): {
    listItems(options: { limit: number }): Promise<{ items: unknown[] }>;
  };
}

export type MynaviProgressEvent =
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

export interface RunMynaviOptions {
  searchTerms?: string[];
  /** Places the user searches in (Tokyo, 東京, 横浜...); empty = all Japan. */
  cities?: string[];
  remoteOnly?: boolean;
  maxJobsPerTerm?: number;
  token?: string;
  actorId?: string;
  client?: ApifyLike;
  onProgress?: (event: MynaviProgressEvent) => void;
  shouldCancel?: () => boolean;
}

export interface MynaviResult {
  success: boolean;
  jobs: CreateJobInput[];
  error?: string;
}

type MynaviPlace = { region: string; city: string | null };

function toStr(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toNum(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function parsePlaces(value: unknown): MynaviPlace[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const places: MynaviPlace[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const region = toStr((entry as Record<string, unknown>).region);
    if (!region) continue;
    const city = toStr((entry as Record<string, unknown>).city) ?? null;
    const key = `${region}|${city ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    places.push({ region, city });
  }
  return places;
}

function formatPlaces(
  places: MynaviPlace[],
  limit: number,
): string | undefined {
  if (places.length === 0) return undefined;
  const shown = places
    .slice(0, limit)
    .map((place) => `${place.region}${place.city ?? ""}`);
  const more = places.length - shown.length;
  return more > 0 ? `${shown.join(" / ")} ほか${more}か所` : shown.join(" / ");
}

/**
 * Location text for matching a search city. Location matching compares whole
 * words, so each prefecture appears as English, short and full Japanese names
 * (Tokyo 東京 東京都) followed by its cities.
 */
function buildMatchLocation(places: MynaviPlace[]): {
  location: string;
  prefectures: Prefecture[];
} {
  const groups = new Map<
    string,
    { prefecture: Prefecture | null; cities: Set<string>; region: string }
  >();
  for (const place of places) {
    const group = groups.get(place.region) ?? {
      prefecture: findPrefecture(place.region),
      cities: new Set<string>(),
      region: place.region,
    };
    if (place.city) group.cities.add(place.city);
    groups.set(place.region, group);
  }

  const parts: string[] = [];
  const prefectures: Prefecture[] = [];
  for (const group of groups.values()) {
    const names = group.prefecture
      ? [group.prefecture.en, group.prefecture.short, group.prefecture.ja]
      : [group.region];
    if (group.prefecture) prefectures.push(group.prefecture);
    parts.push([...new Set(names), ...group.cities].join(" "));
  }
  parts.push("Japan");
  return { location: parts.join(", "), prefectures };
}

function buildDescription(
  item: Record<string, unknown>,
  places: MynaviPlace[],
): string | undefined {
  const conditions = Array.isArray(item.conditions)
    ? item.conditions.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const expiry = toStr(item.date_expiry)?.slice(0, 10);
  const facts = [
    ["雇用形態", toStr(item.employment_type)],
    ["初年度年収", toStr(item.first_year_income)],
    ["勤務地", formatPlaces(places, 8)],
    ["特徴", conditions.length > 0 ? conditions.join("・") : undefined],
    ["掲載終了予定", expiry],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const body =
    toStr(item.description_text) ??
    [
      toStr(item.overview),
      toStr(item.requirements_text),
      toStr(item.work_hours),
      toStr(item.benefits),
    ]
      .filter(Boolean)
      .join("\n\n");

  const factsText = facts
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
  const description = [factsText, body].filter(Boolean).join("\n\n");
  return description || undefined;
}

/**
 * Puts the searched prefecture's places first, so a Tokyo search shows Tokyo
 * before the rest of a nationwide listing. A listing without location data
 * came back for that prefecture, so it gets the prefecture as its location.
 */
function orderPlaces(
  places: MynaviPlace[],
  searchedPrefecture: Prefecture | null | undefined,
): MynaviPlace[] {
  if (!searchedPrefecture) return places;
  if (places.length === 0) {
    return [{ region: searchedPrefecture.ja, city: null }];
  }
  const inSearched = places.filter(
    (place) => place.region === searchedPrefecture.ja,
  );
  const others = places.filter(
    (place) => place.region !== searchedPrefecture.ja,
  );
  return [...inSearched, ...others];
}

export function mapMynaviItem(
  item: Record<string, unknown>,
  options: { searchedPrefecture?: Prefecture | null } = {},
): CreateJobInput | null {
  const jobUrl = toStr(item.url);
  if (!jobUrl) return null;

  const places = orderPlaces(
    parsePlaces(item.locations),
    options.searchedPrefecture,
  );
  const match = buildMatchLocation(places);
  const isRemote = item.is_remote === true;
  const firstYearIncome = toStr(item.first_year_income);
  const salarySnippet = toStr(item.salary_snippet)?.replace(/…+$/u, "").trim();
  const salaryMin = toNum(item.salary_min);
  const salaryMax = toNum(item.salary_max);
  const hasSalaryRange = salaryMin !== undefined || salaryMax !== undefined;

  return {
    source: "mynavi",
    sourceJobId: toStr(item.job_id) ?? jobUrl,
    title: toStr(item.title) ?? "Unknown Title",
    employer: toStr(item.company_name) ?? "Unknown Employer",
    employerUrl: toStr(item.company_website),
    jobUrl,
    applicationLink: jobUrl,
    location: formatPlaces(places, DISPLAY_LOCATION_LIMIT),
    locationEvidence: {
      location: match.location,
      country: "Japan",
      countryKey: "japan",
      city: match.prefectures[0]?.en ?? null,
      regionHints: match.prefectures.map((prefecture) => prefecture.en),
      workplaceType: isRemote ? "remote" : null,
      isRemote,
      source: "mynavi",
    },
    salary: firstYearIncome ? `年収${firstYearIncome}` : salarySnippet,
    salaryMinAmount: salaryMin,
    salaryMaxAmount: salaryMax,
    salaryInterval: hasSalaryRange ? "yearly" : undefined,
    salaryCurrency: hasSalaryRange ? "JPY" : undefined,
    datePosted: toStr(item.date_posted),
    deadline: toStr(item.date_expiry),
    jobType: toStr(item.employment_type),
    isRemote: isRemote ? true : undefined,
    jobDescription: buildDescription(item, places),
  };
}

/** Mynavi prefecture codes for the searched places; "0" searches all Japan. */
export function resolvePrefectureCodes(
  cities: readonly string[] | undefined,
): string[] {
  const codes = new Set<string>();
  for (const city of cities ?? []) {
    const prefecture = findPrefecture(city);
    if (prefecture) codes.add(prefecture.code);
  }
  return codes.size > 0 ? [...codes] : [ALL_JAPAN];
}

export async function runMynavi(
  options: RunMynaviOptions = {},
): Promise<MynaviResult> {
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
    options.actorId ?? process.env.MYNAVI_APIFY_ACTOR_ID ?? DEFAULT_ACTOR_ID;
  const searchTerms =
    options.searchTerms && options.searchTerms.length > 0
      ? options.searchTerms
      : ["営業"];
  const prefectureCodes = resolvePrefectureCodes(options.cities);
  const maxJobsPerTerm = Math.min(
    MAX_JOBS_PER_RUN,
    Math.max(1, options.maxJobsPerTerm ?? 50),
  );
  const perRun = Math.max(
    1,
    Math.ceil(maxJobsPerTerm / prefectureCodes.length),
  );
  const termTotal = searchTerms.length * prefectureCodes.length;

  const jobs: CreateJobInput[] = [];
  const seen = new Set<string>();
  const errors: string[] = [];
  let termIndex = 0;

  for (const prefectureCode of prefectureCodes) {
    const searchedPrefecture =
      PREFECTURES.find((prefecture) => prefecture.code === prefectureCode) ??
      null;
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
          prefectureCode,
          employmentType: "all",
          remoteOnly: options.remoteOnly === true,
          fetchDetails: true,
          scrapeCorporateDetails: false,
          maxItems: perRun,
        });
        const { items } = await client
          .dataset(run.defaultDatasetId)
          .listItems({ limit: perRun });

        for (const raw of items) {
          if (!raw || typeof raw !== "object") continue;
          const job = mapMynaviItem(raw as Record<string, unknown>, {
            searchedPrefecture,
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
