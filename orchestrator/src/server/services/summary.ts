/**
 * Service for generating tailored resume content (Summary, Headline, Skills).
 */

import { logger } from "@infra/logger";
import * as settingsRepo from "@server/repositories/settings";
import { settingsRegistry } from "@shared/settings-registry";
import type { ResumeProfile } from "@shared/types";
import { stripHtmlTags } from "@shared/utils/string";
import type { JsonSchemaDefinition } from "./llm/types";
import { createConfiguredLlmService, resolveLlmModel } from "./modelSelection";
import {
  getWritingLanguageLabel,
  resolveWritingOutputLanguage,
} from "./output-language";
import {
  getEffectivePromptTemplate,
  renderPromptTemplate,
} from "./prompt-templates";
import { filterProfileProjectsForAi } from "./resumeProjects";
import {
  getWritingStyle,
  stripKeywordLimitFromConstraints,
  stripLanguageDirectivesFromConstraints,
  stripWordLimitFromConstraints,
} from "./writing-style";

export interface TailoredData {
  summary: string;
  headline: string;
  skills: Array<{ name: string; keywords: string[] }>;
}

export interface TailoringResult {
  success: boolean;
  data?: TailoredData;
  error?: string;
}

/** JSON schema for resume tailoring response */
const TAILORING_SCHEMA: JsonSchemaDefinition = {
  name: "resume_tailoring",
  schema: {
    type: "object",
    properties: {
      headline: {
        type: "string",
        description: "Job title headline matching the JD exactly",
      },
      summary: {
        type: "string",
        description: "Tailored resume summary paragraph",
      },
      skills: {
        type: "array",
        description: "Skills sections with keywords tailored to the job",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Skill category name (e.g., Frontend, Backend)",
            },
            keywords: {
              type: "array",
              items: { type: "string" },
              description: "List of skills/technologies in this category",
            },
          },
          required: ["name", "keywords"],
          additionalProperties: false,
        },
      },
    },
    required: ["headline", "summary", "skills"],
    additionalProperties: false,
  },
};

/**
 * Generate tailored resume content (summary, headline, skills) for a job.
 */
export async function generateTailoring(
  jobDescription: string,
  profile: ResumeProfile,
): Promise<TailoringResult> {
  const [model, writingStyle, aiProfile] = await Promise.all([
    resolveLlmModel("tailoring"),
    getWritingStyle(),
    filterProfileProjectsForAi(profile),
  ]);
  const prompt = await buildTailoringPrompt(
    aiProfile,
    jobDescription,
    writingStyle,
  );

  const llm = await createConfiguredLlmService("tailoring");
  const result = await llm.callJson<TailoredData>({
    model,
    messages: [{ role: "user", content: prompt }],
    jsonSchema: TAILORING_SCHEMA,
  });

  if (!result.success) {
    const context = `provider=${llm.getProvider()} baseUrl=${llm.getBaseUrl()}`;
    if (result.error.toLowerCase().includes("api key")) {
      const message = `LLM API key not set, cannot generate tailoring. (${context})`;
      logger.warn(message);
      return { success: false, error: message };
    }
    return {
      success: false,
      error: `${result.error} (${context})`,
    };
  }

  const { summary, headline, skills } = result.data;

  // Basic validation
  if (!summary || !headline || !Array.isArray(skills)) {
    logger.warn("AI response missing required tailoring fields", result.data);
  }

  return {
    success: true,
    data: {
      summary: sanitizeText(summary || ""),
      headline: sanitizeText(headline || ""),
      skills: skills || [],
    },
  };
}

/**
 * Backwards compatibility wrapper if needed, or alias.
 */
export async function generateSummary(
  jobDescription: string,
  profile: ResumeProfile,
): Promise<{ success: boolean; summary?: string; error?: string }> {
  // If we just need summary, we can discard the rest (or cache it? but here we just return summary)
  const result = await generateTailoring(jobDescription, profile);
  return {
    success: result.success,
    summary: result.data?.summary,
    error: result.error,
  };
}

type WritingStyle = Awaited<ReturnType<typeof getWritingStyle>>;

/**
 * Fork: with the 職務経歴書 layout on, the tailored text follows the résumé's
 * language, not the ad's. The layout, headings and work history are Japanese,
 * so an English summary and skills for an English ad gave a mixed-language
 * document. A manually chosen language still wins.
 */
