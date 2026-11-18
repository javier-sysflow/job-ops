import { describe, expect, it, vi } from "vitest";
import { findPrefecture } from "../src/prefectures";
import {
  type ApifyLike,
  mapMynaviItem,
  resolvePrefectureCodes,
  runMynavi,
} from "../src/run";

// Shaped like a real getascraper/mynavi-scraper result (trimmed).
const BUS_DRIVER = {
  job_id: "167418-1-44-1",
  title: "路線バス運転士／バス運転手・バス乗務員",
  company_name: "東急バス株式会社",
  url: "https://tenshoku.mynavi.jp/jobinfo-167418-1-44-1/",
  overview: "憧れの東急沿線を走る【路線バス運転士】未経験OK",
  employment_type: "正社員",
  conditions: ["職種・業種未経験OK", "転勤なし"],
  is_remote: false,
  date_posted: "2026-10-20T00:00:00.000Z",
  date_expiry: "2027-01-11T00:00:00.000Z",
  salary_snippet: "月給27万円以上＋諸手当＋賞与年2回 ★初年度の想定年収…",
  first_year_income: "450万円～500万円",
  salary_min: 4500000,
  salary_max: 5000000,
  locations: [
    { region: "東京都", city: "品川区" },
    { region: "神奈川県", city: "横浜市" },
    { region: "東京都", city: "目黒区" },
    { region: "東京都", city: "大田区" },
  ],
  description_text: "■ 仕事内容\n路線バスの安全運行",
  company_website: "https://www.tokyubus.co.jp/",
};

const SALES_REMOTE = {
  job_id: "200001-1-1-1",
  title: "法人営業（フルリモート）",
  company_name: "株式会社サンプル",
  url: "https://tenshoku.mynavi.jp/jobinfo-200001-1-1-1/",
  employment_type: "正社員",
  is_remote: true,
  salary_snippet: "月給30万円〜",
  locations: [],
  overview: "リモートで法人営業",
  requirements_text: "営業経験3年以上",
};

function fakeClient(itemsByRun: unknown[][]): {
  client: ApifyLike;
  calls: Array<Record<string, unknown>>;
} {
  const calls: Array<Record<string, unknown>> = [];
  let runIndex = 0;
  const client: ApifyLike = {
    actor: () => ({
      call: async (input) => {
        calls.push(input);
        const id = `dataset-${runIndex}`;
        runIndex += 1;
        return { defaultDatasetId: id };
      },
    }),
    dataset: (id) => ({
      listItems: async () => ({
        items: itemsByRun[Number(id.split("-")[1])] ?? [],
      }),
    }),
  };
  return { client, calls };
}

describe("findPrefecture", () => {
  it("understands English, Japanese and major city names", () => {
    expect(findPrefecture("Tokyo")?.code).toBe("13");
    expect(findPrefecture("東京")?.code).toBe("13");
    expect(findPrefecture("東京都")?.code).toBe("13");
    expect(findPrefecture("Tokyo Prefecture")?.code).toBe("13");
    expect(findPrefecture("京都")?.code).toBe("26");
    expect(findPrefecture("Kyoto")?.code).toBe("26");
    expect(findPrefecture("大阪府")?.code).toBe("27");
    expect(findPrefecture("Yokohama")?.code).toBe("14");
    expect(findPrefecture("名古屋")?.code).toBe("23");
    expect(findPrefecture("Shibuya")).toBeNull();
  });
});

describe("resolvePrefectureCodes", () => {
  it("searches all Japan when no known place is given", () => {
    expect(resolvePrefectureCodes([])).toEqual(["0"]);
    expect(resolvePrefectureCodes(["Shibuya"])).toEqual(["0"]);
  });

  it("deduplicates prefectures", () => {
    expect(resolvePrefectureCodes(["Tokyo", "東京", "Osaka"])).toEqual([
      "13",
      "27",
    ]);
  });
});

