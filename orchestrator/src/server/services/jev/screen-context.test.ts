import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSettingMock } = vi.hoisted(() => ({ getSettingMock: vi.fn() }));

vi.mock("@server/repositories/settings", () => ({
  getSetting: getSettingMock,
}));

vi.mock("../writing-style", () => ({
  getWritingStyle: vi.fn(async () => ({
    languageMode: "match-job-description",
    manualLanguage: "english",
  })),
}));

vi.mock("../resumeProjects", () => ({
  filterProfileProjectsForAi: vi.fn(async (profile: unknown) => profile),
}));

import { prepareJevScreenContext } from "./screen-context";

describe("prepareJevScreenContext", () => {
  beforeEach(() => {
    getSettingMock.mockReset();
  });

  it("tells Jev the candidate lives where they are searching", async () => {
    getSettingMock.mockImplementation(async (key: string) => {
      if (key === "jobspyCountryIndeed") return "japan";
      if (key === "searchCities") return "東京";
      if (key === "workplaceTypes") return '["remote","hybrid"]';
      if (key === "searchTerms") return '["再エネ 法人営業"]';
      return null;
    });

    const { candidate } = await prepareJevScreenContext({
      basics: { location: { address: "Ho Chi Minh City, Vietnam" } },
    });

    expect(candidate.basics).toEqual({ location: "東京, Japan" });
    expect(candidate.targetRoles).toEqual(["再エネ 法人営業"]);
  });

  it("keeps the résumé address without a search location", async () => {
    getSettingMock.mockResolvedValue(null);

    const { candidate } = await prepareJevScreenContext({
      basics: { location: { address: "Berlin" } },
    });

    expect(candidate.basics).toEqual({ location: { address: "Berlin" } });
  });
});
