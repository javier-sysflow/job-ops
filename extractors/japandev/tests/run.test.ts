import { describe, expect, it, vi } from "vitest";
import {
  parseJapanDevJobPage,
  parseSitemap,
  runJapanDev,
  selectCandidateUrls,
  toWorkplaceType,
} from "../src/run";

const JOB_A =
  "https://japan-dev.com/jobs/acme/acme-senior-backend-engineer-ab12cd";
const JOB_B = "https://japan-dev.com/jobs/beta/beta-product-designer-ef34gh";

const SITEMAP = `<?xml version="1.0"?>
<urlset>
  <url><loc>https://japan-dev.com/jobs</loc></url>
  <url><loc>${JOB_B}</loc><lastmod>2026-11-01</lastmod></url>
  <url><loc>${JOB_A}</loc><lastmod>2026-11-10</lastmod></url>
  <url><loc>https://japan-dev.com/blog/some-post</loc></url>
</urlset>`;

function jobPage(args: {
  title: string;
  company: string;
  description: string;
  remoteLevel?: string;
  japaneseLevel?: string;
  salary?: { min: number; max: number };
}): string {
  const posting = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: args.title,
    description: args.description,
    datePosted: "2026-11-09",
    validThrough: "2027-05-09",
    employmentType: "FULL_TIME",
    occupationalCategory: "Engineering",
    hiringOrganization: {
      "@type": "Organization",
      name: args.company,
      sameAs: "https://example.com",
      logo: "https://japan-dev.com/logo.png",
    },
    jobLocation: {
      "@type": "Place",
      address: { addressLocality: "Tokyo", addressCountry: "JP" },
    },
    ...(args.salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "JPY",
            value: {
              "@type": "QuantitativeValue",
              minValue: args.salary.min,
              maxValue: args.salary.max,
              unitText: "YEAR",
            },
          },
        }
      : {}),
  };
  // Nuxt payload: objects map field names to indexes into the same array.
  const nuxtData = [
    {
      title: 1,
      japanese_level_enum: 2,
      english_level_enum: 3,
      remote_level: 4,
      candidate_location: 5,
      sponsors_visas: 6,
      seniority_level: 7,
    },
    args.title,
    args.japaneseLevel ?? "japanese_level_business_level",
    "english_level_business_level",
    args.remoteLevel ?? "remote_level_partial",
    "candidate_location_anywhere",
    "sponsors_visas_yes",
    "seniority_level_senior",
  ];
  return `<html><head>
<script type="application/ld+json">{"@type":"Organization","name":"Japan Dev"}</script>
<script type="application/ld+json">${JSON.stringify(posting)}</script>
</head><body>
<script type="application/json" id="__NUXT_DATA__">${JSON.stringify(nuxtData)}</script>
</body></html>`;
}

function textResponse(body: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  } as Response;
}

describe("parseSitemap", () => {
  it("keeps only job URLs, newest first", () => {
    expect(parseSitemap(SITEMAP)).toEqual([
      { url: JOB_A, lastmod: "2026-11-10" },
      { url: JOB_B, lastmod: "2026-11-01" },
    ]);
  });
});

describe("selectCandidateUrls", () => {
  const entries = parseSitemap(SITEMAP);

  it("pre-filters English terms by slug", () => {
    expect(selectCandidateUrls(entries, "backend engineer", 10)).toEqual({
      urls: [JOB_A],
      needsTextMatch: false,
    });
  });

  it("falls back to recent listings plus text matching for Japanese terms", () => {
    expect(selectCandidateUrls(entries, "エンジニア", 1)).toEqual({
      urls: [JOB_A],
      needsTextMatch: true,
    });
  });
});

