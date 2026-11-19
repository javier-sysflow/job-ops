import { matchJobLocationIntent } from "@shared/job-matching.js";
import { describe, expect, it, vi } from "vitest";
import {
  type ApifyLike,
  mapGoogleJobsItem,
  parseRelativePostedAt,
  resolveGoogleJobsLocations,
  runGoogleJobs,
} from "../src/run";

// Shaped like a real johnvc/Google-Jobs-Scraper result (trimmed).
const PWC = {
  title: "サステナビリティ・コンサルタント（SX×戦略・専門領域）【BMX-SX】",
  company_name: "PwCコンサルティング合同会社",
  location: "東京都",
  via: "JACリクルートメント",
  job_id: "eyJqb2JfdGl0bGUiOiJ0ZXN0In0=",
  source_link: "https://www.jac-recruitment.jp/search/NJB2108559/",
  share_link: "https://www.google.com/search?ibp=htl;jobs&q=x",
  apply_options: [
    {
      title: "JACリクルートメント",
      link: "https://www.jac-recruitment.jp/search/NJB2108559/?utm_campaign=google_jobs_apply&utm_source=google_jobs_apply&utm_medium=organic",
    },
  ],
  detected_extensions: {
    posted_at: "8 日前",
    salary: "年 ￥600万～￥1800万",
    schedule_type: "フルタイム",
  },
  description: "▼仕事内容：\nサステナビリティ戦略策定",
};

const NOW = new Date("2026-11-19T12:00:00Z");

const tokyoIntent = {
  selectedCountry: "japan",
  country: "japan",
  cityLocations: ["東京"],
  workplaceTypes: ["remote" as const, "hybrid" as const],
  geoScope: "selected_only" as const,
  searchScope: "selected_only" as const,
  matchStrictness: "exact_only" as const,
};

describe("mapGoogleJobsItem", () => {
  it("maps a Google Jobs result to a job with its real board link", () => {
    const job = mapGoogleJobsItem(PWC, { searchCountry: "japan", now: NOW });
    expect(job).toMatchObject({
      source: "googlejobs",
      title: PWC.title,
      employer: "PwCコンサルティング合同会社",
      jobUrl: "https://www.jac-recruitment.jp/search/NJB2108559/",
      applicationLink: "https://www.jac-recruitment.jp/search/NJB2108559/",
      location: "東京都",
      salary: "年 ￥600万～￥1800万",
      jobType: "フルタイム",
      datePosted: "2026-11-11",
    });
    expect(job?.sourceJobId).toMatch(/^[0-9a-f]{16}$/);
    expect(job?.jobDescription).toContain(
      "掲載元 / Listed on: JACリクルートメント",
    );
    expect(job?.locationEvidence).toMatchObject({ country: "JP" });
  });

  it("passes an exact 東京 search with a Japanese address label", () => {
    const job = mapGoogleJobsItem(
      { ...PWC, location: "東京都港区" },
      { searchCountry: "japan", now: NOW },
    );
    expect(job && matchJobLocationIntent(job, tokyoIntent).matched).toBe(true);
  });

  it("falls back to the apply link without tracking, then the share link", () => {
    expect(mapGoogleJobsItem({ ...PWC, source_link: undefined })?.jobUrl).toBe(
      "https://www.jac-recruitment.jp/search/NJB2108559/",
    );
    expect(
      mapGoogleJobsItem({
        ...PWC,
        source_link: undefined,
        apply_options: [],
      })?.jobUrl,
    ).toBe(PWC.share_link);
    expect(
      mapGoogleJobsItem({
        ...PWC,
        source_link: undefined,
        apply_options: [],
        share_link: undefined,
      }),
    ).toBeNull();
  });
});

describe("parseRelativePostedAt", () => {
  it("reads Japanese and English relative ages", () => {
    expect(parseRelativePostedAt("8 日前", NOW)).toBe("2026-11-11");
    expect(parseRelativePostedAt("11 時間前", NOW)).toBe("2026-11-19");
    expect(parseRelativePostedAt("3 days ago", NOW)).toBe("2026-11-16");
    expect(parseRelativePostedAt("30+ days ago", NOW)).toBe("2026-10-20");
    expect(parseRelativePostedAt("2 週間前", NOW)).toBe("2026-11-05");
    expect(parseRelativePostedAt("recently", NOW)).toBeUndefined();
  });
});

describe("resolveGoogleJobsLocations", () => {
  it("searches Tokyo, Japan for 東京 and the country without cities", () => {
    expect(resolveGoogleJobsLocations(["東京"], "japan")).toEqual([
      "Tokyo, Japan",
    ]);
    expect(resolveGoogleJobsLocations([], "japan")).toEqual(["Japan"]);
  });
});

describe("runGoogleJobs", () => {
  it("needs an Apify token", async () => {
    const previous = process.env.APIFY_TOKEN;
    delete process.env.APIFY_TOKEN;
    try {
      expect(await runGoogleJobs({ searchTerms: ["consultant"] })).toEqual({
        success: false,
        jobs: [],
        error: "Missing Apify credentials (APIFY_TOKEN)",
      });
    } finally {
      if (previous !== undefined) process.env.APIFY_TOKEN = previous;
    }
  });

  it("runs one search per term with Japan targeting and page budget", async () => {
    const call = vi.fn(async () => ({ defaultDatasetId: "ds" }));
    const client: ApifyLike = {
      actor: () => ({ call }),
      dataset: () => ({ listItems: async () => ({ items: [PWC] }) }),
    };
    const result = await runGoogleJobs({
      client,
      searchTerms: ["サステナビリティ コンサルタント", "energy consultant"],
      cities: ["東京"],
      country: "japan",
      maxJobsPerTerm: 12,
      now: NOW,
    });
    expect(call).toHaveBeenCalledTimes(2);
    expect(call).toHaveBeenNthCalledWith(1, {
      query: "サステナビリティ コンサルタント",
      location: "Tokyo, Japan",
      country: "jp",
      num_results: 12,
      max_pagination: 2,
      posted_within: "30d",
    });
    expect(result.success).toBe(true);
    expect(result.jobs).toHaveLength(1);
  });
});
