import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/run", () => ({
  runHimalayas: vi.fn(),
}));

describe("himalayas manifest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards run settings to the runner", async () => {
    const { manifest } = await import("../src/manifest");
    const { runHimalayas } = await import("../src/run");
    const runHimalayasMock = vi.mocked(runHimalayas);
    runHimalayasMock.mockResolvedValue({ success: true, jobs: [] });

    await manifest.run({
      source: "himalayas",
      selectedSources: ["himalayas"],
      settings: {
        jobspyResultsWanted: "40",
        workplaceTypes: '["remote"]',
      },
      searchTerms: ["frontend engineer"],
      selectedCountry: "japan",
    });

    expect(runHimalayasMock).toHaveBeenCalledWith(
      expect.objectContaining({
        maxJobsPerTerm: 40,
        workplaceTypes: ["remote"],
        searchTerms: ["frontend engineer"],
        selectedCountry: "japan",
      }),
    );
  });
});