describe("parseJapanDevJobPage", () => {
  it("maps JobPosting data and Japan Dev facts", () => {
    const parsed = parseJapanDevJobPage(
      jobPage({
        title: "Senior Backend Engineer",
        company: "Acme",
        description: "<p>Build APIs in Go.</p>",
        salary: { min: 8_000_000, max: 12_000_000 },
      }),
      JOB_A,
    );

    expect(parsed?.workplaceType).toBe("hybrid");
    expect(parsed?.job).toMatchObject({
      source: "japandev",
      title: "Senior Backend Engineer",
      employer: "Acme",
      jobUrl: JOB_A,
      applicationLink: JOB_A,
      location: "Tokyo, Japan",
      jobType: "Full-time",
      jobLevel: "Senior",
      salaryMinAmount: 8_000_000,
      salaryMaxAmount: 12_000_000,
      salaryCurrency: "JPY",
      salaryInterval: "yearly",
      salary: "JPY 8,000,000–12,000,000 / year",
      deadline: "2027-05-09",
      workFromHomeType: "hybrid",
    });
    expect(parsed?.job.jobDescription).toContain(
      "<strong>Japanese level:</strong> Business level",
    );
    expect(parsed?.job.jobDescription).toContain(
      "<strong>Visa sponsorship:</strong> Yes",
    );
    expect(parsed?.job.jobDescription).toContain("Build APIs in Go.");
  });

  it("returns null when the page has no JobPosting", () => {
    expect(parseJapanDevJobPage("<html></html>", JOB_A)).toBeNull();
  });
});

describe("toWorkplaceType", () => {
  it("maps Japan Dev remote levels", () => {
    expect(toWorkplaceType("remote_level_full")).toBe("remote");
    expect(toWorkplaceType("remote_level_partial")).toBe("hybrid");
    expect(toWorkplaceType("remote_level_none")).toBe("onsite");
    expect(toWorkplaceType(undefined)).toBeUndefined();
  });
});

describe("runJapanDev", () => {
  function fetchFor(pages: Record<string, string>) {
    return vi.fn(async (url: string) => {
      if (url.endsWith("sitemap.xml")) return textResponse(SITEMAP);
      const page = pages[url];
      return page ? textResponse(page) : textResponse("", 404);
    });
  }

  it("returns matching jobs for English terms", async () => {
    const fetchMock = fetchFor({
      [JOB_A]: jobPage({
        title: "Senior Backend Engineer",
        company: "Acme",
        description: "<p>Go</p>",
      }),
    });

    const result = await runJapanDev({
      searchTerms: ["backend"],
      selectedCountry: "japan",
      fetchImpl: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });

    expect(result.success).toBe(true);
    expect(result.jobs.map((job) => job.jobUrl)).toEqual([JOB_A]);
  });

  it("matches Japanese terms against page text", async () => {
    const fetchMock = fetchFor({
      [JOB_A]: jobPage({
        title: "Senior Backend Engineer",
        company: "Acme",
        description:
          "<p>日本語ビジネスレベル必須。バックエンドエンジニア募集。</p>",
      }),
      [JOB_B]: jobPage({
        title: "Product Designer",
        company: "Beta",
        description: "<p>Design products.</p>",
      }),
    });

    const result = await runJapanDev({
      searchTerms: ["エンジニア"],
      selectedCountry: "japan",
      fetchImpl: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });

    expect(result.jobs.map((job) => job.jobUrl)).toEqual([JOB_A]);
  });

  it("respects workplace filters", async () => {
    const fetchMock = fetchFor({
      [JOB_A]: jobPage({
        title: "Senior Backend Engineer",
        company: "Acme",
        description: "<p>Go</p>",
        remoteLevel: "remote_level_none",
      }),
    });

    const result = await runJapanDev({
      searchTerms: ["backend"],
      selectedCountry: "japan",
      workplaceTypes: ["remote"],
      fetchImpl: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });

    expect(result.jobs).toEqual([]);
  });

  it("does nothing outside Japan", async () => {
    const fetchMock = vi.fn();

    const result = await runJapanDev({
      searchTerms: ["backend"],
      selectedCountry: "germany",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    expect(result).toEqual({ success: true, jobs: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a sitemap failure", async () => {
    const fetchMock = vi.fn(async () => textResponse("", 503));

    const result = await runJapanDev({
      searchTerms: ["backend"],
      selectedCountry: "japan",
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("503");
  });
});
