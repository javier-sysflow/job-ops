import { createJob } from "@shared/testing/factories";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { scoreJobsStep } from "./score-jobs";

vi.mock("@infra/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@server/repositories/jobs", () => ({
  getUnscoredDiscoveredJobs: vi.fn(),
  updateJob: vi.fn(),
}));

vi.mock("@server/repositories/settings", () => ({
  getSetting: vi.fn(),
}));

vi.mock("@server/services/scorer", () => {
  class LlmNotConfiguredError extends Error {}
  class ScoringUnavailableError extends Error {}
  return {
    scoreJobSuitability: vi.fn(),
    LlmNotConfiguredError,
    ScoringUnavailableError,
  };
});

vi.mock("@server/services/visa-sponsors/index", () => ({
  searchSponsors: vi.fn(),
  calculateSponsorMatchSummary: vi.fn(),
}));

vi.mock("@server/repositories/jev-screens", () => ({
  saveJevScreen: vi.fn(),
}));

vi.mock("@server/services/jev/screen-context", () => ({
  prepareJevScreenContext: vi.fn(),
}));

vi.mock("@server/services/jev/screen", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@server/services/jev/screen")>();
  return {
    ...actual,
    getJevScreenMode: vi.fn(() => "off"),
    getJevScreenThreshold: vi.fn(() => 0.6),
    screenJob: vi.fn(),
  };
});

vi.mock("../progress", () => ({
  updateProgress: vi.fn(),
  progressHelpers: {
    scoringJob: vi.fn(),
    scoringComplete: vi.fn(),
  },
}));

