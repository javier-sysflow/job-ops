import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/run", () => ({
  runMynavi: vi.fn(),
}));

describe("mynavi manifest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("declares a Japan-only source that needs an Apify token", async () => {
    const { manifest } = await import("../src/manifest");
    expect(manifest.id).toBe("mynavi");
    expect(manifest.providesSources).toEqual(["mynavi"]);
    expect(manifest.requiredEnvVars).toEqual(["APIFY_TOKEN"]);
    expect(manifest.locationCapabilities?.mynavi).toEqual({
      supportedCountryKeys: ["japan"],
    });
  });

  it("forwards search terms, cities, budget and remote-only to the runner", async () => {
    const { manifest } = await import("../src/manifest");
    const { runMynavi } = await import("../src/run");
    const runMynaviMock = vi.mocked(runMynavi);
    runMynaviMock.mockResolvedValue({ success: true, jobs: [] });

    await manifest.run({
      source: "mynavi",
      selectedSources: ["mynavi"],
      settings: {
        jobspyResultsWanted: "30",
        searchCities: "Tokyo|Osaka",
        workplaceTypes: '["remote"]',
      },
      searchTerms: ["営業"],
      selectedCountry: "japan",
    });

    expect(runMynaviMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerms: ["営業"],
        cities: ["Tokyo", "Osaka"],
        maxJobsPerTerm: 30,
        remoteOnly: true,
      }),
    );
  });

  it("returns the runner's error", async () => {
    const { manifest } = await import("../src/manifest");
    const { runMynavi } = await import("../src/run");
    vi.mocked(runMynavi).mockResolvedValue({
      success: false,
      jobs: [],
      error: "Missing Apify credentials (APIFY_TOKEN)",
    });

    const result = await manifest.run({
      source: "mynavi",
      selectedSources: ["mynavi"],
      settings: {},
      searchTerms: ["営業"],
      selectedCountry: "japan",
    });

    expect(result).toEqual({
      success: false,
      jobs: [],
      error: "Missing Apify credentials (APIFY_TOKEN)",
    });
  });
});
