import { normalizeCountryKey } from "@shared/location-support.js";
import type { CreateJobInput } from "@shared/types/jobs";

/**
 * Japan Dev (https://japan-dev.com) lists English-friendly and bilingual
 * tech jobs in Japan. There is no public API, so this reads the public
 * sitemap (robots.txt allows /jobs) and each job page's schema.org
 * JobPosting data, plus Japan Dev's own fields (Japanese level, remote
 * level, visa sponsorship) from the page payload. Requests are sequential-ish
 * with a delay and a hard per-run cap to stay polite.
 */
const SITEMAP_URL = "https://japan-dev.com/cdn/sitemaps/sitemap.xml";
const USER_AGENT =
  "job-ops self-hosted job search (+https://github.com/DaKheera47/job-ops)";
const MAX_PAGES_PER_RUN = 60;
const REQUEST_DELAY_MS = 300;
const CONCURRENCY = 2;

export type JapanDevWorkplaceType = "remote" | "hybrid" | "onsite";

export type JapanDevProgressEvent =
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

export interface RunJapanDevOptions {
  searchTerms?: string[];
  selectedCountry?: string;
  workplaceTypes?: JapanDevWorkplaceType[];
  maxJobsPerTerm?: number;
  onProgress?: (event: JapanDevProgressEvent) => void;
  shouldCancel?: () => boolean;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export interface JapanDevResult {
  success: boolean;
  jobs: CreateJobInput[];
  error?: string;
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
}

interface ParsedJapanDevJob {
  job: CreateJobInput;
  workplaceType?: JapanDevWorkplaceType;
  searchText: string;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

const JOB_URL_PATTERN = /^https:\/\/japan-dev\.com\/jobs\/[^/\s]+\/[^/\s]+$/;

export function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const block of xml.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
    const url = block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1];
    if (!url || !JOB_URL_PATTERN.test(url)) continue;
    const lastmod = block.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1];
    entries.push({ url, lastmod });
  }
  return entries.sort((left, right) =>
    (right.lastmod ?? "").localeCompare(left.lastmod ?? ""),
  );
}

function asciiTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function slugText(url: string): string {
  return url.split("/jobs/")[1]?.toLowerCase() ?? "";
}

/**
 * Job slugs are English (e.g. "acme-senior-backend-engineer-tokyo-ab12cd"),
 * so English terms pre-filter by slug before any page is fetched. Terms
 * without ASCII words (e.g. エンジニア) cannot use the slug, so they look at
 * the most recent listings and are matched against the page text instead.
 */
export function selectCandidateUrls(
  entries: SitemapEntry[],
  searchTerm: string,
  limit: number,
): { urls: string[]; needsTextMatch: boolean } {
  const tokens = asciiTokens(searchTerm);
  if (tokens.length === 0) {
    return {
      urls: entries.slice(0, limit).map((entry) => entry.url),
      needsTextMatch: searchTerm.trim().length > 0,
    };
  }
  const urls = entries
    .filter((entry) => {
      const slug = slugText(entry.url);
      return tokens.every((token) => slug.includes(token));
    })
    .slice(0, limit)
    .map((entry) => entry.url);
  return { urls, needsTextMatch: false };
}

function findJobPosting(html: string): JsonRecord | undefined {
  const scripts = html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  );
  for (const script of scripts) {
    try {
      const parsed: unknown = JSON.parse(script[1]);
      const candidates = Array.isArray(parsed)
        ? parsed
        : ((asRecord(parsed)?.["@graph"] as unknown[] | undefined) ?? [parsed]);
      for (const candidate of candidates) {
        const record = asRecord(candidate);
        if (record?.["@type"] === "JobPosting") return record;
      }
    } catch {
      // Ignore malformed blocks; other blocks may still hold the posting.
    }
  }
  return undefined;
}

/**
 * Japan Dev pages embed a Nuxt payload: a JSON array where objects map
 * field names to indexes into the same array. Resolve the job's own fields.
 */
function readNuxtJobFields(html: string): Record<string, unknown> {
  const match = html.match(
    /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!match) return {};
  try {
    const data: unknown = JSON.parse(match[1]);
    if (!Array.isArray(data)) return {};
    const job = data.find(
      (value) =>
        asRecord(value) &&
        "japanese_level_enum" in (value as JsonRecord) &&
        "remote_level" in (value as JsonRecord),
    ) as JsonRecord | undefined;
    if (!job) return {};
    const resolve = (key: string): unknown => {
      const index = job[key];
      return typeof index === "number" ? data[index] : undefined;
    };
    return {
      japaneseLevel: resolve("japanese_level_enum"),
      englishLevel: resolve("english_level_enum"),
      remoteLevel: resolve("remote_level"),
      candidateLocation: resolve("candidate_location"),
      sponsorsVisas: resolve("sponsors_visas"),
      seniority: resolve("seniority_level"),
    };
  } catch {
    return {};
  }
}