describe("scoreJobsStep auto-skip behavior", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const jobsRepo = await import("@server/repositories/jobs");
    const settingsRepo = await import("@server/repositories/settings");
    const scorer = await import("@server/services/scorer");
    const visaSponsors = await import("@server/services/visa-sponsors/index");

    vi.mocked(jobsRepo.getUnscoredDiscoveredJobs).mockResolvedValue([
      createJob({
        title: "Software Engineer",
        employer: "Acme Corp",
        status: "discovered",
        suitabilityScore: null,
        suitabilityReason: null,
      }),
    ]);
    vi.mocked(jobsRepo.updateJob).mockResolvedValue(null);
    vi.mocked(settingsRepo.getSetting).mockResolvedValue(null);
    vi.mocked(scorer.scoreJobSuitability).mockResolvedValue({
      score: 40,
      reason: "Low fit",
      jobBrief: null,
    });
    vi.mocked(visaSponsors.searchSponsors).mockResolvedValue([]);
    vi.mocked(visaSponsors.calculateSponsorMatchSummary).mockReturnValue({
      sponsorMatchScore: 0,
      sponsorMatchNames: null,
    });
  });

  it("auto-skips jobs when score is below threshold", async () => {
    const settingsRepo = await import("@server/repositories/settings");
    const jobsRepo = await import("@server/repositories/jobs");
    const { logger } = await import("@infra/logger");

    vi.mocked(settingsRepo.getSetting).mockResolvedValue("50");

    await scoreJobsStep({ profile: {} });

    expect(jobsRepo.updateJob).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({
        suitabilityScore: 40,
        status: "skipped",
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      "Auto-skipped job due to low score",
      expect.objectContaining({
        jobId: "job-1",
        score: 40,
        threshold: 50,
      }),
    );
  });

  it("uses the selected run country for visa sponsor matching", async () => {
    const visaSponsors = await import("@server/services/visa-sponsors/index");

    await scoreJobsStep({
      profile: {},
      visaSponsorCountryKey: "united kingdom",
    });

    expect(visaSponsors.searchSponsors).toHaveBeenCalledWith("Acme Corp", {
      limit: 10,
      minScore: 50,
      countryKey: "united kingdom",
    });
  });

  it("passes per-run scoring instructions to the scorer", async () => {
    const scorer = await import("@server/services/scorer");

    await scoreJobsStep({
      profile: {},
      scoringInstructions: "Lower-score graduate programmes.",
    });

    expect(scorer.scoreJobSuitability).toHaveBeenCalledWith(
      expect.objectContaining({ id: "job-1" }),
      {},
      { scoringInstructions: "Lower-score graduate programmes." },
    );
  });

  it("does not override global scoring instructions with a blank per-run value", async () => {
    const scorer = await import("@server/services/scorer");

    await scoreJobsStep({
      profile: {},
      scoringInstructions: "   ",
    });

    expect(vi.mocked(scorer.scoreJobSuitability).mock.calls[0]).toHaveLength(2);
  });

  it("persists generated job briefs while scoring", async () => {
    const jobsRepo = await import("@server/repositories/jobs");
    const scorer = await import("@server/services/scorer");

    vi.mocked(scorer.scoreJobSuitability).mockResolvedValue({
      score: 40,
      reason: "Low fit",
      jobBrief:
        '{"role_summary":"Build tools","they_want":[],"specifics":[],"company_offers":[],"practical_details":[],"missing_or_unclear":[],"repeated_signals":[]}',
    });

    await scoreJobsStep({ profile: {} });

    expect(jobsRepo.updateJob).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({
        jobBrief:
          '{"role_summary":"Build tools","they_want":[],"specifics":[],"company_offers":[],"practical_details":[],"missing_or_unclear":[],"repeated_signals":[]}',
      }),
    );
  });

  it("persists accepted job fact updates while scoring", async () => {
    const jobsRepo = await import("@server/repositories/jobs");
    const scorer = await import("@server/services/scorer");

    vi.mocked(scorer.scoreJobSuitability).mockResolvedValue({
      score: 75,
      reason: "Good fit",
      jobBrief: null,
      jobUpdates: {
        salaryInterval: "hourly",
        salarySource: "ai_job_fact_review",
      },
    });

    await scoreJobsStep({ profile: {} });

    expect(jobsRepo.updateJob).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({
        salaryInterval: "hourly",
        salarySource: "ai_job_fact_review",
      }),
    );
  });

  it.each([
    { score: 90, exceptional: 0 },
    { score: 91, exceptional: 1 },
  ])("reports $exceptional exceptional matches for a score of $score", async ({
    score,
    exceptional,
  }) => {
    const scorer = await import("@server/services/scorer");
    const { progressHelpers } = await import("../progress");
    vi.mocked(scorer.scoreJobSuitability).mockResolvedValue({
      score,
      reason: "Test score",
      jobBrief: null,
    });

    await scoreJobsStep({ profile: {} });

    expect(progressHelpers.scoringJob).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ id: "job-1" }),
      exceptional,
    );
  });

  it("does not auto-skip jobs when score equals threshold", async () => {
    const settingsRepo = await import("@server/repositories/settings");
    const jobsRepo = await import("@server/repositories/jobs");
    const scorer = await import("@server/services/scorer");
    const { logger } = await import("@infra/logger");

    vi.mocked(settingsRepo.getSetting).mockResolvedValue("50");
    vi.mocked(scorer.scoreJobSuitability).mockResolvedValue({
      score: 50,
      reason: "At threshold",
      jobBrief: null,
    });

    await scoreJobsStep({ profile: {} });

    expect(jobsRepo.updateJob).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({
        suitabilityScore: 50,
      }),
    );
    const updatePayload = vi.mocked(jobsRepo.updateJob).mock.calls[0][1] as {
      status?: string;
    };
    expect(updatePayload).not.toHaveProperty("status");
    expect(logger.info).not.toHaveBeenCalledWith(
      "Auto-skipped job due to low score",
      expect.anything(),
    );
  });

  it("does not auto-skip when threshold setting is null", async () => {
    const settingsRepo = await import("@server/repositories/settings");
    const jobsRepo = await import("@server/repositories/jobs");

    vi.mocked(settingsRepo.getSetting).mockResolvedValue(null);

    await scoreJobsStep({ profile: {} });

    const updatePayload = vi.mocked(jobsRepo.updateJob).mock.calls[0][1] as {
      status?: string;
    };
    expect(updatePayload).not.toHaveProperty("status");
  });

  it("does not auto-skip when threshold setting is NaN", async () => {
    const settingsRepo = await import("@server/repositories/settings");
    const jobsRepo = await import("@server/repositories/jobs");

    vi.mocked(settingsRepo.getSetting).mockResolvedValue("not-a-number");

    await scoreJobsStep({ profile: {} });

    const updatePayload = vi.mocked(jobsRepo.updateJob).mock.calls[0][1] as {
      status?: string;
    };
    expect(updatePayload).not.toHaveProperty("status");
  });

  it("never auto-skips applied jobs even when score is below threshold", async () => {
    const settingsRepo = await import("@server/repositories/settings");
    const jobsRepo = await import("@server/repositories/jobs");
    const { logger } = await import("@infra/logger");

    vi.mocked(settingsRepo.getSetting).mockResolvedValue("50");
    vi.mocked(jobsRepo.getUnscoredDiscoveredJobs).mockResolvedValue([
      createJob({
        id: "job-applied",
        status: "applied",
        title: "Software Engineer",
        employer: "Acme Corp",
        suitabilityScore: null,
        suitabilityReason: null,
      }),
    ]);

    await scoreJobsStep({ profile: {} });

    expect(jobsRepo.updateJob).toHaveBeenCalledWith(
      "job-applied",
      expect.any(Object),
    );
    const updatePayload = vi.mocked(jobsRepo.updateJob).mock.calls[0][1] as {
      status?: string;
    };
    expect(updatePayload).not.toHaveProperty("status");
    expect(logger.info).not.toHaveBeenCalledWith(
      "Auto-skipped job due to low score",
      expect.objectContaining({ jobId: "job-applied" }),
    );
  });

  it("scores multiple jobs and reports completion progress", async () => {
    const jobsRepo = await import("@server/repositories/jobs");
    const scorer = await import("@server/services/scorer");
    const { progressHelpers } = await import("../progress");

    vi.mocked(jobsRepo.getUnscoredDiscoveredJobs).mockResolvedValue([
      createJob({
        id: "job-1",
        title: "First Role",
        employer: "Acme",
        suitabilityScore: null,
      }),
      createJob({
        id: "job-2",
        title: "Second Role",
        employer: "Beta",
        suitabilityScore: null,
      }),
    ]);

    vi.mocked(scorer.scoreJobSuitability)
      .mockResolvedValueOnce({
        score: 61,
        reason: "First score",
        jobBrief: null,
      })
      .mockResolvedValueOnce({
        score: 72,
        reason: "Second score",
        jobBrief: null,
      });

    const result = await scoreJobsStep({ profile: {} });

    expect(result.scoredJobs).toHaveLength(2);
    expect(vi.mocked(jobsRepo.updateJob)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(progressHelpers.scoringJob)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(progressHelpers.scoringJob)).toHaveBeenCalledWith(
      1,
      2,
      {
        id: expect.any(String),
        title: expect.any(String),
        employer: expect.any(String),
      },
      0,
    );
    expect(vi.mocked(progressHelpers.scoringComplete)).toHaveBeenCalledWith(2);
  });

  it("continues scoring remaining jobs when one job fails transiently", async () => {
    const jobsRepo = await import("@server/repositories/jobs");
    const scorer = await import("@server/services/scorer");
    const { progressHelpers } = await import("../progress");
    const { logger } = await import("@infra/logger");

    vi.mocked(jobsRepo.getUnscoredDiscoveredJobs).mockResolvedValue([
      createJob({
        id: "job-1",
        title: "Failing Role",
        employer: "Acme",
        suitabilityScore: null,
      }),
      createJob({
        id: "job-2",
        title: "Healthy Role",
        employer: "Beta",
        suitabilityScore: null,
      }),
    ]);

    vi.mocked(scorer.scoreJobSuitability)
      .mockRejectedValueOnce(
        new scorer.ScoringUnavailableError(
          "AI scoring failed: No content in response",
        ),
      )
      .mockResolvedValueOnce({
        score: 72,
        reason: "Second score",
        jobBrief: null,
      });

    const result = await scoreJobsStep({ profile: {} });

    expect(result.scoredJobs).toHaveLength(1);
    expect(result.scoredJobs[0].id).toBe("job-2");
    expect(vi.mocked(jobsRepo.updateJob)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(jobsRepo.updateJob)).toHaveBeenCalledWith(
      "job-2",
      expect.objectContaining({ suitabilityScore: 72 }),
    );
    expect(vi.mocked(progressHelpers.scoringComplete)).toHaveBeenCalledWith(1);
    expect(logger.warn).toHaveBeenCalledWith(
      "Job scoring failed — leaving unscored and continuing",
      expect.objectContaining({ jobId: "job-1" }),
    );
  });

  it("pauses the run when every early job fails transiently", async () => {
    const jobsRepo = await import("@server/repositories/jobs");
    const scorer = await import("@server/services/scorer");

    vi.mocked(jobsRepo.getUnscoredDiscoveredJobs).mockResolvedValue(
      Array.from({ length: 6 }, (_, index) =>
        createJob({
          id: `job-${index + 1}`,
          title: `Role ${index + 1}`,
          employer: "Acme",
          suitabilityScore: null,
        }),
      ),
    );

    vi.mocked(scorer.scoreJobSuitability).mockRejectedValue(
      new scorer.ScoringUnavailableError(
        "AI scoring failed: No content in response",
      ),
    );

    await expect(scoreJobsStep({ profile: {} })).rejects.toBeInstanceOf(
      scorer.LlmNotConfiguredError,
    );
    expect(vi.mocked(jobsRepo.updateJob)).not.toHaveBeenCalled();
  });

  it("still halts the run when the LLM is genuinely not configured", async () => {
    const jobsRepo = await import("@server/repositories/jobs");
    const scorer = await import("@server/services/scorer");

    vi.mocked(jobsRepo.getUnscoredDiscoveredJobs).mockResolvedValue([
      createJob({
        id: "job-1",
        title: "Software Engineer",
        employer: "Acme",
        suitabilityScore: null,
      }),
    ]);

    vi.mocked(scorer.scoreJobSuitability).mockRejectedValue(
      new scorer.LlmNotConfiguredError("LLM API key not configured"),
    );

    await expect(scoreJobsStep({ profile: {} })).rejects.toBeInstanceOf(
      scorer.LlmNotConfiguredError,
    );
    expect(vi.mocked(jobsRepo.updateJob)).not.toHaveBeenCalled();
  });

  it("stops before processing when cancellation is requested", async () => {
    const jobsRepo = await import("@server/repositories/jobs");
    const scorer = await import("@server/services/scorer");

    vi.mocked(jobsRepo.getUnscoredDiscoveredJobs).mockResolvedValue([
      createJob({
        id: "job-1",
        title: "Cancelled Role",
        employer: "Acme",
        suitabilityScore: null,
      }),
    ]);

    const result = await scoreJobsStep({
      profile: {},
      shouldCancel: () => true,
    });

    expect(result.scoredJobs).toHaveLength(0);
    expect(vi.mocked(scorer.scoreJobSuitability)).not.toHaveBeenCalled();
    expect(vi.mocked(jobsRepo.updateJob)).not.toHaveBeenCalled();
  });
});

