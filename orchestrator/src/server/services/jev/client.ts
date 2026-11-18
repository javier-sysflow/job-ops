/**
 * TypeSafe's Jev: typed decisions over text (a yes/no probability, one option
 * from a list, or a place on 2-10 described levels), never generated text.
 *
 * Used only where a decision gates slower or costlier AI work, and always
 * fail-open: the key is read per call, and a call never throws. Every failure
 * comes back as a reason so callers can keep working without Jev.
 */
import { z } from "zod";

export const JEV_ENDPOINT = "https://api.typesafe.ai/v1/systemone";

/**
 * Pinned, not `jev-latest`: thresholds are tuned against one version and an
 * alias moves when TypeSafe ships. JEV_MODEL in the environment overrides it.
 */
const JEV_DEFAULT_MODEL = "jev-1.13.0";

/** Dollars per input token (list price, November 2026). Output is free. */
const JEV_USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;

export interface NoulQuestion {
  type: "noul";
  instructions: string;
  /** What a yes and a no mean, when the instruction leaves a middle ground. */
  criteria?: { true: string; false: string };
}
export interface ChoiceQuestion {
  type: "choice";
  instructions: string;
  /** Option id → what it means. Include a "none" option when nothing fits. */
  criteria: Record<string, string>;
}
export interface ScoreQuestion {
  type: "score";
  instructions: string;
  /** 2-10 ordered levels, each a situation that stands on its own. */
  criteria: string[];
}
export type JevQuestion = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export interface NoulAnswer {
  type: "noul";
  /** Probability that the answer is yes. */
  noul: number;
}
export interface ChoiceAnswer {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  /** How concentrated the distribution is, not whether it is right. */
  confidence: number;
}
export interface ScoreAnswer {
  type: "score";
  /** Probability-weighted level index. */
  score: number;
  probabilities: Record<string, number>;
  confidence: number;
}
type JevAnswer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export type AnswerFor<Q extends JevQuestion> = Q extends NoulQuestion
  ? NoulAnswer
  : Q extends ChoiceQuestion
    ? ChoiceAnswer
    : ScoreAnswer;

export type JevFailure =
  | "no_key"
  | "timeout"
  | "http_401"
  | "http_422"
  | "http_429"
  | "http_529"
  | "http_other"
  | "bad_body"
  | "network";

export type JevResult<Q extends Record<string, JevQuestion>> =
  | {
      ok: true;
      /** The versioned model that answered. */
      model: string;
      /** A missing answer had the wrong shape: treat it as no opinion. */
      answers: { [K in keyof Q]?: AnswerFor<Q[K]> };
      inputTokens: number;
      latencyMs: number;
    }
  | { ok: false; reason: JevFailure; status?: number; latencyMs: number };

const probability = z.number().min(0).max(1);
const noulShape = z.object({ noul: probability });
const choiceShape = z.object({
  choice: z.string(),
  probabilities: z.record(z.number()),
  confidence: probability,
});
const scoreShape = z.object({
  score: z.number(),
  probabilities: z.record(z.number()),
  confidence: probability,
});
const bodyShape = z.object({
  model: z.string(),
  answers: z.record(z.unknown()),
  usage: z.object({ input_tokens: z.number().optional() }).optional(),
});

/** Checks one answer against its question; null when it has the wrong shape. */
export function readAnswer(
  question: JevQuestion,
  raw: unknown,
): JevAnswer | null {
  if (question.type === "noul") {
    const parsed = noulShape.safeParse(raw);
    return parsed.success ? { type: "noul", noul: parsed.data.noul } : null;
  }
  if (question.type === "choice") {
    const parsed = choiceShape.safeParse(raw);
    // An option the question never offered is no opinion, not a new category.
    if (!parsed.success || !(parsed.data.choice in question.criteria)) {
      return null;
    }
    return { type: "choice", ...parsed.data };
  }
  const parsed = scoreShape.safeParse(raw);
  return parsed.success ? { type: "score", ...parsed.data } : null;
}

export function jevCostUsd(inputTokens: number): number {
  return inputTokens * JEV_USD_PER_INPUT_TOKEN;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function failureForStatus(status: number): JevFailure {
  if (status === 401) return "http_401";
  if (status === 422) return "http_422";
  if (status === 429) return "http_429";
  if (status === 529) return "http_529";
  return "http_other";
}

/**
 * One request: the state once, every question answered against it. Retries
 * once on 429/529 when the time budget allows; anything else is a reason.
 */
export async function askJev<Q extends Record<string, JevQuestion>>(
  state: unknown,
  questions: Q,
  opts: { timeoutMs?: number; model?: string; fetchImpl?: typeof fetch } = {},
): Promise<JevResult<Q>> {
  const started = Date.now();
  const failure = (reason: JevFailure, status?: number): JevResult<Q> => ({
    ok: false,
    reason,
    status,
    latencyMs: Date.now() - started,
  });

  const key = process.env.TYPESAFE_API_KEY?.trim();
  if (!key) return failure("no_key");
  const budget = opts.timeoutMs ?? 15_000;
  const doFetch = opts.fetchImpl ?? fetch;
  const model =
    opts.model ?? (process.env.JEV_MODEL?.trim() || JEV_DEFAULT_MODEL);
  const body = JSON.stringify({ model, state, questions });

  for (let attempt = 0; attempt < 2; attempt++) {
    const left = budget - (Date.now() - started);
    if (left <= 0) return failure("timeout");

    let response: Response;
    try {
      response = await doFetch(JEV_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(left),
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      return failure(
        name === "TimeoutError" || name === "AbortError"
          ? "timeout"
          : "network",
      );
    }

    if (response.ok) {
      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return failure("bad_body", response.status);
      }
      const parsed = bodyShape.safeParse(json);
      if (!parsed.success) return failure("bad_body", response.status);

      const answers: Record<string, JevAnswer> = {};
      for (const [id, question] of Object.entries(questions)) {
        const answer = readAnswer(question, parsed.data.answers[id]);
        if (answer) answers[id] = answer;
      }
      return {
        ok: true,
        model: parsed.data.model,
        answers: answers as { [K in keyof Q]?: AnswerFor<Q[K]> },
        inputTokens: parsed.data.usage?.input_tokens ?? 0,
        latencyMs: Date.now() - started,
      };
    }

    const busy = response.status === 429 || response.status === 529;
    if (busy && attempt === 0 && budget - (Date.now() - started) > 1500) {
      await sleep(300 + Math.random() * 200);
      continue;
    }
    return failure(failureForStatus(response.status), response.status);
  }
  return failure("http_429");
}
