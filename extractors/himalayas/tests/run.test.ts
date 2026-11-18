import { describe, expect, it, vi } from "vitest";
import {
  formatRemoteLocation,
  resolveCountryQuery,
  runHimalayas,
} from "../src/run";

const NOW_MS = Date.parse("2026-11-18T00:00:00Z");
const nowSeconds = Math.floor(NOW_MS / 1000);

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => payload,
  } as Response;
}

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    guid: "https://himalayas.app/companies/acme/jobs/backend-engineer-1",
    title: "Backend Engineer",
    companyName: "Acme",
    companyLogo: "https://cdn.example/logo.png",
    employmentType: "Full Time",
    minSalary: 6_000_000,
    maxSalary: 9_000_000,
    salaryPeriod: "annual",
    currency: "JPY",
    seniority: ["Mid-level"],
    locationRestrictions: ["Japan"],
    parentCategories: ["Software Development"],
    description: "<p>Build APIs.</p>",
    pubDate: nowSeconds - 86_400,
    expiryDate: nowSeconds + 30 * 86_400,
    applicationLink:
      "https://himalayas.app/companies/acme/jobs/backend-engineer-1?utm_source=api",
    ...overrides,
  };
}

describe("runHimalayas", () => {
  it("maps jobs, keeps the apply link unchanged and links back to Himalayas", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ jobs: [makeJob()] }));

    const result = await runHimalayas({
      searchTerms: ["backend engineer"],
      selectedCountry: "japan",
      fetchImpl: fetchMock,
      sleep: async () => {},
      now: () => NOW_MS,
    });

    expect(result.success).toBe(true);
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]).toMatchObject({
      source: "himalayas",
      title: "Backend Engineer",
      employer: "Acme",
      jobUrl: "https://himalayas.app/companies/acme/jobs/backend-engineer-1",
      applicationLink:
        "https://himalayas.app/companies/acme/jobs/backend-engineer-1?utm_source=api",
      location: "Remote (Japan)",
      salaryMinAmount: 6_000_000,
      salaryMaxAmount: 9_000_000,
      salaryCurrency: "JPY",
      salaryInterval: "yearly",
      salary: "JPY 6,000,000–9,000,000 / year",
      isRemote: true,
    });

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.searchParams.get("country")).toBe("JP");
    expect(requestedUrl.searchParams.get("q")).toBe("backend engineer");
    expect(requestedUrl.searchParams.get("sort")).toBe("recent");
  });

  it("drops expired jobs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        jobs: [makeJob({ expiryDate: nowSeconds - 60 })],
      }),
    );

    const result = await runHimalayas({
      searchTerms: ["engineer"],
      fetchImpl: fetchMock,
      sleep: async () => {},
      now: () => NOW_MS,
    });

    expect(result.jobs).toEqual([]);
  });

  it("pages until the per-term budget is reached", async () => {
    const page = (start: number) => ({
      jobs: Array.from({ length: 20 }, (_, index) =>
        makeJob({
          guid: `https://himalayas.app/companies/acme/jobs/job-${start + index}`,
        }),
      ),
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(page(0)))
      .mockResolvedValueOnce(jsonResponse(page(20)));

    const result = await runHimalayas({
      searchTerms: ["engineer"],
      maxJobsPerTerm: 25,
      fetchImpl: fetchMock,
      sleep: async () => {},
      now: () => NOW_MS,
    });

    expect(result.jobs).toHaveLength(25);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries after a 429 using Retry-After", async () => {
    const rateLimited = {
      ok: false,
      status: 429,
      headers: new Headers({ "retry-after": "2" }),
      json: async () => ({}),
    } as Response;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(rateLimited)
      .mockResolvedValueOnce(jsonResponse({ jobs: [makeJob()] }));
    const sleep = vi.fn(async () => {});

    const result = await runHimalayas({
      searchTerms: ["engineer"],
      fetchImpl: fetchMock,
      sleep,
      now: () => NOW_MS,
    });

    expect(result.jobs).toHaveLength(1);
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it("skips the source when the run excludes remote work", async () => {
    const fetchMock = vi.fn();

    const result = await runHimalayas({
      searchTerms: ["engineer"],
      workplaceTypes: ["onsite"],
      fetchImpl: fetchMock,
    });

    expect(result).toEqual({ success: true, jobs: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports an error when the API fails before any job is found", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 500));

    const result = await runHimalayas({
      searchTerms: ["engineer"],
      fetchImpl: fetchMock,
      sleep: async () => {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("500");
  });
});

describe("formatRemoteLocation", () => {
  it("keeps long country lists readable, leading with the candidate's country", () => {
    const many = ["Albania", "Brazil", "Canada", "Japan", "Mexico", "Spain"];
    expect(formatRemoteLocation([])).toBe("Remote (Worldwide)");
    expect(formatRemoteLocation(["Japan", "Korea"])).toBe(
      "Remote (Japan, Korea)",
    );
    expect(formatRemoteLocation(many, "Japan")).toBe(
      "Remote (Japan + 5 other countries)",
    );
    expect(formatRemoteLocation(many)).toBe("Remote (6 countries)");
  });
});

describe("resolveCountryQuery", () => {
  it("uses ISO codes for countries and worldwide otherwise", () => {
    expect(resolveCountryQuery("japan")).toEqual({ country: "JP" });
    expect(resolveCountryQuery("worldwide")).toEqual({ worldwide: true });
    expect(resolveCountryQuery(undefined)).toEqual({ worldwide: true });
  });
});