async function resolveTailoringLanguageStyle(
  style: WritingStyle,
): Promise<WritingStyle> {
  if (style.languageMode === "manual") return style;
  const [rendererRaw, themeRaw] = await Promise.all([
    settingsRepo.getSetting("pdfRenderer"),
    settingsRepo.getSetting("typstTheme"),
  ]);
  const renderer =
    settingsRegistry.pdfRenderer.parse(rendererRaw ?? undefined) ??
    settingsRegistry.pdfRenderer.default();
  const theme =
    settingsRegistry.typstTheme.parse(themeRaw ?? undefined) ??
    settingsRegistry.typstTheme.default();
  return renderer === "typst" && theme === "shokumu-keirekisho"
    ? { ...style, languageMode: "match-resume" }
    : style;
}

/**
 * Fork: appended after the template, so custom templates get it too. A
 * résumé without a skills section got skills copied from the ad ("CRM, Lead
 * Management") and career goals the candidate never stated.
 */
export const TAILORING_TRUTHFULNESS_RULES = `TRUTHFULNESS (always applies):
- Every skill, tool, qualification, language, achievement and number you write must be supported by MY PROFILE. Renaming a skill the profile shows to the JD's wording is fine. Adding a skill only because the JD asks for it is not.
- If MY PROFILE has no skills section, build the skill groups from what its experience, summary, education, certifications and languages actually show. Never copy requirements from the JD into the skills.
- Do not state career goals, interests, plans or motivations that MY PROFILE does not state.`;

async function buildTailoringPrompt(
  profile: ResumeProfile,
  jd: string,
  baseWritingStyle: WritingStyle,
): Promise<string> {
  const jobDescription = stripHtmlTags(jd);
  const writingStyle = await resolveTailoringLanguageStyle(baseWritingStyle);
  const resolvedLanguage = resolveWritingOutputLanguage({
    style: writingStyle,
    profile,
    jobDescription,
  });
  const outputLanguage = getWritingLanguageLabel(resolvedLanguage.language);
  let effectiveConstraints = stripLanguageDirectivesFromConstraints(
    writingStyle.constraints,
  );
  if (writingStyle.summaryMaxWords != null) {
    effectiveConstraints = stripWordLimitFromConstraints(effectiveConstraints);
  }
  if (writingStyle.maxKeywordsPerSkill != null) {
    effectiveConstraints =
      stripKeywordLimitFromConstraints(effectiveConstraints);
  }

  // Extract only needed parts of profile to save tokens
  const relevantProfile = {
    basics: {
      name: profile.basics?.name,
      label: profile.basics?.label, // Original headline
      summary: profile.basics?.summary,
    },
    skills: profile.sections?.skills,
    projects: profile.sections?.projects?.items?.map((p) => ({
      name: p.name,
      description: p.description,
      keywords: p.keywords,
    })),
    experience: profile.sections?.experience?.items?.map((e) => ({
      company: e.company,
      position: e.position,
      summary: e.summary,
    })),
    // Fork: so skills can be grounded in real languages, degrees and
    // certifications instead of the job ad.
    languages: profile.sections?.languages,
    education: profile.sections?.education,
    certifications: profile.sections?.certifications,
  };

  const template = await getEffectivePromptTemplate("tailoringPromptTemplate");

  const prompt = renderPromptTemplate(template, {
    jobDescription,
    profileJson: JSON.stringify(relevantProfile),
    outputLanguage,
    tone: writingStyle.tone,
    formality: writingStyle.formality,
    summaryMaxWordsLine:
      writingStyle.summaryMaxWords != null
        ? ` Maximum ${writingStyle.summaryMaxWords} ${writingStyle.summaryMaxWords === 1 ? "word" : "words"}.`
        : "",
    maxKeywordsPerSkillLine:
      writingStyle.maxKeywordsPerSkill != null
        ? `\n   - Maximum ${writingStyle.maxKeywordsPerSkill} ${writingStyle.maxKeywordsPerSkill === 1 ? "keyword" : "keywords"} per category. If a category has more, keep only the most JD-relevant ones.`
        : "",
    constraintsBullet: effectiveConstraints
      ? `- Additional constraints: ${effectiveConstraints}`
      : "",
    avoidTermsBullet: writingStyle.doNotUse
      ? `- Avoid these words or phrases: ${writingStyle.doNotUse}`
      : "",
  });
  return `${prompt}\n\n${TAILORING_TRUTHFULNESS_RULES}`;
}

function sanitizeText(text: string): string {
  return text
    .replace(/\*\*[\s\S]*?\*\*/g, "") // remove markdown bold
    .trim();
}
