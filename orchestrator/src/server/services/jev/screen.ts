/**
 * Jev screening before Sonnet scoring.
 *
 * Jev answers four questions about a job against the candidate. Two of them
 * (overall fit and role match) decide whether full AI scoring is worth a call;
 * the other two are recorded for later analysis only. The rule and threshold
 * come from a replay of 405 Sonnet-scored jobs (2026-11-18): at 0.6 it would
 * have skipped 59% of scoring calls, and no skipped job scored above 22.
 *
 * Modes (JEV_SCREEN_MODE, and only when TYPESAFE_API_KEY is set):
 * - off (default): nothing runs.
 * - shadow: Jev runs beside Sonnet and its verdict is stored; nothing changes.
 * - gate: a confident "skip" verdict replaces the Sonnet call.
 */
import type { ChatStyleManualLanguage, Job } from "@shared/types";
import { stripHtmlTags } from "@shared/utils/string";
import {
  type AnswerFor,
  askJev,
  type JevFailure,
  type JevResult,
  type NoulQuestion,
  type ScoreQuestion,
} from "./client";

type JevScreenMode = "off" | "shadow" | "gate";

/** Bump when the questions or the rule change, so stored rows stay comparable. */
export const JEV_SCREEN_VERSION = "screen-v1";
const JEV_SCREEN_DEFAULT_THRESHOLD = 0.6;
export const JEV_SCREEN_JD_CHAR_LIMIT = 8000;

type ScreenQuestions = {
  overall_fit: ScoreQuestion;
  role_match: ScoreQuestion;
  location_conflict: NoulQuestion;
  missing_hard_requirement: NoulQuestion;
};

/** Written for any candidate: nothing here names a profession, city or person. */
export const SCREEN_QUESTIONS: ScreenQuestions = {
  overall_fit: {
    type: "score",
    instructions:
      "Overall, how strong a match is this job for the candidate, considering the work, required skills, seniority, location and the candidate's stated preferences?",
    criteria: [
      "Clearly unsuitable: the candidate would not be considered.",
      "Weak: major gaps in the core requirements.",
      "Mixed: some real overlap but meaningful gaps.",
      "Good: most requirements are met.",
      "Strong: a close match on the work and requirements.",
    ],
  },
  role_match: {
    type: "score",
    instructions:
      "How closely does the core day-to-day work of this job match the kind of work the candidate does and is targeting (their target roles and recent experience)? Judge the work itself, not the location, pay or seniority.",
    criteria: [
      "A different profession: the core work needs skills the candidate has never shown (for example finance sales, real estate, clinical care, mechanical engineering or sustainability auditing for someone who has done none of these).",
      "A different specialty in a related field: a few tools or duties overlap, but most of the core work is outside the candidate's experience.",
      "Partly the same work: roughly half of the core duties match the candidate's experience or target roles.",
      "Mostly the same work: most core duties match, with some unfamiliar tools or domains.",
      "The same kind of work the candidate does and is targeting.",
    ],
  },
  location_conflict: {
    type: "noul",
    instructions:
      "Do the job's location or work-arrangement rules rule the candidate out, given where the candidate lives and the work arrangement they want? Yes: on-site or hybrid work in a city or country the candidate does not live in while the candidate wants remote work, or remote work limited to countries or regions that exclude the candidate's location. No: fully remote without a location limit, remote within a region that includes the candidate, work in the candidate's own area, or the listing does not say.",
    criteria: {
      true: "The listing's location or work-arrangement rules rule the candidate out.",
      false:
        "The candidate could do this job from where they live, or the listing does not say.",
    },
  },
  missing_hard_requirement: {
    type: "noul",
    instructions:
      "Does the listing state a mandatory requirement the candidate clearly does not meet: a professional licence or credential (for example a nursing licence, CPA or security clearance), a specific required degree the candidate does not have, or a language the candidate does not speak? Ignore preferred or nice-to-have items and ignore years-of-experience numbers.",
    criteria: {
      true: "At least one stated must-have is clearly missing from the candidate's profile.",
      false:
        "No stated must-have is clearly missing, or the item is only preferred.",
    },
  },
};

type Env = Record<string, string | undefined>;

export function getJevScreenMode(env: Env = process.env): JevScreenMode {
  if (!env.TYPESAFE_API_KEY?.trim()) return "off";
  const raw = env.JEV_SCREEN_MODE?.trim().toLowerCase();
  return raw === "shadow" || raw === "gate" ? raw : "off";
}

/**
 * Below 0.5 "unsuitable" would not even be the most likely answer, so the
 * floor stays there; 0.99 keeps a typo from disabling the gate silently.
 */
export function getJevScreenThreshold(env: Env = process.env): number {
  const parsed = Number.parseFloat(env.JEV_SCREEN_THRESHOLD ?? "");
  if (!Number.isFinite(parsed)) return JEV_SCREEN_DEFAULT_THRESHOLD;
  return Math.min(0.99, Math.max(0.5, parsed));
}

function parseList(value: string | null | undefined): string[] | undefined {
  if (!value?.trim()) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const items = parsed.map(String).filter((item) => item.trim());
      return items.length ? items : undefined;
    }
    return [String(parsed)];
  } catch {
    return [value.trim()];
  }
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0),
    ),
  );
}

/**
 * The candidate block: the same trimmed profile Sonnet scores against (no
 * name or contact details), plus target roles and workplace preference.
 */
export function buildScreenCandidate(
  profile: Record<string, unknown>,
  prefs: {
    searchTerms?: string | null;
    workplaceTypes?: string | null;
    scoringInstructions?: string | null;
  } = {},
): Record<string, unknown> {
  return compact({
    ...profile,
    targetRoles: parseList(prefs.searchTerms),
    preferredWorkplaceTypes: parseList(prefs.workplaceTypes),
    extraInstructions: prefs.scoringInstructions?.trim() || undefined,
  });
}

