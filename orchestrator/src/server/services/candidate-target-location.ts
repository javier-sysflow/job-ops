/**
 * Fork: where the candidate is looking for work, taken from their search
 * settings. The scorer and Jev used to judge location fit against the address
 * on the résumé, so someone living abroad and moving back (a Ho Chi Minh City
 * address, searching 東京) lost points on every job for "relocating".
 */
import * as settingsRepo from "@server/repositories/settings";
import {
  formatCountryLabel,
  normalizeCountryKey,
} from "@shared/location-support.js";
import { resolveSearchCities } from "@shared/search-cities.js";

type WorkplaceType = "remote" | "hybrid" | "onsite";

export type CandidateTargetLocation = {
  /** Display label, e.g. "Japan". */
  country: string | null;
  cities: string[];
  workplaceTypes: WorkplaceType[];
  /**
   * Where the candidate means to work in person, e.g. "東京, Japan". Null for
   * remote-only searches: remote work happens wherever the candidate lives.
   */
  workLocation: string | null;
};

const NO_COUNTRY_KEYS = new Set(["", "worldwide", "usa/ca"]);

function parseWorkplaceTypes(raw: string | null | undefined): WorkplaceType[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is WorkplaceType =>
        value === "remote" || value === "hybrid" || value === "onsite",
    );
  } catch {
    return [];
  }
}

export function buildCandidateTargetLocation(settings: {
  country?: string | null;
  searchCities?: string | null;
  workplaceTypes?: string | null;
}): CandidateTargetLocation | null {
  const countryKey = normalizeCountryKey(settings.country);
  const country = NO_COUNTRY_KEYS.has(countryKey)
    ? null
    : formatCountryLabel(countryKey) || null;
  const cities = resolveSearchCities({ single: settings.searchCities ?? null });
  const workplaceTypes = parseWorkplaceTypes(settings.workplaceTypes);
  if (!country && cities.length === 0) return null;

  const remoteOnly =
    workplaceTypes.length > 0 &&
    workplaceTypes.every((type) => type === "remote");
  const place = [cities.join(" / "), country].filter(Boolean).join(", ");

  return {
    country,
    cities,
    workplaceTypes,
    workLocation: remoteOnly || !place ? null : place,
  };
}

export async function getCandidateTargetLocation(): Promise<CandidateTargetLocation | null> {
  const [country, searchCities, jobspyLocation, workplaceTypes] =
    await Promise.all([
      settingsRepo.getSetting("jobspyCountryIndeed"),
      settingsRepo.getSetting("searchCities"),
      settingsRepo.getSetting("jobspyLocation"),
      settingsRepo.getSetting("workplaceTypes"),
    ]);
  return buildCandidateTargetLocation({
    country,
    searchCities: searchCities ?? jobspyLocation ?? null,
    workplaceTypes,
  });
}

/**
 * The prompt profile with the résumé address swapped for the place the
 * candidate is searching in. Remote-only searches keep the résumé address.
 */
export function withTargetWorkLocation(
  profile: Record<string, unknown>,
  target: CandidateTargetLocation | null,
): Record<string, unknown> {
  if (!target?.workLocation) return profile;
  const basics =
    profile.basics && typeof profile.basics === "object"
      ? (profile.basics as Record<string, unknown>)
      : {};
  return { ...profile, basics: { ...basics, location: target.workLocation } };
}

/** Plain-English block appended to the scoring prompt. */
export function describeTargetLocationForPrompt(
  target: CandidateTargetLocation | null,
): string {
  if (!target) return "";
  const lines = ["CANDIDATE TARGET LOCATION (from their job-search settings):"];
  if (target.country) lines.push(`- Country: ${target.country}`);
  if (target.cities.length > 0) {
    lines.push(`- Cities: ${target.cities.join(", ")}`);
  }
  if (target.workplaceTypes.length > 0) {
    lines.push(`- Work arrangements wanted: ${target.workplaceTypes.join(", ")}`);
  }
  lines.push(
    target.workLocation
      ? "The candidate is searching for jobs here and is ready to work here. Judge location fit against this target location, not against any address on the résumé, and do not count moving or relocating there against the candidate."
      : "The candidate wants remote work. Judge location fit by whether the job can be done remotely from the candidate's location and target country.",
  );
  return lines.join("\n");
}