describe("scoreJobsStep Jev screening", () => {
  const skipOutcome = {
    ok: true as const,
    version: "screen-v1",
    verdict: "skip" as const,
    trigger: "overall_fit" as const,
    threshold: 0.6,
    signals: {
      unsuitable: 0.9,
      differentProfession: 0.4,
      fitLevel: 0.2,
      roleLevel: 1.1,
      locationConflict: 0.2,
      missingRequirement: 0.3,
    },
    model: "jev-1.13.0",
    inputTokens: 4000,
    latencyMs: 800,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const jobsRepo = await import("@server/repositories/jobs");
    const settingsRepo = await import("@server/repositories/settings");
    const scorer = await import("@server/services/scorer");
    const visaSponsors = await import("@server/services/visa-sponsors/index");
    const context = await import("@server/services/jev/screen-context");
    const screen = await import("@server/services/jev/screen");

    vi.mocked(jobsRepo.getUnscoredDiscoveredJobs).mockResolvedValue([
      createJob({
        id: "job-1",
        title: "Sustainability Manager",
        status: "discovered",
        suitabilityScore: null,
        suitabilityReason: null,
      }),
    ]);
    vi.mocked(jobsRepo.updateJob).mockResolvedValue(null);
    vi.mocked(settingsRepo.getSetting).mockResolvedValue(null);
    vi.mocked(scorer.scoreJobSuitability).mockResolvedValue({
      score: 12,
      reason: "Different field",
      jobBrief: null,
    });
    vi.mocked(visaSponsors.searchSponsors).mockResolvedValue([]);
    vi.mocked(visaSponsors.calculateSponsorMatchSummary).mockReturnValue({
      sponsorMatchScore: 0,
      sponsorMatchNames: null,
    });
    vi.mocked(context.prepareJevScreenContext).mockResolvedValue({
      candidate: { basics: { headline: "Engineer" } },
      languageFor: () => "english",
    });
    vi.mocked(screen.screenJob).mockResolvedValue(skipOutcome);
    vi.mocked(screen.getJevScreenMode).mockReturnValue("off");
  });

  it("never calls Jev when screening is off", async () => {
    const screen = await import("@server/services/jev/screen");
    const context = await import("@server/services/jev/screen-context");
    const scorer = await import("@server/services/scorer");

    await scoreJobsStep({ profile: {} });

    expect(context.prepareJevScreenContext).not.toHaveBeenCalled();
    expect(screen.screenJob).not.toHaveBeenCalled();
    expect(scorer.scoreJobSuitability).toHaveBeenCalledTimes(1);
  });

  it("shadow mode still scores every job and stores Jev's verdict", async () => {
    const screen = await import("@server/services/jev/screen");
    const scorer = await import("@server/services/scorer");
    const jobsRepo = await import("@server/repositories/jobs");
    const jevRepo = await import("@server/repositories/jev-screens");
    vi.mocked(screen.getJevScreenMode).mockReturnValue("shadow");

    await scoreJobsStep({ profile: {} });

    expect(screen.screenJob).toHaveBeenCalledWith(
      expect.objectContaining({ id: "job-1" }),
      { basics: { headline: "Engineer" } },
      { threshold: 0.6 },
    );
    expect(scorer.scoreJobSuitability).toHaveBeenCalledTimes(1);
    expect(jobsRepo.updateJob).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({ suitabilityScore: 12 }),
    );
    expect(jevRepo.saveJevScreen).toHaveBeenCalledWith({
      jobId: "job-1",
      mode: "shadow",
      outcome: skipOutcome,
    });
  });

  it("gate mode skips the scoring call on a confident skip verdict", async () => {
    const screen = await import("@server/services/jev/screen");
    const scorer = await import("@server/services/scorer");
    const jobsRepo = await import("@server/repositories/jobs");
    const jevRepo = await import("@server/repositories/jev-screens");
    vi.mocked(screen.getJevScreenMode).mockReturnValue("gate");

    const result = await scoreJobsStep({ profile: {} });

    expect(scorer.scoreJobSuitability).not.toHaveBeenCalled();
    expect(jobsRepo.updateJob).toHaveBeenCalledWith("job-1", {
      suitabilityScore: 5,
      suitabilityReason: expect.stringContaining("90% sure"),
      status: "skipped",
    });
    expect(jevRepo.saveJevScreen).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-1", mode: "gate" }),
    );
    expect(result.scoredJobs).toHaveLength(1);
    expect(result.scoredJobs[0].suitabilityScore).toBe(5);
  });

  it("gate mode falls back to normal scoring when Jev fails or says score", async () => {
    const screen = await import("@server/services/jev/screen");
    const scorer = await import("@server/services/scorer");
    vi.mocked(screen.getJevScreenMode).mockReturnValue("gate");

    vi.mocked(screen.screenJob).mockResolvedValueOnce({
      ok: false,
      version: "screen-v1",
      reason: "timeout",
      latencyMs: 15000,
    });
    await scoreJobsStep({ profile: {} });
    expect(scorer.scoreJobSuitability).toHaveBeenCalledTimes(1);

    vi.mocked(screen.screenJob).mockResolvedValueOnce({
      ...skipOutcome,
      verdict: "score",
      trigger: null,
    });
    await scoreJobsStep({ profile: {} });
    expect(scorer.scoreJobSuitability).toHaveBeenCalledTimes(2);
  });

  it("leaves scoring untouched when the screening context cannot be built", async () => {
    const screen = await import("@server/services/jev/screen");
    const context = await import("@server/services/jev/screen-context");
    const scorer = await import("@server/services/scorer");
    vi.mocked(screen.getJevScreenMode).mockReturnValue("gate");
    vi.mocked(context.prepareJevScreenContext).mockRejectedValue(
      new Error("settings unavailable"),
    );

    await scoreJobsStep({ profile: {} });

    expect(screen.screenJob).not.toHaveBeenCalled();
    expect(scorer.scoreJobSuitability).toHaveBeenCalledTimes(1);
  });

  it("does not let a failed save break scoring", async () => {
    const screen = await import("@server/services/jev/screen");
    const jevRepo = await import("@server/repositories/jev-screens");
    const jobsRepo = await import("@server/repositories/jobs");
    vi.mocked(screen.getJevScreenMode).mockReturnValue("shadow");
    vi.mocked(jevRepo.saveJevScreen).mockRejectedValue(new Error("db locked"));

    const result = await scoreJobsStep({ profile: {} });

    expect(result.scoredJobs).toHaveLength(1);
    expect(jobsRepo.updateJob).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({ suitabilityScore: 12 }),
    );
  });
});
