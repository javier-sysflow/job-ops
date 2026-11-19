import { matchJobLocationIntent } from "@shared/job-matching.js";
import { describe, expect, it, vi } from "vitest";
import {
  type ApifyLike,
  formatDaijobLocations,
  mapDaijobItem,
  resolveDaijobLocations,
  runDaijob,
} from "../src/run";

// Shaped like a real santamaria-automations/daijob-jobs-scraper result.
const INTERTEK = {
  id: "1550315",
  title:
    "【Sustainability Sales Marketing & BD】企業の非財務価値を可視化/第三者認証",
  company_name: "インターテック・サーティフィケーション(株)",
  job_url: "https://www.daijob.com/en/jobs/detail/1550315",
  locations: ["Asia > Japan > Tokyo"],
  countries: ["Japan"],
  remote: false,
  salary_text: "JPY 6000K - JPY 12000K",
  salary_min: 6000000,
  salary_max: 12000000,
  salary_currency: "JPY",
  language_levels: [
    { language: "English", level: "Business Conversation Level", code: 4 },
    { language: "Japanese", level: "Fluent(JLPT Level 1 or N1)", code: 5 },
  ],
  posted_at: "2026-11-15",
  valid_through: null,
  job_types: ["Sales/AE - Other"],
  industries: ["Outsourcing"],
  position_level: "Manager Level",
  description_text: "■サステナビリティ・ESG領域におけるソリューション営業",
  requirements_text: "【いずれか必須】■無形系法人営業経験（3年以上）",
  working_hours_text: "09:00〜 17:30",
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

describe("mapDaijobItem", () => {
  it("maps a Daijob result with language levels and salary", () => {
    const job = mapDaijobItem(INTERTEK);
    expect(job).toMatchObject({
      source: "daijob",
      sourceJobId: "1550315",
      employer: "インターテック・サーティフィケーション(株)",
      jobUrl: INTERTEK.job_url,
      location: "Tokyo, Japan",
      salaryMinAmount: 6000000,
      salaryMaxAmount: 12000000,
      salaryInterval: "yearly",
      salaryCurrency: "JPY",
      datePosted: "2026-11-15",
      jobLevel: "Manager Level",
      jobFunction: "Sales/AE - Other",
      companyIndustry: "Outsourcing",
    });
    expect(job?.deadline).toBeUndefined();
    expect(job?.jobDescription).toContain(
      "Language / 語学: English: Business Conversation Level / Japanese: Fluent(JLPT Level 1 or N1)",
    );
    expect(job?.jobDescription).toContain("【いずれか必須】");
    expect(job && matchJobLocationIntent(job, tokyoIntent).matched).toBe(true);
  });

  it("formats place paths as board-style labels", () => {
    expect(
      formatDaijobLocations([
        "Asia > Japan > Tokyo > Shinagawa",
        "Asia > Japan > Osaka",
      ]),
    ).toBe("Shinagawa, Tokyo, Japan / Osaka, Japan");
    expect(formatDaijobLocations([])).toBeUndefined();
  });
});

describe("resolveDaijobLocations", () => {
  it("filters by English place names", () => {
    expect(resolveDaijobLocations(["東京", "Tokyo"])).toEqual(["Tokyo"]);
    expect(resolveDaijobLocations([])).toEqual([]);
  });
});

describe("runDaijob", () => {
  it("searches every term in one run, filtered to the city", async () => {
    const call = vi.fn(async () => ({ defaultDatasetId: "ds" }));
    const client: ApifyLike = {
      actor: () => ({ call }),
      dataset: () => ({
        listItems: async () => ({ items: [INTERTEK, INTERTEK] }),
      }),
    };
    const result = await runDaijob({
      client,
      searchTerms: ["sustainability", "脱炭素 コンサルタント"],
      cities: ["東京"],
      maxJobsPerTerm: 12,
    });
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith({
      searchQueries: ["sustainability", "脱炭素 コンサルタント"],
      locations: ["Tokyo"],
      maxResultsPerQuery: 12,
      maxResults: 24,
      includeDetails: true,
    });
    expect(result.jobs).toHaveLength(1);
  });

  it("reports the actor error", async () => {
    const client: ApifyLike = {
      actor: () => ({
        call: async () => {
          throw new Error("Actor run failed");
        },
      }),
      dataset: () => ({ listItems: async () => ({ items: [] }) }),
    };
    expect(await runDaijob({ client, searchTerms: ["sales"] })).toEqual({
      success: false,
      jobs: [],
      error: "Actor run failed",
    });
  });
});
