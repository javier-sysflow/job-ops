import type { Server } from "node:http";
import JSZip from "jszip";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startServer, stopServer } from "./test-utils";

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function documentText(response: Response): Promise<string> {
  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const xml = (await zip.file("word/document.xml")?.async("string")) ?? "";
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((match) => match[1])
    .join("");
}

describe.sequential("Word resume downloads", () => {
  let server: Server;
  let baseUrl: string;
  let closeDb: () => void;
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ server, baseUrl, closeDb, tempDir } = await startServer());
  });

  afterEach(async () => {
    await stopServer({ server, closeDb, tempDir });
  });

  async function seedDesignResume() {
    const { replaceCurrentDesignResumeDocument } = await import(
      "@server/services/design-resume"
    );
    const { buildDefaultReactiveResumeDocument } = await import(
      "@server/services/rxresume/document"
    );
    const resume = buildDefaultReactiveResumeDocument() as {
      basics: Record<string, unknown>;
      summary: Record<string, unknown>;
      sections: { experience: { items: unknown[] } };
    };
    resume.basics.name = "山田 花子";
    resume.summary.content = "<p>決済領域のバックエンドエンジニア。</p>";
    resume.sections.experience.items = [
      {
        id: "exp-1",
        hidden: false,
        company: "株式会社サクラペイメンツ",
        position: "エンジニア",
        location: "東京",
        period: "2021年4月～現在",
        website: { url: "", label: "" },
        description: "<ul><li>決済APIを開発</li></ul>",
        roles: [],
      },
    ];
    await replaceCurrentDesignResumeDocument({
      resumeJson: resume as never,
      sourceResumeId: null,
      sourceMode: null,
    });
  }

  it("returns 404 before a resume is imported", async () => {
    const res = await fetch(`${baseUrl}/api/design-resume/docx`);
    expect(res.status).toBe(404);
  });

  it("downloads the Resume Studio resume as .docx", async () => {
    await seedDesignResume();

    const res = await fetch(`${baseUrl}/api/design-resume/docx`);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(DOCX_TYPE);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("content-disposition")).toMatch(
      /^attachment; filename="[^"]+\.docx"; filename\*=UTF-8''.+\.docx$/,
    );
    expect(await documentText(res)).toContain("株式会社サクラペイメンツ");
  });

  it("downloads a job's tailored resume as .docx", async () => {
    await seedDesignResume();
    const { createJob, updateJob } = await import("@server/repositories/jobs");
    const job = await createJob({
      source: "manual",
      title: "Backend Engineer",
      employer: "Kumo Inc",
      jobUrl: "https://example.com/job/docx",
      jobDescription: "Go, Kubernetes, payments.",
    });
    await updateJob(job.id, {
      tailoredSummary:
        "決済基盤の経験を活かし、貴社のバックエンド開発に貢献します。",
    });

    const res = await fetch(`${baseUrl}/api/jobs/${job.id}/docx`);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(DOCX_TYPE);
    expect(res.headers.get("content-disposition")).toContain(
      "Kumo_Inc-Backend_Engineer-resume.docx",
    );
    expect(await documentText(res)).toContain(
      "決済基盤の経験を活かし、貴社のバックエンド開発に貢献します。",
    );
  });

  it("returns 404 for an unknown job", async () => {
    const res = await fetch(`${baseUrl}/api/jobs/does-not-exist/docx`);
    expect(res.status).toBe(404);
  });
});
