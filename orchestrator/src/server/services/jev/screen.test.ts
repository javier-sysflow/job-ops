import { createJob } from "@shared/testing/factories";
import { describe, expect, it, vi } from "vitest";
import {
  buildScreenCandidate,
  buildScreenJob,
  decideScreen,
  getJevScreenMode,
  getJevScreenThreshold,
  JEV_SCREEN_JD_CHAR_LIMIT,
  JEV_SCREEN_VERSION,
  type JevScreenSignals,
  readScreenSignals,
  SCREEN_QUESTIONS,
  screenedOutReason,
  screenedOutScore,
  screenJob,
} from "./screen";

const signals = (
  overrides: Partial<JevScreenSignals> = {},
): JevScreenSignals => ({
  unsuitable: 0,
  differentProfession: 0,
  fitLevel: 2,
  roleLevel: 2,
  locationConflict: 0.1,
  missingRequirement: 0.1,
  ...overrides,
});

describe("getJevScreenMode", () => {
  it("is off without a key, whatever the mode says", () => {
    expect(getJevScreenMode({ JEV_SCREEN_MODE: "gate" })).toBe("off");
  });

  it("reads shadow and gate, and treats anything else as off", () => {
    const key = { TYPESAFE_API_KEY: "k" };
    expect(getJevScreenMode({ ...key, JEV_SCREEN_MODE: " Shadow " })).toBe(
      "shadow",
    );
    expect(getJevScreenMode({ ...key, JEV_SCREEN_MODE: "gate" })).toBe("gate");
    expect(getJevScreenMode({ ...key, JEV_SCREEN_MODE: "on" })).toBe("off");
    expect(getJevScreenMode(key)).toBe("off");
  });
});

describe("getJevScreenThreshold", () => {
  it("defaults to 0.6 and clamps to 0.5-0.99", () => {
    expect(getJevScreenThreshold({})).toBe(0.6);
    expect(getJevScreenThreshold({ JEV_SCREEN_THRESHOLD: "abc" })).toBe(0.6);
    expect(getJevScreenThreshold({ JEV_SCREEN_THRESHOLD: "0.3" })).toBe(0.5);
    expect(getJevScreenThreshold({ JEV_SCREEN_THRESHOLD: "1.5" })).toBe(0.99);
    expect(getJevScreenThreshold({ JEV_SCREEN_THRESHOLD: "0.75" })).toBe(0.75);
  });
});

describe("decideScreen", () => {
  it("scores when neither signal reaches the threshold", () => {
    expect(
      decideScreen(
        signals({ unsuitable: 0.59, differentProfession: 0.4 }),
        0.6,
      ),
    ).toEqual({ verdict: "score", trigger: null });
  });

  it("skips on a confident unsuitable or different-profession answer", () => {
    expect(decideScreen(signals({ unsuitable: 0.6 }), 0.6)).toEqual({
      verdict: "skip",
      trigger: "overall_fit",
    });
    expect(
      decideScreen(signals({ unsuitable: 0.7, differentProfession: 0.9 }), 0.6),
    ).toEqual({ verdict: "skip", trigger: "role_match" });
  });

  it("ignores location and missing-requirement answers", () => {
    expect(
      decideScreen(
        signals({ locationConflict: 0.99, missingRequirement: 0.99 }),
        0.6,
      ).verdict,
    ).toBe("score");
  });

  it("scores when the deciding answers are missing", () => {
    expect(
      decideScreen(
        signals({ unsuitable: null, differentProfession: null }),
        0.6,
      ).verdict,
    ).toBe("score");
  });
});

