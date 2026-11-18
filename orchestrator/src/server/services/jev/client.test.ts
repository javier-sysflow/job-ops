import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { askJev, JEV_ENDPOINT, jevCostUsd, readAnswer } from "./client";

const questions = {
  fit: {
    type: "score" as const,
    instructions: "How good a fit?",
    criteria: ["Bad", "Good"],
  },
  remote: { type: "noul" as const, instructions: "Is it remote?" },
  kind: {
    type: "choice" as const,
    instructions: "Which kind?",
    criteria: { eng: "Engineering", ops: "Operations" },
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("askJev", () => {
  beforeEach(() => {
    vi.stubEnv("TYPESAFE_API_KEY", "test-key");
    vi.stubEnv("JEV_MODEL", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns no_key without calling the API when the key is missing", async () => {
    vi.stubEnv("TYPESAFE_API_KEY", "  ");
    const fetchImpl = vi.fn();
    const result = await askJev({}, questions, { fetchImpl });
    expect(result).toMatchObject({ ok: false, reason: "no_key" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends state and questions with the pinned model and parses answers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model: "jev-1.13.0",
        answers: {
          fit: {
            score: 0.2,
            probabilities: { "0": 0.8, "1": 0.2 },
            confidence: 0.6,
          },
          remote: { noul: 0.9 },
          kind: {
            choice: "eng",
            probabilities: { eng: 0.7, ops: 0.3 },
            confidence: 0.4,
          },
        },
        usage: { input_tokens: 1234 },
      }),
    );

    const result = await askJev({ a: 1 }, questions, { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(JEV_ENDPOINT);
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-key",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      model: "jev-1.13.0",
      state: { a: 1 },
      questions,
    });
    expect(result).toMatchObject({
      ok: true,
      model: "jev-1.13.0",
      inputTokens: 1234,
      answers: {
        fit: { type: "score", score: 0.2 },
        remote: { type: "noul", noul: 0.9 },
        kind: { type: "choice", choice: "eng" },
      },
    });
  });

  it("drops answers with the wrong shape instead of failing the call", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        model: "jev-1.13.0",
        answers: {
          fit: { score: "high" },
          remote: { noul: 1.4 },
          kind: { choice: "sales", probabilities: { sales: 1 }, confidence: 1 },
        },
      }),
    );

    const result = await askJev({}, questions, { fetchImpl });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.answers).toEqual({});
  });

  it("retries once when the API is busy", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 429 }))
      .mockResolvedValueOnce(
        jsonResponse({
          model: "jev-1.13.0",
          answers: { remote: { noul: 0.1 } },
        }),
      );

    const result = await askJev({}, questions, { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
  });

  it("reports HTTP failures as reasons", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("nope", { status: 401 }));
    const result = await askJev({}, questions, { fetchImpl });
    expect(result).toMatchObject({
      ok: false,
      reason: "http_401",
      status: 401,
    });
  });

  it("reports network errors and timeouts as reasons", async () => {
    const network = await askJev({}, questions, {
      fetchImpl: vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    });
    expect(network).toMatchObject({ ok: false, reason: "network" });

    const timeoutError = new Error("timed out");
    timeoutError.name = "TimeoutError";
    const timeout = await askJev({}, questions, {
      fetchImpl: vi.fn().mockRejectedValue(timeoutError),
    });
    expect(timeout).toMatchObject({ ok: false, reason: "timeout" });
  });

  it("reports an unreadable body as bad_body", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ answers: "not an object" }));
    const result = await askJev({}, questions, { fetchImpl });
    expect(result).toMatchObject({ ok: false, reason: "bad_body" });
  });
});

describe("readAnswer and jevCostUsd", () => {
  it("rejects choices the question never offered", () => {
    expect(
      readAnswer(questions.kind, {
        choice: "other",
        probabilities: { other: 1 },
        confidence: 1,
      }),
    ).toBeNull();
  });

  it("prices input tokens at the list rate", () => {
    expect(jevCostUsd(1_000_000)).toBeCloseTo(0.042);
  });
});
