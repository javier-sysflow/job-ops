import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/run", () => ({
  runJapanDev: vi.fn(),
}));

describe("japandev manifest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards run settings to the runner", async () => {
    const { manifest } = await import("../src/manifest");
    const { runJapanDev } = await import("../src/run");
    const runJapanDevMock = vi.mocked(runJapanDev);
    runJapanDevMock.mockResolvedValue({ success: true, jobs: [] });

    await manifest.run({
      source: "japandev",
      selectedSources: ["japandev"],
      settings: {
        jobspyResultsWanted: "40",
        workplaceTypes: '["remote"]',
      },
      searchTerms: ["frontend engineer"],
      selectedCountry: "japan",
    });

    expect(runJapanDevMock).toHaveBeenCalledWith(
      expect.objectContaining({
        maxJobsPerTerm: 40,
        workplaceTypes: ["remote"],
        searchTerms: ["frontend engineer"],
        selectedCountry: "japan",
      }),
    );
  });
});