describe("state builders", () => {
  it("adds target roles and workplace preference to the profile", () => {
    expect(
      buildScreenCandidate(
        { basics: { headline: "Engineer" } },
        {
          searchTerms: '["AI Engineer","Automation Specialist"]',
          workplaceTypes: '["remote"]',
          scoringInstructions: "  ",
        },
      ),
    ).toEqual({
      basics: { headline: "Engineer" },
      targetRoles: ["AI Engineer", "Automation Specialist"],
      preferredWorkplaceTypes: ["remote"],
    });
  });

  it("strips HTML and cuts long job descriptions", () => {
    const job = createJob({
      jobDescription: `<p>${"x".repeat(JEV_SCREEN_JD_CHAR_LIMIT + 50)}</p>`,
    });
    const built = buildScreenJob(job);
    expect(String(built.description)).toHaveLength(JEV_SCREEN_JD_CHAR_LIMIT);
    expect(String(built.description)).not.toContain("<p>");
    expect(built.descriptionTruncated).toBe(true);
  });

  it("says so when there is no description", () => {
    expect(
      buildScreenJob(createJob({ jobDescription: null })).description,
    ).toBe("No description available");
  });
});

describe("readScreenSignals", () => {
  it("reads level-0 probabilities and expected levels", () => {
    expect(
      readScreenSignals({
        overall_fit: {
          type: "score",
          score: 0.4,
          probabilities: { "0": 0.8, "1": 0.2 },
          confidence: 0.7,
        },
        location_conflict: { type: "noul", noul: 0.3 },
      }),
    ).toEqual({
      unsuitable: 0.8,
      differentProfession: null,
      fitLevel: 0.4,
      roleLevel: null,
      locationConflict: 0.3,
      missingRequirement: null,
    });
  });
});

describe("screenJob", () => {
  const job = createJob({ title: "Sustainability Manager" });

  it("asks the four questions and returns a verdict", async () => {
    const ask = vi.fn().mockResolvedValue({
      ok: true,
      model: "jev-1.13.0",
      inputTokens: 4000,
      latencyMs: 900,
      answers: {
        overall_fit: {
          type: "score",
          score: 0.1,
          probabilities: { "0": 0.92 },
          confidence: 0.9,
        },
        role_match: {
          type: "score",
          score: 0.2,
          probabilities: { "0": 0.85 },
          confidence: 0.8,
        },
      },
    });

    const outcome = await screenJob(
      job,
      { basics: {} },
      { threshold: 0.6, ask },
    );

    expect(ask).toHaveBeenCalledWith(
      {
        candidate: { basics: {} },
        job: expect.objectContaining({ title: "Sustainability Manager" }),
      },
      SCREEN_QUESTIONS,
    );
    expect(outcome).toMatchObject({
      ok: true,
      version: JEV_SCREEN_VERSION,
      verdict: "skip",
      trigger: "overall_fit",
      threshold: 0.6,
      model: "jev-1.13.0",
      inputTokens: 4000,
    });
  });

  it("returns the failure reason instead of throwing", async () => {
    const failed = await screenJob(
      job,
      {},
      {
        ask: vi.fn().mockResolvedValue({
          ok: false,
          reason: "http_429",
          status: 429,
          latencyMs: 10,
        }),
      },
    );
    expect(failed).toMatchObject({
      ok: false,
      reason: "http_429",
      status: 429,
    });

    const thrown = await screenJob(
      job,
      {},
      {
        ask: vi.fn().mockRejectedValue(new Error("boom")),
      },
    );
    expect(thrown).toMatchObject({ ok: false, reason: "network" });
  });
});

describe("screened-out score and reason", () => {
  it("caps the stored score at 19", () => {
    expect(screenedOutScore(signals({ fitLevel: 0.04 }))).toBe(1);
    expect(screenedOutScore(signals({ fitLevel: 1.6 }))).toBe(19);
    expect(screenedOutScore(signals({ fitLevel: null }))).toBe(0);
  });

  it("writes the reason in Japanese or English", () => {
    const s = signals({ unsuitable: 0.87, differentProfession: 0.93 });
    expect(screenedOutReason("role_match", s, "japanese")).toContain(
      "確信度93%",
    );
    expect(screenedOutReason("overall_fit", s, "english")).toContain(
      "87% sure",
    );
    expect(screenedOutReason("overall_fit", s, "german")).toMatch(
      /^Screened out/,
    );
  });
});
