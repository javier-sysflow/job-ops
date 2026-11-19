import {
  matchesRequestedCity,
  matchesRequestedCountry,
  shouldApplyStrictCityFilter,
} from "./search-cities.js";
import type { CreateJobInput } from "./types/jobs.js";
import type { LocationIntent } from "./types/location";
import { normalizeWhitespace } from "./utils/string";

const COMPANY_SUFFIXES = [
  "limited",
  "ltd",
  "llp",
  "plc",
  "inc",
  "incorporated",
  "corporation",
  "corp",
  "company",
  "co",
  "llc",
  "uk",
  "international",
  "intl",
  "group",
  "holdings",
  "t/a",
  "trading as",
  "&",
  "the",
];

function normalizeMatchText(value: string): string {
  const normalized = value.toLowerCase().trim();
  return normalizeWhitespace(
    normalized.replace(/[.,'"()[\]{}!?@#$%^&*+=|\\/<>:;`~_-]/g, " "),
  );
}

export function normalizeCompanyName(name: string): string {
  let normalized = normalizeMatchText(name);
  for (const suffix of COMPANY_SUFFIXES) {
    const regex = new RegExp(`\\b${suffix}\\b`, "gi");
    normalized = normalized.replace(regex, " ");
  }
  return normalizeWhitespace(normalized);
}

export function normalizeJobTitle(title: string): string {
  return normalizeMatchText(title);
}

export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  if (s1.includes(s2) || s2.includes(s1)) {
    const longerLen = Math.max(s1.length, s2.length);
    const shorterLen = Math.min(s1.length, s2.length);
    return Math.round((shorterLen / longerLen) * 100);
  }

  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

function normalizeLocationCandidate(value: string): string | null {
  const trimmed = normalizeWhitespace(value);
  return trimmed.length > 0 ? trimmed : null;
}

export function getJobLocationCandidates(job: {
  location?: string | null;
  locationEvidence?:
    | Array<{
        value?: string | null;
      }>
    | {
        location?: string | null;
        country?: string | null;
        city?: string | null;
        workplaceType?: "remote" | "hybrid" | "onsite" | null;
      }
    | null;
}): string[] {
  const evidenceCandidates = Array.isArray(job.locationEvidence)
    ? job.locationEvidence.map((item) => item.value)
    : job.locationEvidence
      ? [
          job.locationEvidence.location,
          job.locationEvidence.country,
          job.locationEvidence.city,
          job.locationEvidence.workplaceType,
        ]
      : [];
  const candidates = [job.location, ...evidenceCandidates];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const normalized = normalizeLocationCandidate(candidate);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }

  return out;
}

const REMOTE_LOCATION_PATTERN =
  /\bremote\b|フルリモート|完全リモート|完全在宅/iu;

/**
 * Remote by the source's flag, the location evidence, or a location label
 * such as "Remote, Japan" / フルリモート. A label like 東京都（リモート可）
 * means hybrid, so plain リモート does not count.
 */
function isRemoteJob(job: {
  location?: string | null;
  locationEvidence?: { workplaceType?: string | null } | null;
  isRemote?: boolean | null;
}): boolean {
  if (job.isRemote === true) return true;
  if (job.locationEvidence?.workplaceType === "remote") return true;
  return REMOTE_LOCATION_PATTERN.test(job.location ?? "");
}

export function matchJobLocationIntent(
  job: {
    location?: string | null;
    locationEvidence?: {
      location?: string | null;
      country?: string | null;
      city?: string | null;
      workplaceType?: "remote" | "hybrid" | "onsite" | null;
    } | null;
    isRemote?: boolean | null;
  },
  intent: LocationIntent,
  context: { nativeRadiusApplied?: boolean } = {},
): {
  matched: boolean;
  reasonCode: string;
  priority: 0 | 1;
} {
  const candidates = getJobLocationCandidates(job);
  const selectedCountry = intent.selectedCountry;

  if (intent.proximity) {
    const nearbyPlaceMatched = intent.cityLocations.some((place) =>
      candidates.some((candidate) => matchesRequestedCity(candidate, place)),
    );
    if (nearbyPlaceMatched || context.nativeRadiusApplied) {
      return { matched: true, reasonCode: "selected_location", priority: 1 };
    }
    if (
      intent.workplaceTypes.includes("remote") &&
      intent.geoScope !== "selected_only" &&
      job.isRemote === true
    ) {
      return { matched: true, reasonCode: "remote_worldwide", priority: 0 };
    }
    return { matched: false, reasonCode: "no_match", priority: 0 };
  }

  if (!selectedCountry) {
    return { matched: true, reasonCode: "unfiltered", priority: 0 };
  }

  const countryMatched = candidates.some((candidate) =>
    matchesRequestedCountry(candidate, selectedCountry),
  );

  if (countryMatched) {
    if (intent.cityLocations.length === 0) {
      return { matched: true, reasonCode: "selected_location", priority: 1 };
    }

    const cityMatched = intent.cityLocations.some((requestedCity) => {
      const strict = shouldApplyStrictCityFilter(
        requestedCity,
        selectedCountry,
      );
      if (!strict) return true;
      return candidates.some((candidate) =>
        matchesRequestedCity(candidate, requestedCity),
      );
    });

    if (cityMatched || intent.matchStrictness === "flexible") {
      return { matched: true, reasonCode: "selected_location", priority: 1 };
    }

    // Fork: a remote job inside the selected country ("Remote, Japan") needs
    // no city. Someone who ticked remote can take it from their own city,
    // even with "selected location only" and exact city matching.
    if (intent.workplaceTypes.includes("remote") && isRemoteJob(job)) {
      return { matched: true, reasonCode: "remote_in_country", priority: 0 };
    }
  }

  if (
    intent.workplaceTypes.includes("remote") &&
    intent.geoScope !== "selected_only" &&
    job.isRemote === true
  ) {
    return { matched: true, reasonCode: "remote_worldwide", priority: 0 };
  }

  return { matched: false, reasonCode: "no_match", priority: 0 };
}

const FUZZY_DEDUP_TITLE_THRESHOLD = 90;
const FUZZY_DEDUP_EMPLOYER_THRESHOLD = 85;

/**
 * Merge two CreateJobInput objects, preferring the first non-null/non-undefined
 * value for each optional field. Required fields (source, title, employer,
 * jobUrl) are taken from `base`.
 */
function mergeJobInputs(
  base: CreateJobInput,
  incoming: CreateJobInput,
): CreateJobInput {
  return {
    // Required — always from base
    source: base.source,
    title: base.title,
    employer: base.employer,
    jobUrl: base.jobUrl,
    // Optional — first non-null wins
    employerUrl: base.employerUrl ?? incoming.employerUrl,
    applicationLink: base.applicationLink ?? incoming.applicationLink,
    disciplines: base.disciplines ?? incoming.disciplines,
    deadline: base.deadline ?? incoming.deadline,
    salary: base.salary ?? incoming.salary,
    location: base.location ?? incoming.location,
    locationEvidence: base.locationEvidence ?? incoming.locationEvidence,
    degreeRequired: base.degreeRequired ?? incoming.degreeRequired,
    starting: base.starting ?? incoming.starting,
    jobDescription: base.jobDescription ?? incoming.jobDescription,
    sourceJobId: base.sourceJobId ?? incoming.sourceJobId,
    jobUrlDirect: base.jobUrlDirect ?? incoming.jobUrlDirect,
    datePosted: base.datePosted ?? incoming.datePosted,
    jobType: base.jobType ?? incoming.jobType,
    salarySource: base.salarySource ?? incoming.salarySource,
    salaryInterval: base.salaryInterval ?? incoming.salaryInterval,
    salaryMinAmount: base.salaryMinAmount ?? incoming.salaryMinAmount,
    salaryMaxAmount: base.salaryMaxAmount ?? incoming.salaryMaxAmount,
    salaryCurrency: base.salaryCurrency ?? incoming.salaryCurrency,
    isRemote: base.isRemote ?? incoming.isRemote,
    jobLevel: base.jobLevel ?? incoming.jobLevel,
    jobFunction: base.jobFunction ?? incoming.jobFunction,
    listingType: base.listingType ?? incoming.listingType,
    emails: base.emails ?? incoming.emails,
    companyIndustry: base.companyIndustry ?? incoming.companyIndustry,
    companyLogo: base.companyLogo ?? incoming.companyLogo,
    companyUrlDirect: base.companyUrlDirect ?? incoming.companyUrlDirect,
    companyAddresses: base.companyAddresses ?? incoming.companyAddresses,
    companyNumEmployees:
      base.companyNumEmployees ?? incoming.companyNumEmployees,
    companyRevenue: base.companyRevenue ?? incoming.companyRevenue,
    companyDescription: base.companyDescription ?? incoming.companyDescription,
    skills: base.skills ?? incoming.skills,
    experienceRange: base.experienceRange ?? incoming.experienceRange,
    companyRating: base.companyRating ?? incoming.companyRating,
    companyReviewsCount:
      base.companyReviewsCount ?? incoming.companyReviewsCount,
    vacancyCount: base.vacancyCount ?? incoming.vacancyCount,
    workFromHomeType: base.workFromHomeType ?? incoming.workFromHomeType,
  };
}

/**
 * Deduplicate a batch of discovered job listings by fuzzy-matching job title
 * and employer name. Near-duplicate entries (same role at the same company
 * scraped from different boards) are **merged** into a single enriched listing:
 * for each optional field, the first non-null value across all duplicates is
 * kept, so one listing's `location` and another's `salary` both survive.
 *
 * Reuses the existing `normalizeJobTitle`, `normalizeCompanyName`, and
 * `calculateSimilarity` helpers — no new normalization logic.
 *
 * @param jobs - Freshly discovered job inputs from the current scrape run.
 * @param opts - Optional threshold overrides.
 * @returns Deduplicated (and field-merged) list.
 */
export function deduplicateJobsByTitleAndEmployer(
  jobs: CreateJobInput[],
  opts?: {
    titleThreshold?: number;
    employerThreshold?: number;
  },
): CreateJobInput[] {
  const titleThreshold = opts?.titleThreshold ?? FUZZY_DEDUP_TITLE_THRESHOLD;
  const employerThreshold =
    opts?.employerThreshold ?? FUZZY_DEDUP_EMPLOYER_THRESHOLD;

  type PreparedEntry = {
    job: CreateJobInput;
    normalizedTitle: string;
    normalizedEmployer: string;
  };

  const merged: PreparedEntry[] = [];

  for (const incoming of jobs) {
    const normalizedTitle = normalizeJobTitle(incoming.title);
    const normalizedEmployer = normalizeCompanyName(incoming.employer);

    if (!normalizedTitle || !normalizedEmployer) {
      merged.push({ job: incoming, normalizedTitle, normalizedEmployer });
      continue;
    }

    const match = merged.find((entry) => {
      if (!entry.normalizedTitle || !entry.normalizedEmployer) return false;
      const titleScore = calculateSimilarity(
        normalizedTitle,
        entry.normalizedTitle,
      );
      if (titleScore <= titleThreshold) return false;
      const employerScore = calculateSimilarity(
        normalizedEmployer,
        entry.normalizedEmployer,
      );
      return employerScore > employerThreshold;
    });

    if (match) {
      // Merge incoming fields into the existing entry (first non-null wins).
      match.job = mergeJobInputs(match.job, incoming);
    } else {
      merged.push({ job: incoming, normalizedTitle, normalizedEmployer });
    }
  }

  return merged.map((entry) => entry.job);
}

/**
 * Fork: a key that is the same for every link to one posting. LinkedIn links
 * differ by subdomain and title slug (www.linkedin.com/jobs/view/123 and
 * jp.linkedin.com/jobs/view/consultant-at-kpmg-123) but end in the same job
 * number. Other links only lose utm_* tracking parameters and the #fragment.
 */
export function getJobIdentityKey(url: string): string {
  const linkedIn = url.match(/linkedin\.com\/jobs\/view\/(?:[^/?#]*-)?(\d+)/i);
  if (linkedIn) return `linkedin:${linkedIn[1]}`;
  try {
    const parsed = new URL(url.trim());
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^utm_/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export interface KnownJobIdentity {
  jobUrl: string;
  title: string;
  employer: string;
}

/**
 * Fork: splits freshly discovered jobs into new ones and ones already in the
 * user's list under another link: the same LinkedIn job number, or the same
 * title at the same employer from another site (the thresholds
 * deduplicateJobsByTitleAndEmployer uses within one run). Jobs whose exact
 * URL is already stored are kept, because createJobs skips those itself.
 */
export function filterJobsAlreadyKnown<
  T extends { jobUrl: string; title: string; employer: string },
>(jobs: T[], known: KnownJobIdentity[]): { fresh: T[]; duplicates: T[] } {
  const knownUrls = new Set(known.map((job) => job.jobUrl));
  const knownKeys = new Set(known.map((job) => getJobIdentityKey(job.jobUrl)));
  const titlesByEmployer = new Map<string, string[]>();
  for (const job of known) {
    const employer = normalizeCompanyName(job.employer);
    const title = normalizeJobTitle(job.title);
    if (!employer || !title) continue;
    const titles = titlesByEmployer.get(employer) ?? [];
    titles.push(title);
    titlesByEmployer.set(employer, titles);
  }
  const employers = [...titlesByEmployer.keys()];

  const isKnownElsewhere = (job: T): boolean => {
    if (knownKeys.has(getJobIdentityKey(job.jobUrl))) return true;
    const employer = normalizeCompanyName(job.employer);
    const title = normalizeJobTitle(job.title);
    if (!employer || !title) return false;
    return employers.some(
      (knownEmployer) =>
        calculateSimilarity(employer, knownEmployer) >
          FUZZY_DEDUP_EMPLOYER_THRESHOLD &&
        (titlesByEmployer.get(knownEmployer) ?? []).some(
          (knownTitle) =>
            calculateSimilarity(title, knownTitle) >
            FUZZY_DEDUP_TITLE_THRESHOLD,
        ),
    );
  };

  const fresh: T[] = [];
  const duplicates: T[] = [];
  for (const job of jobs) {
    if (!knownUrls.has(job.jobUrl) && isKnownElsewhere(job)) {
      duplicates.push(job);
    } else {
      fresh.push(job);
    }
  }
  return { fresh, duplicates };
}
