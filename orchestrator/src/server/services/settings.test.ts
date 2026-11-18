import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@server/repositories/settings", () => ({
  getAllSettings: vi.fn(),
}));

vi.mock("@infra/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock("./design-resume", () => ({
  getCurrentDesignResumeOrNullOnLegacy: vi.fn(),
  designResumeToProfile: vi.fn(),
}));

vi.mock("./envSettings", () => ({
  getEnvSettingsData: vi.fn(),
  getOriginalEnvValue: vi.fn(),
}));

vi.mock("./profile", () => ({
  getProfile: vi.fn(),
}));

vi.mock("./resumeProjects", () => ({
  extractProjectsFromProfile: vi.fn(),
  resolveResumeProjectsSettings: vi.fn(),
}));

vi.mock("./rxresume", () => ({
  extractProjectsFromResume: vi.fn(),
  getResume: vi.fn(),
  RxResumeAuthConfigError: class RxResumeAuthConfigError extends Error {},
}));

import { logger } from "@infra/logger";
import { getAllSettings } from "@server/repositories/settings";
import {
  designResumeToProfile,
  getCurrentDesignResumeOrNullOnLegacy,
} from "./design-resume";
import { getEnvSettingsData, getOriginalEnvValue } from "./envSettings";
import { getProfile } from "./profile";
import {
  extractProjectsFromProfile,
  resolveResumeProjectsSettings,
} from "./resumeProjects";
import { extractProjectsFromResume } from "./rxresume";
import { getEffectiveSettings } from "./settings";

describe("getEffectiveSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllSettings).mockResolvedValue({});
    vi.mocked(getOriginalEnvValue).mockReturnValue(undefined);
    vi.mocked(getCurrentDesignResumeOrNullOnLegacy).mockResolvedValue({
      id: "primary",
      resumeJson: {},
    } as never);
    vi.mocked(designResumeToProfile).mockResolvedValue({
      basics: { name: "Local User" },
      sections: { projects: { items: [] } },
    } as never);
    vi.mocked(getEnvSettingsData).mockResolvedValue({} as never);
    vi.mocked(getProfile).mockResolvedValue({} as never);
    vi.mocked(extractProjectsFromProfile).mockReturnValue({
      catalog: [{ id: "local-project", label: "Local project" }],
      selectionItems: [],
    } as never);
    vi.mocked(extractProjectsFromResume).mockImplementation(() => {
      throw new Error("should not use RxResume extractor for local profile");
    });
    vi.mocked(resolveResumeProjectsSettings).mockImplementation(
      ({ catalog }) =>
        ({
          profileProjects: catalog,
          resumeProjects: {
            lockedProjectIds: [],
            aiSelectableProjectIds: [],
            maxProjects: 3,
          },
          defaultResumeProjects: {
            lockedProjectIds: [],
            aiSelectableProjectIds: [],
            maxProjects: 3,
          },
          overrideResumeProjects: null,
        }) as never,
    );
  });

  it("uses extractProjectsFromProfile for a local Resume Studio projection", async () => {
    const settings = await getEffectiveSettings();

    expect(extractProjectsFromProfile).toHaveBeenCalledTimes(1);
    expect(extractProjectsFromResume).not.toHaveBeenCalled();
    expect(settings.profileProjects).toEqual([
      { id: "local-project", label: "Local project" },
    ]);
  });

  it("falls back when no compatible local Resume Studio document is available", async () => {
    vi.mocked(getCurrentDesignResumeOrNullOnLegacy).mockResolvedValue(null);

    await expect(getEffectiveSettings()).resolves.toBeTruthy();
    expect(designResumeToProfile).not.toHaveBeenCalled();
  });

  it("does not warn when settings have no local or Reactive Resume base profile yet", async () => {
    vi.mocked(getCurrentDesignResumeOrNullOnLegacy).mockResolvedValue(null);
    vi.mocked(getProfile).mockRejectedValue(
      new Error(
        "Base resume not configured. Please select a base resume from your RxResume account in Settings.",
      ),
    );

    await expect(getEffectiveSettings()).resolves.toBeTruthy();
    expect(logger.warn).not.toHaveBeenCalledWith(
      "Failed to load base resume profile for settings",
      expect.any(Object),
    );
  });

  it("exposes purpose overrides and redacted purpose API key hints", async () => {
    vi.mocked(getAllSettings).mockResolvedValue({
      llmPurposeOverrides: JSON.stringify({
        tailoring: { provider: "openai", model: "gpt-5.4-mini" },
      }),
      llmPurposeApiKeys: JSON.stringify({ tailoring: "sk-purpose" }),
    } as never);

    const settings = await getEffectiveSettings();

    expect(settings.llmPurposeOverrides.override).toEqual({
      tailoring: { provider: "openai", model: "gpt-5.4-mini" },
    });
    expect(settings.llmPurposeApiKeyHints).toEqual({ tailoring: "sk-p" });
  });

  describe("per-purpose model env defaults", () => {
    const originalProvider = process.env.LLM_PROVIDER;
    const envValues: Record<string, string> = {
      MODEL: "claude-opus-5-5",
      MODEL_SCORER: "claude-sonnet-5-5",
      MODEL_PROJECT_SELECTION: "claude-sonnet-5-5",
    };

    beforeEach(() => {
      process.env.LLM_PROVIDER = "anthropic";
      vi.mocked(getOriginalEnvValue).mockImplementation(
        (key) => envValues[key],
      );
    });

    afterEach(() => {
      if (originalProvider === undefined) {
        delete process.env.LLM_PROVIDER;
      } else {
        process.env.LLM_PROVIDER = originalProvider;
      }
    });

    it("uses MODEL_<PURPOSE> env values as per-purpose defaults", async () => {
      const settings = await getEffectiveSettings();

      expect(settings.model.value).toBe("claude-opus-5-5");
      expect(settings.modelScorer).toEqual({
        value: "claude-sonnet-5-5",
        override: null,
      });
      expect(settings.modelProjectSelection.value).toBe("claude-sonnet-5-5");
      // No MODEL_TAILORING set: tailoring inherits the default model.
      expect(settings.modelTailoring.value).toBe("claude-opus-5-5");
    });

    it("lets a workspace override beat the env default", async () => {
      vi.mocked(getAllSettings).mockResolvedValue({
        modelScorer: "claude-haiku-5-5",
      } as never);

      const settings = await getEffectiveSettings();

      expect(settings.modelScorer).toEqual({
        value: "claude-haiku-5-5",
        override: "claude-haiku-5-5",
      });
    });

    it("ignores env defaults when the workspace uses another provider", async () => {
      vi.mocked(getAllSettings).mockResolvedValue({
        llmProvider: "openrouter",
        model: "google/gemini-3-flash-preview",
      } as never);

      const settings = await getEffectiveSettings();

      expect(settings.modelScorer.value).toBe("google/gemini-3-flash-preview");
    });
  });

  it("ignores an inherited model that is incompatible with Claude CLI", async () => {
    vi.mocked(getAllSettings).mockResolvedValue({
      llmProvider: "claude_cli",
    } as never);
    vi.mocked(getOriginalEnvValue).mockImplementation((key) =>
      key === "MODEL" ? "google/gemini-3-flash-preview" : undefined,
    );

    const settings = await getEffectiveSettings();

    expect(settings.model).toMatchObject({
      value: "claude-sonnet-5",
      default: "claude-sonnet-5",
      override: null,
    });
  });
});