/** The job block. Long descriptions are cut: Jev is weaker on large state. */
export function buildScreenJob(job: Job): Record<string, unknown> {
  const description = stripHtmlTags(job.jobDescription ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return compact({
    title: job.title,
    employer: job.employer,
    location: job.location,
    workArrangement: job.workFromHomeType,
    isRemote: job.isRemote ?? undefined,
    salary: job.salary,
    jobType: job.jobType,
    jobLevel: job.jobLevel,
    experienceRange: job.experienceRange,
    degreeRequired: job.degreeRequired,
    skills: job.skills,
    description: description
      ? description.slice(0, JEV_SCREEN_JD_CHAR_LIMIT)
      : "No description available",
    descriptionTruncated:
      description.length > JEV_SCREEN_JD_CHAR_LIMIT ? true : undefined,
  });
}

export type JevScreenSignals = {
  /** overall_fit: probability of "clearly unsuitable". */
  unsuitable: number | null;
  /** role_match: probability of "a different profession". */
  differentProfession: number | null;
  /** Probability-weighted level, 0 (worst) to 4 (best). */
  fitLevel: number | null;
  roleLevel: number | null;
  locationConflict: number | null;
  missingRequirement: number | null;
};

type ScreenAnswers = {
  [K in keyof ScreenQuestions]?: AnswerFor<ScreenQuestions[K]>;
};

export function readScreenSignals(answers: ScreenAnswers): JevScreenSignals {
  return {
    unsuitable: answers.overall_fit?.probabilities["0"] ?? null,
    differentProfession: answers.role_match?.probabilities["0"] ?? null,
    fitLevel: answers.overall_fit?.score ?? null,
    roleLevel: answers.role_match?.score ?? null,
    locationConflict: answers.location_conflict?.noul ?? null,
    missingRequirement: answers.missing_hard_requirement?.noul ?? null,
  };
}

export type JevScreenTrigger = "overall_fit" | "role_match";

/** Skip only on a confident "unsuitable" or "different profession". */
export function decideScreen(
  signals: JevScreenSignals,
  threshold: number,
): { verdict: "skip" | "score"; trigger: JevScreenTrigger | null } {
  const unsuitable = signals.unsuitable ?? 0;
  const different = signals.differentProfession ?? 0;
  if (Math.max(unsuitable, different) < threshold) {
    return { verdict: "score", trigger: null };
  }
  return {
    verdict: "skip",
    trigger: different > unsuitable ? "role_match" : "overall_fit",
  };
}

export type JevScreenOutcome =
  | {
      ok: true;
      version: string;
      verdict: "skip" | "score";
      trigger: JevScreenTrigger | null;
      threshold: number;
      signals: JevScreenSignals;
      model: string;
      inputTokens: number;
      latencyMs: number;
    }
  | {
      ok: false;
      version: string;
      reason: JevFailure;
      status?: number;
      latencyMs: number;
    };

type AskFn = (
  state: unknown,
  questions: ScreenQuestions,
) => Promise<JevResult<ScreenQuestions>>;

/** Never throws; a failed call is an outcome with ok: false. */
export async function screenJob(
  job: Job,
  candidate: Record<string, unknown>,
  opts: { threshold?: number; ask?: AskFn } = {},
): Promise<JevScreenOutcome> {
  const ask: AskFn =
    opts.ask ?? ((state, questions) => askJev(state, questions));
  const threshold = opts.threshold ?? JEV_SCREEN_DEFAULT_THRESHOLD;
  const result = await ask(
    { candidate, job: buildScreenJob(job) },
    SCREEN_QUESTIONS,
  ).catch(
    (): JevResult<ScreenQuestions> => ({
      ok: false,
      reason: "network",
      latencyMs: 0,
    }),
  );

  if (!result.ok) {
    return {
      ok: false,
      version: JEV_SCREEN_VERSION,
      reason: result.reason,
      status: result.status,
      latencyMs: result.latencyMs,
    };
  }

  const signals = readScreenSignals(result.answers);
  return {
    ok: true,
    version: JEV_SCREEN_VERSION,
    ...decideScreen(signals, threshold),
    threshold,
    signals,
    model: result.model,
    inputTokens: result.inputTokens,
    latencyMs: result.latencyMs,
  };
}

/**
 * Score stored for a job the gate skipped. Capped at 19 so it sits in the
 * band Sonnet uses for clear misfits and below any sensible auto-skip line.
 */
export function screenedOutScore(signals: JevScreenSignals): number {
  const level = signals.fitLevel ?? 0;
  return Math.min(19, Math.max(0, Math.round(level * 25)));
}

/** The reason shown on a job the gate skipped, in the user's output language. */
export function screenedOutReason(
  trigger: JevScreenTrigger | null,
  signals: JevScreenSignals,
  language: ChatStyleManualLanguage,
): string {
  const confidence =
    trigger === "role_match" ? signals.differentProfession : signals.unsuitable;
  const percent = Math.round((confidence ?? 0) * 100);

  if (language === "japanese") {
    return trigger === "role_match"
      ? `詳細なAI評価の前に除外しました：職務内容があなたの職種と大きく異なると判断しました（確信度${percent}%）。`
      : `詳細なAI評価の前に除外しました：プロフィールに明らかに合わない求人と判断しました（確信度${percent}%）。`;
  }
  return trigger === "role_match"
    ? `Screened out before full AI scoring: the core work looks like a different profession from yours (${percent}% sure).`
    : `Screened out before full AI scoring: this job looks clearly unsuitable for your profile (${percent}% sure).`;
}
