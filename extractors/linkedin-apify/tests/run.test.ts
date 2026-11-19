import { matchJobLocationIntent } from "@shared/job-matching.js";
import { describe, expect, it, vi } from "vitest";
import {
  type ApifyLike,
  mapLinkedInItem,
  resolveLinkedInLocations,
  runLinkedIn,
} from "../src/run";

// Shaped like a real valig/linkedin-jobs-scraper result (trimmed).
const CONSULTANT = {
  id: "4487328734",
  url: "https://jp.linkedin.com/jobs/view/sustainability-consultant-at-verdant-search-4487328734",
  title: "Sustainability Consultant",
  location: "Tokyo, Tokyo, Japan",
  postedDate: "2026-11-16T00:00:00.000Z",
  companyName: "Verdant Search",
  companyUrl: "https://jp.linkedin.com/company/verdant-search",
  experienceLevel: "Mid-Senior level",
  contractType: "Full-time",
  workType: "Staffing and Recruiting",
  salary: "¥10,000,000/yr - ¥19,000,000/yr",
  applyType: "EASY_APPLY",
  description: "Senior Sustainability Consultant to be based in Tokyo.",
  applyUrl: "",
};

const tokyoIntent = {
  selectedCountry: "japan",
  country: "japan",
  cityLocations: ["東京"],
  workplaceTypes: ["remote" as const, "hybrid" as const],
  geoScope: "selected_only" as const,
  searchScope: "selected_only" as const,
  matchStrictness: "exact_only" as const,
};

function fakeClient(itemsByCall: unknown[][]): {
  client: ApifyLike;
  call: ReturnType<typeof vi.fn>;
} {
  let index = 0;
  const call = vi.fn(async () => ({ defaultDatasetId: `ds-${index}` }));
  const client: ApifyLike = {
    actor: () => ({ call }),
    dataset: () => ({
      listItems: async () => ({ items: itemsByCall[index++] ?? [] }),
    }),
  };
  return { client, call };
}

describe("mapLinkedInItem", () => {
  it("maps an actor result to a LinkedIn job", () => {
    const job = mapLinkedInItem(CONSULTANT, { searchCountry: "japan" });
    expect(job).toMatchObject({
      source: "linkedin",
      sourceJobId: "4487328734",
      title: "Sustainability Consultant",
      employer: "Verdant Search",
      jobUrl: CONSULTANT.url,
      applicationLink: CONSULTANT.url,
      location: "Tokyo, Tokyo, Japan",
      salary: "¥10,000,000/yr - ¥19,000,000/yr",
      datePosted: "2026-11-16",
      jobType: "Full-time",
      jobLevel: "Mid-Senior level",
      companyIndustry: "Staffing and Recruiting",
      jobDescription: CONSULTANT.description,
    });
    expect(job?.locationEvidence).toMatchObject({ country: "JP" });
  });

  it("passes a Tokyo search typed as 東京 with exact matching", () => {
    for (const location of [
      "Tokyo, Tokyo, Japan",
      "Chiyoda, Tokyo, Japan",
      "Tokyo, Japan",
    ]) {
      const job = mapLinkedInItem(
        { ...CONSULTANT, location },
        { searchCountry: "japan" },
      );
      expect(job && matchJobLocationIntent(job, tokyoIntent).matched).toBe(
        true,
      );
    }
  });

  it("strips LinkedIn tracking parameters from the job URL", () => {
    const job = mapLinkedInItem({
      ...CONSULTANT,
      url: undefined,
      link: `${CONSULTANT.url}?position=1&pageNum=0&refId=abc&trackingId=xyz`,
    });
    expect(job?.jobUrl).toBe(CONSULTANT.url);
  });

  it("skips results without a URL", () => {
    expect(mapLinkedInItem({ ...CONSULTANT, url: "" })).toBeNull();
  });
});

describe("resolveLinkedInLocations", () => {
  it("adds the country and translates Japanese place names", () => {
    expect(resolveLinkedInLocations(["東京"], "japan")).toEqual([
      "Tokyo, Japan",
    ]);
    expect(resolveLinkedInLocations(["Osaka", "大阪"], "japan")).toEqual([
      "Osaka, Japan",
    ]);
  });

  it("searches the whole country without cities", () => {
    expect(resolveLinkedInLocations([], "japan")).toEqual(["Japan"]);
    expect(resolveLinkedInLocations(undefined, null)).toEqual([undefined]);
  });
});

describe("runLinkedIn", () => {
  it("needs an Apify token", async () => {
    const previous = process.env.APIFY_TOKEN;
    delete process.env.APIFY_TOKEN;
    try {
      const result = await runLinkedIn({ searchTerms: ["consultant"] });
      expect(result).toEqual({
        success: false,
        jobs: [],
        error: "Missing Apify credentials (APIFY_TOKEN)",
      });
    } finally {
      if (previous !== undefined) process.env.APIFY_TOKEN = previous;
    }
  });

  it("runs the actor per term with the English location and dedupes", async () => {
    const { client, call } = fakeClient([[CONSULTANT], [CONSULTANT]]);
    const result = await runLinkedIn({
      client,
      searchTerms: ["sustainability consultant", "脱炭素 コンサルタント"],
      cities: ["東京"],
      country: "japan",
      maxJobsPerTerm: 12,
    });

    expect(call).toHaveBeenCalledTimes(2);
    expect(call).toHaveBeenNthCalledWith(1, {
      keywords: "sustainability consultant",
      location: "Tokyo, Japan",
      datePosted: "r2592000",
      limit: 12,
    });
    expect(result.success).toBe(true);
    expect(result.jobs).toHaveLength(1);
  });

  it("reports the first error when every term fails", async () => {
    const client: ApifyLike = {
      actor: () => ({
        call: async () => {
          throw new Error("Actor run failed");
        },
      }),
      dataset: () => ({ listItems: async () => ({ items: [] }) }),
    };
    const result = await runLinkedIn({
      client,
      searchTerms: ["consultant"],
      country: "japan",
    });
    expect(result).toEqual({
      success: false,
      jobs: [],
      error: "Actor run failed",
    });
  });

  it("stops between terms when cancelled", async () => {
    const { client, call } = fakeClient([[CONSULTANT]]);
    let cancelled = false;
    const result = await runLinkedIn({
      client,
      searchTerms: ["a", "b"],
      country: "japan",
      onProgress: (event) => {
        if (event.type === "term_complete") cancelled = true;
      },
      shouldCancel: () => cancelled,
    });
    expect(call).toHaveBeenCalledTimes(1);
    expect(result.jobs).toHaveLength(1);
  });
});
