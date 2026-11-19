import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/run", () => ({
  runLinkedIn: vi.fn(),
}));

describe("linkedin-apify manifest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides the linkedin source and needs an Apify token", async () => {
    const { manifest } = await import("../src/manifest");
    expect(manifest.providesSources).toEqual(["linkedin"]);
    expect(manifest.requiredEnvVars).toEqual(["APIFY_TOKEN"]);
    expect(
      manifest.locationCapabilities?.linkedin?.supportedCountryKeys,
    ).toContain("japan");
  });

  it("forwards search terms, cities, country and budget to the runner", async () => {
    const { manifest } = await import("../src/manifest");
    const { runLinkedIn } = await import("../src/run");
    const runMock = vi.mocked(runLinkedIn);
    runMock.mockResolvedValue({ success: true, jobs: [] });

    await manifest.run({
      source: "linkedin",
      selectedSources: ["linkedin"],
      settings: { jobspyResultsWanted: "12", jobspyCountryIndeed: "japan" },
      searchTerms: ["sustainability consultant"],
      selectedCountry: "japan",
      sourceLocationPlan: { requestedCities: ["東京"] },
    } as Parameters<typeof manifest.run>[0]);

    expect(runMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerms: ["sustainability consultant"],
        cities: ["東京"],
        country: "japan",
        maxJobsPerTerm: 12,
      }),
    );
  });

  it("returns the runner's error", async () => {
    const { manifest } = await import("../src/manifest");
    const { runLinkedIn } = await import("../src/run");
    vi.mocked(runLinkedIn).mockResolvedValue({
      success: false,
      jobs: [],
      error: "Missing Apify credentials (APIFY_TOKEN)",
    });

    const result = await manifest.run({
      source: "linkedin",
      selectedSources: ["linkedin"],
      settings: {},
      searchTerms: ["consultant"],
      selectedCountry: "japan",
    });

    expect(result).toEqual({
      success: false,
      jobs: [],
      error: "Missing Apify credentials (APIFY_TOKEN)",
    });
  });
});
