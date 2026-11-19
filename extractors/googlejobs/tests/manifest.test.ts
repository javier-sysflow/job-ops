import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/run", () => ({
  runGoogleJobs: vi.fn(),
}));

describe("googlejobs manifest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("declares a Japan-only source that needs an Apify token", async () => {
    const { manifest } = await import("../src/manifest");
    expect(manifest.providesSources).toEqual(["googlejobs"]);
    expect(manifest.requiredEnvVars).toEqual(["APIFY_TOKEN"]);
    expect(manifest.locationCapabilities?.googlejobs).toEqual({
      supportedCountryKeys: ["japan"],
    });
  });

  it("forwards terms, cities and the per-term budget to the runner", async () => {
    const { manifest } = await import("../src/manifest");
    const { runGoogleJobs } = await import("../src/run");
    vi.mocked(runGoogleJobs).mockResolvedValue({ success: true, jobs: [] });

    await manifest.run({
      source: "googlejobs",
      selectedSources: ["googlejobs"],
      settings: { jobspyResultsWanted: "12" },
      searchTerms: ["サステナビリティ"],
      selectedCountry: "japan",
      sourceLocationPlan: { requestedCities: ["東京"] },
    } as Parameters<typeof manifest.run>[0]);

    expect(runGoogleJobs).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerms: ["サステナビリティ"],
        cities: ["東京"],
        maxJobsPerTerm: 12,
      }),
    );
  });

  it("returns the runner's error", async () => {
    const { manifest } = await import("../src/manifest");
    const { runGoogleJobs } = await import("../src/run");
    vi.mocked(runGoogleJobs).mockResolvedValue({
      success: false,
      jobs: [],
      error: "Missing Apify credentials (APIFY_TOKEN)",
    });
    const result = await manifest.run({
      source: "googlejobs",
      selectedSources: ["googlejobs"],
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
