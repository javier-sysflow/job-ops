import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readPdfText } from "../resume-renderer/test-utils";

const mocks = vi.hoisted(() => ({
  getSetting: vi.fn(),
  getJobRirekisho: vi.fn(),
  saveJobMotivation: vi.fn(),
  getJobById: vi.fn(),
  callJson: vi.fn(),
}));

vi.mock("../../repositories/settings", () => ({
  getSetting: mocks.getSetting,
}));
vi.mock("../../repositories/job-rirekisho", () => ({
  getJobRirekisho: mocks.getJobRirekisho,
  saveJobMotivation: mocks.saveJobMotivation,
}));
vi.mock("../../repositories/jobs", () => ({
  getJobById: mocks.getJobById,
}));
vi.mock("../modelSelection", () => ({
  resolveLlmModel: vi.fn(async () => "test-model"),
  createConfiguredLlmService: vi.fn(async () => ({
    callJson: mocks.callJson,
  })),
}));
vi.mock("../profile", () => ({
  getProfile: vi.fn(async () => ({
    basics: { summary: "法人営業の経験があります。" },
  })),
}));
vi.mock("../pdf", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../pdf")>();
  return {
    ...actual,
    loadBaseResumeSource: vi.fn(async () => ({ data: RESUME, mode: "v5" })),
  };
});

const RESUME = {
  basics: {
    name: "山田 花子",
    phone: "090-1234-5678",
    email: "hanako@example.com",
    location: "〒160-0023 東京都新宿区西新宿1-1-1",
    customFields: [
      { id: "1", icon: "", text: "ふりがな：やまだ はなこ", link: "" },
    ],
  },
  summary: { title: "志望動機", content: "<p>基本の志望動機です。</p>" },
  sections: {
    education: {
      items: [
        { school: "見本大学", area: "文学部", period: "2017年4月 - 2021年3月" },
      ],
    },
    experience: {
      items: [
        {
          company: "サンプル商事株式会社",
          position: "",
          period: "2021年4月 - 現在",
          description: "<p>法人営業</p>",
        },
      ],
    },
    certifications: {
      items: [{ title: "普通自動車第一種運転免許", date: "2020年11月" }],
    },
  },
  metadata: { notes: "" },
};

function settings(values: Record<string, string | null>) {
  mocks.getSetting.mockImplementation(
    async (key: string) => values[key] ?? null,
  );
}

function typstAvailable(): boolean {
  const binary = process.env.TYPST_BIN?.trim() || "typst";
  return spawnSync(binary, ["--version"], { stdio: "ignore" }).status === 0;
}

function typstHasJapaneseFonts(): boolean {
  const binary = process.env.TYPST_BIN?.trim() || "typst";
  const result = spawnSync(binary, ["fonts"], { encoding: "utf8" });
  return (
    result.status === 0 && /Noto (Serif|Sans) CJK JP/.test(result.stdout ?? "")
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  settings({});
  mocks.getJobById.mockResolvedValue({
    id: "job-1",
    title: "法人営業",
    employer: "株式会社テスト",
    location: "東京都",
    jobDescription: "<p>太陽光の法人営業を募集します。</p>",
    jobBrief: null,
  });
});

