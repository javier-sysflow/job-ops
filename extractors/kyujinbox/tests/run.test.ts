import { matchJobLocationIntent } from "@shared/job-matching.js";
import { describe, expect, it, vi } from "vitest";
import {
  type ApifyLike,
  isUnavailableListing,
  mapKyujinBoxItem,
  resolveKyujinBoxLocations,
  runKyujinBox,
} from "../src/run";

// Shaped like real getascraper/kyujinbox-scraper results (trimmed).
const LIVE = {
  job_id: "bcf465dfd32cabfe937a15e79eaa438a",
  title: "サステナビリティ戦略コンサルタントマネージャー\\/経験者の次の一歩に",
  company: "株式会社NAVIS",
  url: "https://xn--pckua2a7gp15o89zb.com/jb/bcf465dfd32cabfe937a15e79eaa438a",
  location: "東京都 港区",
  employment_type: "正社員",
  salary_raw: "年収900万円～1,500万円",
  salary_min: 9000000,
  salary_max: 15000000,
  salary_period: "annual",
  source: "株式会社NAVIS",
  station: "虎ノ門駅",
  walk_minutes: 3,
  description_text:
    "上場企業のサステナビリティ情報開示に関するプロジェクトマネジメント",
  requirements_text: "【必須要件】Big4でのコンサル経験",
};

const DEAD = {
  ...LIVE,
  job_id: "49b07bf8904f31766be8173552941442",
  url: "https://xn--pckua2a7gp15o89zb.com/jb/49b07bf8904f31766be8173552941442",
  source: "ビズリーチ - 登録エントリー",
  description_text:
    "お探しの求人は求人ボックスでの掲載が終了したか、掲載準備中のためご覧になれません。",
  requirements_text: undefined,
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

describe("mapKyujinBoxItem", () => {
  it("maps a live listing", () => {
    const job = mapKyujinBoxItem(LIVE);
    expect(job).toMatchObject({
      source: "kyujinbox",
      sourceJobId: LIVE.job_id,
      title:
        "サステナビリティ戦略コンサルタントマネージャー/経験者の次の一歩に",
      employer: "株式会社NAVIS",
      jobUrl: LIVE.url,
      location: "東京都 港区",
      salary: "年収900万円～1,500万円",
      salaryMinAmount: 9000000,
      salaryMaxAmount: 15000000,
      salaryInterval: "yearly",
      salaryCurrency: "JPY",
      jobType: "正社員",
    });
    expect(job?.jobDescription).toContain("最寄駅: 虎ノ門駅（徒歩3分）");
    expect(job?.jobDescription).toContain("【必須要件】");
    expect(job && matchJobLocationIntent(job, tokyoIntent).matched).toBe(true);
  });

  it("drops listings whose page is gone (dead doda/BizReach links)", () => {
    expect(isUnavailableListing(DEAD)).toBe(true);
    expect(mapKyujinBoxItem(DEAD)).toBeNull();
    expect(mapKyujinBoxItem({ ...LIVE, description_text: "" })).toBeNull();
  });
});

describe("resolveKyujinBoxLocations", () => {
  it("searches by prefecture name", () => {
    expect(resolveKyujinBoxLocations(["東京"])).toEqual(["東京都"]);
    expect(resolveKyujinBoxLocations(["Tokyo", "横浜"])).toEqual([
      "東京都",
      "神奈川県",
    ]);
    expect(resolveKyujinBoxLocations([])).toEqual([undefined]);
  });
});

describe("runKyujinBox", () => {
  it("runs per term and keeps only live listings", async () => {
    const call = vi.fn(async () => ({ defaultDatasetId: "ds" }));
    const client: ApifyLike = {
      actor: () => ({ call }),
      dataset: () => ({ listItems: async () => ({ items: [DEAD, LIVE] }) }),
    };
    const result = await runKyujinBox({
      client,
      searchTerms: ["サステナビリティ コンサルタント"],
      cities: ["東京"],
      maxJobsPerTerm: 12,
    });
    expect(call).toHaveBeenCalledWith({
      keyword: "サステナビリティ コンサルタント",
      location: "東京都",
      includeDescription: true,
      maxItems: 12,
    });
    expect(result.jobs.map((job) => job.sourceJobId)).toEqual([LIVE.job_id]);
  });

  it("needs an Apify token", async () => {
    const previous = process.env.APIFY_TOKEN;
    delete process.env.APIFY_TOKEN;
    try {
      expect((await runKyujinBox({ searchTerms: ["営業"] })).error).toBe(
        "Missing Apify credentials (APIFY_TOKEN)",
      );
    } finally {
      if (previous !== undefined) process.env.APIFY_TOKEN = previous;
    }
  });
});