describe("mapMynaviItem", () => {
  it("maps a Mynavi listing into a job", () => {
    const job = mapMynaviItem(BUS_DRIVER);
    expect(job).toMatchObject({
      source: "mynavi",
      sourceJobId: "167418-1-44-1",
      title: "路線バス運転士／バス運転手・バス乗務員",
      employer: "東急バス株式会社",
      employerUrl: "https://www.tokyubus.co.jp/",
      jobUrl: "https://tenshoku.mynavi.jp/jobinfo-167418-1-44-1/",
      applicationLink: "https://tenshoku.mynavi.jp/jobinfo-167418-1-44-1/",
      location: "東京都品川区 / 神奈川県横浜市 / 東京都目黒区 ほか1か所",
      salary: "年収450万円～500万円",
      salaryMinAmount: 4500000,
      salaryMaxAmount: 5000000,
      salaryInterval: "yearly",
      salaryCurrency: "JPY",
      datePosted: "2026-10-20T00:00:00.000Z",
      deadline: "2027-01-11T00:00:00.000Z",
      jobType: "正社員",
    });
    expect(job?.isRemote).toBeUndefined();
    expect(job?.jobDescription).toContain("雇用形態: 正社員");
    expect(job?.jobDescription).toContain("初年度年収: 450万円～500万円");
    expect(job?.jobDescription).toContain("路線バスの安全運行");
  });

  it("gives location matching English and Japanese prefecture names", () => {
    const evidence = mapMynaviItem(BUS_DRIVER)?.locationEvidence;
    expect(evidence).toMatchObject({
      country: "Japan",
      countryKey: "japan",
      city: "Tokyo",
      regionHints: ["Tokyo", "Kanagawa"],
      source: "mynavi",
    });
    expect(evidence?.location).toContain("Tokyo 東京 東京都 品川区");
    expect(evidence?.location).toContain("Kanagawa 神奈川 神奈川県 横浜市");
  });

  it("handles remote listings without locations or a salary range", () => {
    const job = mapMynaviItem(SALES_REMOTE);
    expect(job).toMatchObject({
      isRemote: true,
      salary: "月給30万円〜",
      location: undefined,
      salaryCurrency: undefined,
    });
    expect(job?.locationEvidence).toMatchObject({
      workplaceType: "remote",
      isRemote: true,
      city: null,
    });
    expect(job?.jobDescription).toContain("営業経験3年以上");
  });

  it("skips results without a URL", () => {
    expect(mapMynaviItem({ title: "No link" })).toBeNull();
  });

  it("lists the searched prefecture first in a nationwide listing", () => {
    const nationwide = {
      ...BUS_DRIVER,
      locations: [
        { region: "北海道", city: "札幌市" },
        { region: "大阪府", city: null },
        { region: "東京都", city: "千代田区" },
      ],
    };
    const job = mapMynaviItem(nationwide, {
      searchedPrefecture: findPrefecture("Tokyo"),
    });
    expect(job?.location).toBe("東京都千代田区 / 北海道札幌市 / 大阪府");
    expect(job?.locationEvidence?.city).toBe("Tokyo");
  });

  it("uses the searched prefecture when a listing has no locations", () => {
    const job = mapMynaviItem(
      { ...BUS_DRIVER, locations: [] },
      { searchedPrefecture: findPrefecture("東京") },
    );
    expect(job?.location).toBe("東京都");
    expect(job?.locationEvidence?.location).toContain("Tokyo 東京 東京都");
  });
});

describe("runMynavi", () => {
  it("fails clearly without an Apify token", async () => {
    vi.stubEnv("APIFY_TOKEN", "");
    const result = await runMynavi({ searchTerms: ["営業"] });
    expect(result).toEqual({
      success: false,
      jobs: [],
      error: "Missing Apify credentials (APIFY_TOKEN)",
    });
    vi.unstubAllEnvs();
  });

  it("runs one search per term and prefecture and deduplicates jobs", async () => {
    const { client, calls } = fakeClient([
      [BUS_DRIVER, SALES_REMOTE],
      [BUS_DRIVER],
    ]);
    const progress = vi.fn();

    const result = await runMynavi({
      client,
      searchTerms: ["営業", "事務"],
      cities: ["東京"],
      maxJobsPerTerm: 40,
      onProgress: progress,
    });

    expect(result.success).toBe(true);
    expect(result.jobs.map((job) => job.sourceJobId)).toEqual([
      "167418-1-44-1",
      "200001-1-1-1",
    ]);
    expect(calls).toEqual([
      expect.objectContaining({
        keyword: "営業",
        prefectureCode: "13",
        remoteOnly: false,
        fetchDetails: true,
        maxItems: 40,
      }),
      expect.objectContaining({ keyword: "事務", prefectureCode: "13" }),
    ]);
    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({ type: "term_complete", jobsFoundTerm: 2 }),
    );
  });

  it("splits the job budget across prefectures and passes remote-only", async () => {
    const { client, calls } = fakeClient([[], []]);
    await runMynavi({
      client,
      searchTerms: ["営業"],
      cities: ["Tokyo", "Osaka"],
      remoteOnly: true,
      maxJobsPerTerm: 50,
    });
    expect(calls).toEqual([
      expect.objectContaining({
        prefectureCode: "13",
        maxItems: 25,
        remoteOnly: true,
      }),
      expect.objectContaining({
        prefectureCode: "27",
        maxItems: 25,
        remoteOnly: true,
      }),
    ]);
  });

  it("reports an error only when every search failed", async () => {
    const failing: ApifyLike = {
      actor: () => ({
        call: async () => {
          throw new Error("Actor run failed");
        },
      }),
      dataset: () => ({ listItems: async () => ({ items: [] }) }),
    };
    const result = await runMynavi({ client: failing, searchTerms: ["営業"] });
    expect(result).toEqual({
      success: false,
      jobs: [],
      error: "Actor run failed",
    });
  });
});
