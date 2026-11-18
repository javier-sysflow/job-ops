/**
 * Per-run inputs for Jev screening, built once per scoring step: the candidate
 * block (the same trimmed profile Sonnet sees, plus search preferences) and the
 * output language for reasons on jobs the gate skips.
 */
import * as settingsRepo from "@server/repositories/settings";
import type { ChatStyleManualLanguage, Job } from "@shared/types";
import { stripHtmlTags } from "@shared/utils/string";
import { resolveWritingOutputLanguage } from "../output-language";
import { filterProfileProjectsForAi } from "../resumeProjects";
import { sanitizeProfileForPrompt } from "../scorer";
import { getWritingStyle } from "../writing-style";
import { buildScreenCandidate } from "./screen";

export type JevScreenContext = {
  candidate: Record<string, unknown>;
  languageFor: (job: Job) => ChatStyleManualLanguage;
};

export async function prepareJevScreenContext(
  profile: Record<string, unknown>,
  scoringInstructions?: string,
): Promise<JevScreenContext> {
  const [aiProfile, searchTerms, workplaceTypes, writingStyle] =
    await Promise.all([
      filterProfileProjectsForAi(profile),
      settingsRepo.getSetting("searchTerms"),
      settingsRepo.getSetting("workplaceTypes"),
      getWritingStyle(),
    ]);

  return {
    candidate: buildScreenCandidate(sanitizeProfileForPrompt(aiProfile), {
      searchTerms,
      workplaceTypes,
      scoringInstructions,
    }),
    languageFor: (job) =>
      resolveWritingOutputLanguage({
        style: writingStyle,
        profile: profile as Parameters<
          typeof resolveWritingOutputLanguage
        >[0]["profile"],
        jobDescription: stripHtmlTags(job.jobDescription ?? ""),
      }).language,
  };
}