function humanizeEnum(value: unknown, prefix: string): string | undefined {
  const raw = asString(value);
  if (!raw) return undefined;
  const text = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
  const words = text.replace(/_/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : undefined;
}

export function toWorkplaceType(
  remoteLevel: unknown,
): JapanDevWorkplaceType | undefined {
  const raw = asString(remoteLevel)?.toLowerCase();
  if (!raw) return undefined;
  if (raw.includes("full")) return "remote";
  if (raw.includes("partial")) return "hybrid";
  if (raw.includes("none") || raw.endsWith("_no")) return "onsite";
  return undefined;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACTOR: "Contract",
  TEMPORARY: "Temporary",
  INTERN: "Internship",
};

const SALARY_INTERVALS: Record<string, string> = {
  HOUR: "hourly",
  DAY: "daily",
  WEEK: "weekly",
  MONTH: "monthly",
  YEAR: "yearly",
};

const SALARY_UNIT_LABELS: Record<string, string> = {
  HOUR: "hour",
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseJapanDevJobPage(
  html: string,
  url: string,
): ParsedJapanDevJob | null {
  const posting = findJobPosting(html);
  if (!posting) return null;

  const title = asString(posting.title);
  const organization = asRecord(posting.hiringOrganization);
  const employer = asString(organization?.name);
  if (!title || !employer) return null;

  const fields = readNuxtJobFields(html);
  const workplaceType = toWorkplaceType(fields.remoteLevel);
  const address = asRecord(asRecord(posting.jobLocation)?.address);
  const city =
    asString(address?.addressLocality) ?? asString(address?.addressRegion);
  const location = city ? `${city}, Japan` : "Japan";

  const baseSalary = asRecord(posting.baseSalary);
  const salaryValue = asRecord(baseSalary?.value);
  const salaryMin = asNumber(salaryValue?.minValue);
  const salaryMax = asNumber(salaryValue?.maxValue);
  const salaryCurrency = asString(baseSalary?.currency);
  const unitText = asString(salaryValue?.unitText)?.toUpperCase();
  const salaryInterval = unitText ? SALARY_INTERVALS[unitText] : undefined;
  const salaryUnit = unitText ? SALARY_UNIT_LABELS[unitText] : undefined;
  const salary =
    salaryMin !== undefined || salaryMax !== undefined
      ? `${salaryCurrency ? `${salaryCurrency} ` : ""}${[
          ...new Set([salaryMin, salaryMax]),
        ]
          .filter((value): value is number => value !== undefined)
          .map((value) => value.toLocaleString("en-US"))
          .join("–")}${salaryUnit ? ` / ${salaryUnit}` : ""}`
      : undefined;

  const facts = [
    ["Japanese level", humanizeEnum(fields.japaneseLevel, "japanese_level_")],
    ["English level", humanizeEnum(fields.englishLevel, "english_level_")],
    ["Remote", humanizeEnum(fields.remoteLevel, "remote_level_")],
    ["Visa sponsorship", humanizeEnum(fields.sponsorsVisas, "sponsors_visas_")],
    [
      "Applicants from",
      humanizeEnum(fields.candidateLocation, "candidate_location_"),
    ],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const factsHtml =
    facts.length > 0
      ? `<p>${facts
          .map(
            ([label, value]) =>
              `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}`,
          )
          .join(" · ")}</p>\n`
      : "";
  const description = asString(posting.description) ?? "";
  const employmentType = asString(posting.employmentType);

  const job: CreateJobInput = {
    source: "japandev",
    sourceJobId: url,
    title,
    employer,
    employerUrl: asString(organization?.sameAs),
    companyLogo: asString(organization?.logo),
    jobUrl: url,
    applicationLink: url,
    jobDescription: `${factsHtml}${description}` || undefined,
    location,
    locationEvidence: {
      location,
      city: city ?? null,
      country: "Japan",
      countryKey: "japan",
      workplaceType: workplaceType ?? null,
      isRemote: workplaceType === "remote",
      isHybrid: workplaceType === "hybrid",
      source: "japandev",
    },
    datePosted: asString(posting.datePosted),
    deadline: asString(posting.validThrough),
    jobType: employmentType
      ? (EMPLOYMENT_TYPE_LABELS[employmentType] ?? employmentType)
      : undefined,
    jobLevel: humanizeEnum(fields.seniority, "seniority_level_"),
    jobFunction: asString(posting.occupationalCategory),
    salary,
    salaryMinAmount: salaryMin,
    salaryMaxAmount: salaryMax,
    salaryCurrency,
    salaryInterval,
    salarySource: salary ? "japandev" : undefined,
    isRemote: workplaceType === "remote",
    workFromHomeType: workplaceType,
  };

  return {
    job,
    workplaceType,
    searchText: `${title} ${employer} ${stripTags(description)}`,
  };
}

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function textMatchesTerm(text: string, searchTerm: string): boolean {
  const term = normalizeForMatch(searchTerm);
  if (!term) return true;
  const haystack = normalizeForMatch(text);
  return term.split(" ").every((token) => haystack.includes(token));
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runJapanDev(
  options: RunJapanDevOptions = {},
): Promise<JapanDevResult> {
  const countryKey = normalizeCountryKey(options.selectedCountry);
  if (countryKey && countryKey !== "japan") {
    return { success: true, jobs: [] };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const headers = { "User-Agent": USER_AGENT, Accept: "text/html,*/*" };
  const maxJobsPerTerm = Math.max(1, Math.floor(options.maxJobsPerTerm ?? 50));
  const searchTerms = (options.searchTerms ?? [])
    .map((term) => term.trim())
    .filter(Boolean);
  if (searchTerms.length === 0) searchTerms.push("");

  let entries: SitemapEntry[];
  try {
    const response = await fetchImpl(SITEMAP_URL, { headers });
    if (!response.ok) {
      return {
        success: false,
        jobs: [],
        error: `Japan Dev sitemap returned ${response.status}`,
      };
    }
    entries = parseSitemap(await response.text());
  } catch (error) {
    return {
      success: false,
      jobs: [],
      error: `Japan Dev sitemap failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const pageCache = new Map<string, ParsedJapanDevJob | null>();
  const jobsByUrl = new Map<string, CreateJobInput>();
  let pagesFetched = 0;

  const fetchPage = async (url: string): Promise<ParsedJapanDevJob | null> => {
    if (pageCache.has(url)) return pageCache.get(url) ?? null;
    if (pagesFetched >= MAX_PAGES_PER_RUN) return null;
    pagesFetched += 1;
    if (pagesFetched > 1) await sleep(REQUEST_DELAY_MS);
    try {
      const response = await fetchImpl(url, { headers });
      const parsed = response.ok
        ? parseJapanDevJobPage(await response.text(), url)
        : null;
      pageCache.set(url, parsed);
      return parsed;
    } catch {
      pageCache.set(url, null);
      return null;
    }
  };

  for (const [index, searchTerm] of searchTerms.entries()) {
    if (options.shouldCancel?.()) break;
    const termIndex = index + 1;
    options.onProgress?.({
      type: "term_start",
      termIndex,
      termTotal: searchTerms.length,
      searchTerm,
    });

    const { urls, needsTextMatch } = selectCandidateUrls(
      entries,
      searchTerm,
      maxJobsPerTerm,
    );
    let foundForTerm = 0;
    for (let offset = 0; offset < urls.length; offset += CONCURRENCY) {
      if (options.shouldCancel?.() || foundForTerm >= maxJobsPerTerm) break;
      const batch = urls.slice(offset, offset + CONCURRENCY);
      const parsedBatch = await Promise.all(batch.map(fetchPage));
      for (const parsed of parsedBatch) {
        if (!parsed || foundForTerm >= maxJobsPerTerm) continue;
        if (needsTextMatch && !textMatchesTerm(parsed.searchText, searchTerm)) {
          continue;
        }
        if (
          options.workplaceTypes &&
          options.workplaceTypes.length > 0 &&
          parsed.workplaceType &&
          !options.workplaceTypes.includes(parsed.workplaceType)
        ) {
          continue;
        }
        foundForTerm += 1;
        jobsByUrl.set(parsed.job.jobUrl, parsed.job);
      }
    }

    options.onProgress?.({
      type: "term_complete",
      termIndex,
      termTotal: searchTerms.length,
      searchTerm,
      jobsFoundTerm: foundForTerm,
    });
  }

  return { success: true, jobs: [...jobsByUrl.values()] };
}