describe("refreshJobMotivationAfterTailoring", () => {
  it("does nothing without the 職務経歴書 layout", async () => {
    const { refreshJobMotivationAfterTailoring } = await import("./index");
    settings({ typstTheme: "classic" });
    await refreshJobMotivationAfterTailoring("job-1", { tailoringRan: true });
    expect(mocks.callJson).not.toHaveBeenCalled();
    expect(mocks.saveJobMotivation).not.toHaveBeenCalled();
  });

  it("writes the job's 志望動機 after tailoring", async () => {
    const { refreshJobMotivationAfterTailoring } = await import("./index");
    settings({ typstTheme: "shokumu-keirekisho" });
    mocks.getJobRirekisho.mockResolvedValue(null);
    mocks.callJson.mockResolvedValue({
      success: true,
      data: {
        motivation: "**貴社**の事業に惹かれました。\n\n\n経験を活かします。",
      },
    });

    await refreshJobMotivationAfterTailoring("job-1", { tailoringRan: true });

    expect(mocks.saveJobMotivation).toHaveBeenCalledWith(
      "job-1",
      "貴社の事業に惹かれました。\n\n経験を活かします。",
      "ai",
    );
    const prompt = mocks.callJson.mock.calls[0][0].messages[0]
      .content as string;
    expect(prompt).toContain("株式会社テスト");
    expect(prompt).toContain("太陽光の法人営業を募集します。");
    expect(prompt).toContain("基本の志望動機です。");
    expect(prompt).not.toContain("<p>");
  });

  it("never overwrites a 志望動機 the user edited", async () => {
    const { refreshJobMotivationAfterTailoring } = await import("./index");
    settings({ typstTheme: "shokumu-keirekisho" });
    mocks.getJobRirekisho.mockResolvedValue({
      jobId: "job-1",
      motivation: "自分で書きました。",
      motivationSource: "user",
      updatedAt: "2026-11-19T00:00:00.000Z",
    });
    await refreshJobMotivationAfterTailoring("job-1", { tailoringRan: true });
    expect(mocks.callJson).not.toHaveBeenCalled();
  });

  it("keeps an AI 志望動機 when the tailoring did not run again", async () => {
    const { refreshJobMotivationAfterTailoring } = await import("./index");
    settings({ typstTheme: "shokumu-keirekisho" });
    mocks.getJobRirekisho.mockResolvedValue({
      jobId: "job-1",
      motivation: "以前の文章",
      motivationSource: "ai",
      updatedAt: "2026-11-19T00:00:00.000Z",
    });
    await refreshJobMotivationAfterTailoring("job-1", { tailoringRan: false });
    expect(mocks.callJson).not.toHaveBeenCalled();
  });

  it("does not throw when the model fails", async () => {
    const { refreshJobMotivationAfterTailoring } = await import("./index");
    settings({ typstTheme: "shokumu-keirekisho" });
    mocks.getJobRirekisho.mockResolvedValue(null);
    mocks.callJson.mockResolvedValue({ success: false, error: "rate limited" });
    await expect(
      refreshJobMotivationAfterTailoring("job-1", { tailoringRan: true }),
    ).resolves.toBeUndefined();
    expect(mocks.saveJobMotivation).not.toHaveBeenCalled();
  });
});

describe("renderRirekishoPdf", () => {
  const tempDirs: string[] = [];
  afterEach(async () => {
    await Promise.all(
      tempDirs
        .splice(0)
        .map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  async function renderToText(
    resumeJson: Record<string, unknown>,
    motivation: string | null,
  ): Promise<string[]> {
    const { renderRirekishoPdf } = await import("./index");
    const pdf = await renderRirekishoPdf({
      resumeJson,
      motivation,
      jobId: "test",
    });
    const dir = await mkdtemp(join(tmpdir(), "job-ops-rirekisho-test-"));
    tempDirs.push(dir);
    const path = join(dir, "rirekisho.pdf");
    await writeFile(path, pdf);
    return (await readPdfText(path))
      .split("\n")
      .map((page) => page.replace(/\s+/g, ""));
  }

  it.skipIf(!typstAvailable() || !typstHasJapaneseFonts())(
    "fills the two-page form from the résumé and the profile",
    async () => {
      settings({
        rirekishoProfile: JSON.stringify({
          birthDate: "1998-10-22",
          gender: "",
        }),
        timeZone: "Asia/Tokyo",
      });
      const pages = await renderToText(RESUME, "貴社の事業に惹かれました。");

      expect(pages).toHaveLength(2);
      expect(pages[0]).toContain("履歴書");
      expect(pages[0]).toContain("やまだはなこ");
      expect(pages[0]).toContain("山田花子");
      expect(pages[0]).toMatch(/1998年10月22日生（満\d+歳）/);
      expect(pages[0]).toContain("〒160-0023");
      expect(pages[0]).toContain("見本大学文学部卒業");
      expect(pages[0]).toContain("サンプル商事株式会社入社");
      expect(pages[0]).toContain("現在に至る");
      expect(pages[0]).toContain("以上");
      expect(pages[0]).toContain("※「性別」欄");
      expect(pages[1]).toContain("普通自動車第一種運転免許");
      expect(pages[1]).toContain("貴社の事業に惹かれました。");
      expect(pages[1]).toContain("貴社の規定に従います。");
      expect(pages[1]).not.toContain("※「性別」欄");
    },
  );

  it.skipIf(!typstAvailable() || !typstHasJapaneseFonts())(
    "carries a long history over to page 2 and still prints the rest",
    async () => {
      settings({});
      const items = Array.from({ length: 22 }, (_, index) => ({
        company: `株式会社テスト${index + 1}`,
        position: "",
        period: `${2000 + index}年4月 - ${2001 + index}年3月`,
        description: "<p>営業</p>",
      }));
      const pages = await renderToText(
        { ...RESUME, sections: { ...RESUME.sections, experience: { items } } },
        null,
      );

      expect(pages.length).toBeGreaterThanOrEqual(2);
      expect(pages.length).toBeLessThanOrEqual(3);
      const all = pages.join("");
      expect(all).toContain("株式会社テスト22退職");
      expect(all).toContain("普通自動車第一種運転免許");
      expect(all).toContain("基本の志望動機です。");
      // The 学歴・職歴 header repeats where the table continues.
      expect(pages[1]).toContain("学歴・職歴");
    },
  );
});
