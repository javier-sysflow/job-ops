import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TYPST_THEME_VALUES, type TypstTheme } from "@shared/types";
import { afterEach, describe, expect, it } from "vitest";
import { buildResumeRenderDocument } from "./document";
import shokumuFixture from "./fixtures/shokumu-keirekisho-ja.json";
import { readPdfPageSizes, readPdfText } from "./test-utils";
import type { ResumeRenderDocument } from "./types";
import {
  buildTypstDocument,
  convertDocFieldsToTypst,
  getTypstBinary,
  getTypstTemplatePath,
  readTypstTemplate,
  readTypstTheme,
  readTypstThemeManifest,
  renderTypstPdf,
  type TypstThemeTokens,
} from "./typst";

const nativeThemes = new Set(["classic", "compact"]);

const baseDocument: ResumeRenderDocument = {
  name: "Jane Doe",
  headline: "Senior Software Engineer",
  location: "London, UK",
  picture: null,
  contactItems: [
    { text: "jane@example.com", url: "mailto:jane@example.com" },
    { text: "Portfolio", url: "https://jane.dev" },
  ],
  profileItems: [],
  customFieldItems: [],
  summary: "Builds resilient platform systems.",
  experience: [
    {
      title: "Acme",
      subtitle: "Platform Engineer | Remote",
      date: "2023 -- Present",
      bullets: ["Improved API reliability", "Reduced operator toil"],
      url: "https://acme.example.com",
      linkLabel: "Acme",
    },
  ],
  education: [],
  projects: [],
  skillGroups: [
    {
      name: "Backend",
      keywords: ["TypeScript", "Node.js", "PostgreSQL"],
    },
  ],
  languages: [],
  interests: [],
  awards: [],
  certifications: [],
  publications: [],
  volunteer: [],
  references: [],
};

async function createTempDir(): Promise<string> {
  return await mkdtemp(join(tmpdir(), "job-ops-typst-render-test-"));
}

function typstAvailable(): boolean {
  const binary = process.env.TYPST_BIN?.trim() || "typst";
  const result = spawnSync(binary, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

/** Text assertions on Japanese output need real CJK glyphs, not tofu. */
function typstHasJapaneseFonts(): boolean {
  const binary = process.env.TYPST_BIN?.trim() || "typst";
  const result = spawnSync(binary, ["fonts"], { encoding: "utf8" });
  return (
    result.status === 0 && /Noto (Serif|Sans) CJK JP/.test(result.stdout ?? "")
  );
}

/** PDF text with all whitespace removed, so tracking and CJK spacing don't matter. */
async function readCompactPdfText(pdfPath: string): Promise<string> {
  return (await readPdfText(pdfPath)).replace(/\s+/g, "");
}

async function readNativeThemeTokens(
  theme: TypstTheme,
): Promise<TypstThemeTokens> {
  const loadedTheme = await readTypstTheme(theme);
  if (!loadedTheme.tokens) {
    throw new Error(`Expected ${theme} to be a native Typst theme`);
  }
  return loadedTheme.tokens;
}

describe("typst resume renderer", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map(async (dir) => {
        await rm(dir, { recursive: true, force: true });
      }),
    );
  });

  it("exposes the bundled Typst template", async () => {
    expect(getTypstTemplatePath().replace(/\\/g, "/")).toContain(
      "typst-themes/classic/main.typ",
    );
    const template = await readTypstTemplate();
    expect(template).toContain("#set page");
    expect(template).toContain("__BODY__");
  });

  it("loads every generated Typst theme manifest", async () => {
    for (const theme of TYPST_THEME_VALUES) {
      const manifest = await readTypstThemeManifest(theme);
      expect(manifest.id).toBe(theme);
      expect(manifest.entrypoint).toBe("main.typ");
      expect(["native", "adapted"]).toContain(manifest.kind);
      if (nativeThemes.has(theme)) {
        expect(manifest.tokens).toBeDefined();
      } else {
        expect(manifest.tokens).toBeUndefined();
      }
      expect(getTypstTemplatePath(theme).replace(/\\/g, "/")).toContain(
        `typst-themes/${theme}/main.typ`,
      );
    }
  });

  it("uses the TYPST_BIN override when present", () => {
    const previous = process.env.TYPST_BIN;
    process.env.TYPST_BIN = "/tmp/custom-typst";
    expect(getTypstBinary()).toBe("/tmp/custom-typst");
    if (previous === undefined) {
      delete process.env.TYPST_BIN;
    } else {
      process.env.TYPST_BIN = previous;
    }
  });

  it("renders the classic theme tokens and English section titles", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const typst = buildTypstDocument(
      {
        ...baseDocument,
        sectionTitles: undefined,
      },
      "__PAGE_MARGIN__\n__BODY_SIZE__\n__NAME__\n__BODY__",
      tokens,
    );

    expect(typst).toContain("(x: 0.65in, y: 0.58in)");
    expect(typst).toContain("10pt");
    expect(typst).toContain("Jane Doe");
    expect(typst).toContain("= Summary");
    expect(typst).toContain("= Experience");
    expect(typst).toContain("= Technical Skills");
  });

  it("renders compact theme tokens and localized section titles", async () => {
    const tokens = await readNativeThemeTokens("compact");
    const typst = buildTypstDocument(
      {
        ...baseDocument,
        education: [
          {
            title: "University",
            subtitle: "MSc",
            date: "2020",
            bullets: ["Studied distributed systems"],
          },
        ],
        projects: [
          {
            title: "Platform",
            subtitle: "TypeScript",
            date: "2024",
            bullets: ["Built deployment tooling"],
          },
        ],
        sectionTitles: {
          profiles: "Perfiles",
          summary: "Resumen",
          customFields: "Campos personalizados",
          experience: "Experiencia",
          education: "Educación",
          projects: "Proyectos",
          skills: "Habilidades técnicas",
          languages: "Idiomas",
          interests: "Intereses",
          awards: "Premios",
          certifications: "Certificaciones",
          publications: "Publicaciones",
          volunteer: "Voluntariado",
          references: "Referencias",
        },
      },
      "__PAGE_MARGIN__\n__BODY_SIZE__\n__NAME__\n__BODY__",
      tokens,
    );

    expect(typst).toContain("(x: 0.48in, y: 0.45in)");
    expect(typst).toContain("9pt");
    expect(typst).toContain("= Resumen");
    expect(typst).toContain("= Experiencia");
    expect(typst).toContain("= Habilidades técnicas");
  });

  it("respects custom core section ordering", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const typst = buildTypstDocument(
      {
        ...baseDocument,
        education: [
          {
            title: "University",
            subtitle: "MSc",
            date: "2020",
            bullets: ["Studied distributed systems"],
          },
        ],
        projects: [
          {
            title: "Platform",
            subtitle: "TypeScript",
            date: "2024",
            bullets: ["Built deployment tooling"],
          },
        ],
        sectionOrder: ["skills", "projects", "experience", "education"],
      },
      "__BODY__",
      tokens,
    );

    expect(typst.indexOf("= Technical Skills")).toBeLessThan(
      typst.indexOf("= Projects"),
    );
    expect(typst.indexOf("= Projects")).toBeLessThan(
      typst.indexOf("= Experience"),
    );
  });

  it("exposes a stable resume data path for package-backed themes", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const typst = buildTypstDocument(
      baseDocument,
      "#let resume = json(__RESUME_DATA_PATH__)\n__NAME__",
      tokens,
    );

    expect(typst).toContain('#let resume = json("resume-data.json")');
  });

  it("leaves the paper size to the render call in every theme template", async () => {
    for (const theme of TYPST_THEME_VALUES) {
      const template = await readTypstTemplate(theme);

      expect(template, theme).toContain("paper: __PAGE_PAPER__");
      expect(template, theme).not.toMatch(/paper:\s*"/);
    }
  });

  it("renders the requested paper size using Typst's paper names", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const template = "#set page(paper: __PAGE_PAPER__)";

    expect(buildTypstDocument(baseDocument, template, tokens, "letter")).toBe(
      '#set page(paper: "us-letter")',
    );
    expect(buildTypstDocument(baseDocument, template, tokens, "a4")).toBe(
      '#set page(paper: "a4")',
    );
  });

  it("keeps rendering A4 when the paper size is left to the renderer", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const template = "#set page(paper: __PAGE_PAPER__)";

    expect(buildTypstDocument(baseDocument, template, tokens, "auto")).toBe(
      '#set page(paper: "a4")',
    );
    expect(buildTypstDocument(baseDocument, template, tokens)).toBe(
      '#set page(paper: "a4")',
    );
  });

  it("keeps links in the clean-print-cv adapter", async () => {
    const template = await readTypstTemplate("clean-print-cv");

    expect(template).toContain("link-or-text");
    expect(template).toContain("profile-label-matching(is-linkedin-profile)");
    expect(template).toContain("profile-label-matching(is-github-profile)");
    expect(template).toContain("linked-entry-label(entry");
    // Projects show the URL as a link when they have no period to display.
    expect(template).toContain("link(url)[#url]");
  });

  it("renders award-style sections as Typst bullet lists in clean-print-cv", async () => {
    const template = await readTypstTemplate("clean-print-cv");

    expect(template).toContain("#let bullet-trailing(entry)");
    expect(template).toContain('text-of(section-titles.at("awards"');
    expect(template).toContain("trailing: bullet-trailing(entry)");
  });

  it("keeps the shokumu-keirekisho theme offline and data-driven", async () => {
    const { manifest, template } = await readTypstTheme("shokumu-keirekisho");

    expect(manifest.kind).toBe("adapted");
    expect(template).toContain("json(__RESUME_DATA_PATH__)");
    // Plain Typst only: package imports would need network access at render time.
    expect(template).not.toMatch(/#import\b/);
    expect(template).toContain('"Noto Serif CJK JP"');
    expect(template).toContain('lang: if is-japanese { "ja" }');
  });

  it("renders the newly supported native sections and picture block", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const typst = buildTypstDocument(
      {
        ...baseDocument,
        picture: {
          url: "https://jane.dev/photo.png",
          assetId: null,
          renderPath: "/tmp/resume-picture.png",
          hidden: false,
          size: 88,
          rotation: 0,
          aspectRatio: 1,
          borderRadius: 0,
          borderColor: "",
          borderWidth: 0,
          shadowColor: "",
          shadowWidth: 0,
        },
        profileItems: [
          {
            network: "LinkedIn",
            username: "janedoe",
            url: "https://linkedin.com/in/janedoe",
          },
        ],
        customFieldItems: [
          {
            title: "Availability",
            text: "Open to relocation",
            url: null,
          },
        ],
        languages: [{ language: "English", fluency: "Native", level: 5 }],
        interests: [{ name: "Climbing", keywords: ["Bouldering"] }],
        awards: [
          {
            title: "Engineer of the Year",
            subtitle: "Acme",
            date: "2024",
            bullets: ["Recognized for platform leadership"],
          },
        ],
        certifications: [
          {
            title: "AWS Solutions Architect",
            subtitle: "Amazon",
            date: "2023",
            bullets: ["Professional level"],
          },
        ],
        publications: [
          {
            title: "Scaling JobOps",
            subtitle: "InfoQ",
            date: "2022",
            bullets: ["Published architecture write-up"],
          },
        ],
        volunteer: [
          {
            title: "STEM Mentor",
            subtitle: "Code Club",
            date: "2021 -- Present",
            bullets: ["Mentor students weekly"],
          },
        ],
        references: [
          {
            title: "Alex Manager",
            subtitle: "Director | +44 1234 567890",
            bullets: ["Reference available on request"],
          },
        ],
      },
      "__PICTURE_BLOCK__\n__NAME__\n__HEADLINE_BLOCK__\n__LOCATION_BLOCK__\n__CONTACT_BLOCK__\n__BODY__",
      tokens,
    );

    expect(typst).toContain('#image("/tmp/resume-picture.png"');
    expect(typst).toContain("London, UK");
    expect(typst).toContain("= Profiles");
    expect(typst).toContain("= Custom Fields");
    expect(typst).toContain("*Availability:* Open to relocation");
    expect(typst).toContain("= Languages");
    expect(typst).toContain("= Interests");
    expect(typst).toContain("= Awards");
    expect(typst).toContain("= Certifications");
    expect(typst).toContain("= Publications");
    expect(typst).toContain("= Volunteer");
    expect(typst).toContain("= References");
  });

  it("escapes Typst markup characters in resume content", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const typst = buildTypstDocument(
      {
        ...baseDocument,
        name: "Jane #1 [Platform]",
        summary: "Uses #hashes, *stars*, and [brackets].",
      },
      "__NAME__\n__BODY__",
      tokens,
    );

    expect(typst).toContain("Jane \\#1 \\[Platform\\]");
    expect(typst).toContain("\\#hashes, \\*stars\\*, and \\[brackets\\]");
  });

  it("keeps tildes, comment slashes and leading list markers literal", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const typst = buildTypstDocument(
      {
        ...baseDocument,
        summary: "- Starts like a list item",
        experience: [
          {
            title: "Acme",
            date: "2021年4月~現在",
            bullets: [
              "Steps 1 ~ 3 // see the wiki",
              "1. Numbered start",
              "= Heading-like start",
              "Docs at https://example.com/runbooks",
            ],
          },
        ],
      },
      "__BODY__",
      tokens,
    );

    expect(typst).toContain("2021年4月\\~現在");
    expect(typst).toContain("- Steps 1 \\~ 3 \\/\\/ see the wiki");
    expect(typst).toContain("- \\1. Numbered start");
    expect(typst).toContain("- \\= Heading-like start");
    // URL schemes stay intact so the link still autolinks.
    expect(typst).toContain("Docs at https://example.com/runbooks");
    expect(typst).toContain("\\- Starts like a list item");
  });

  it("joins Japanese lines without leaving a stray space", () => {
    const converted = convertDocFieldsToTypst({
      ...baseDocument,
      summary: "一貫して担当できます。\n【強み２】障害対応 is my\nspecialty",
    });

    expect(converted.summary).toBe(
      "一貫して担当できます。【強み２】障害対応 is my specialty",
    );
  });

  it("uses Japanese list punctuation and labels for Japanese resumes", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const typst = buildTypstDocument(
      {
        ...baseDocument,
        name: "山田 太郎",
        language: "japanese",
        skillGroups: [
          { name: "言語", keywords: ["Go（5年）", "Java"] },
          { name: "その他", keywords: [] },
        ],
        languages: [{ language: "ベトナム語", fluency: null, level: 2 }],
      },
      "__NAME__\n__BODY__",
      tokens,
    );

    expect(typst).toContain("山田 太郎");
    expect(typst).toContain("*言語:* Go（5年）、Java");
    expect(typst).toContain("*その他*");
    expect(typst).not.toContain("*その他:*");
    expect(typst).toContain("*ベトナム語:* レベル 2");
  });

  it("leaves undated entries blank and keeps entry titles with their bullets", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const typst = buildTypstDocument(
      {
        ...baseDocument,
        experience: [{ title: "Acme", bullets: ["Shipped it"] }],
        references: [{ title: "Alex Manager", bullets: [] }],
      },
      "__BODY__",
      tokens,
    );

    // "[]" used to be printed literally in the date column.
    expect(typst).not.toContain("[[]]");
    expect(typst).toContain(
      `#block(sticky: true, below: ${tokens.parLeading})[`,
    );
  });

  it("compiles HTML formatting tags into Typst macros and escapes special characters", async () => {
    const tokens = await readNativeThemeTokens("classic");
    const typst = buildTypstDocument(
      {
        ...baseDocument,
        summary:
          "<strong>Bold summary</strong> & <em>Italic summary</em> with # and * sign.",
        experience: [
          {
            title: "Acme",
            subtitle: "<b>Senior</b> Platform Engineer",
            date: "2023",
            bullets: [
              "Managed <i>critical</i> systems.",
              "Handled $50k budgets.",
            ],
          },
        ],
      },
      "__BODY__",
      tokens,
    );

    expect(typst).toContain(
      "#strong[Bold summary] & #emph[Italic summary] with \\# and \\* sign.",
    );
    expect(typst).toContain("#strong[Senior] Platform Engineer");
    expect(typst).toContain("Managed #emph[critical] systems.");
    expect(typst).toContain("Handled \\$50k budgets.");
  });

  it("converts HTML formatting tags to Typst markup formatting in convertDocFieldsToTypst", () => {
    const converted = convertDocFieldsToTypst({
      ...baseDocument,
      summary: "<strong>Bold</strong> and <em>Italic</em> and normal.",
      experience: [
        {
          title: "Acme",
          subtitle: "Platform Engineer",
          date: "2023",
          bullets: [
            "Managed <i>critical</i> systems.",
            "Handled $50k budgets.",
          ],
        },
      ],
    });

    expect(converted.summary).toBe(
      "#strong[Bold] and #emph[Italic] and normal.",
    );
    expect(converted.experience[0]?.bullets).toEqual([
      "Managed #emph[critical] systems.",
      "Handled \\$50k budgets.",
    ]);
  });

  it("fails with a helpful error when typst is unavailable", async () => {
    const previous = process.env.TYPST_BIN;
    process.env.TYPST_BIN = "/definitely/missing/typst";
    const tempDir = await createTempDir();
    tempDirs.push(tempDir);
    const outputPath = join(tempDir, "resume.pdf");

    await expect(
      renderTypstPdf({
        document: baseDocument,
        outputPath,
        jobId: "job-missing-typst",
      }),
    ).rejects.toThrow(/Typst binary not found/i);

    if (previous === undefined) {
      delete process.env.TYPST_BIN;
    } else {
      process.env.TYPST_BIN = previous;
    }
  });

  it.skipIf(!typstAvailable())(
    "renders a PDF when typst is installed",
    async () => {
      const tempDir = await createTempDir();
      tempDirs.push(tempDir);
      const outputPath = join(tempDir, "resume.pdf");

      await renderTypstPdf({
        document: baseDocument,
        outputPath,
        jobId: "job-render-success",
        typstTheme: "compact",
      });

      const stats = spawnSync("sh", ["-lc", `test -s "${outputPath}"`], {
        stdio: "ignore",
      });
      expect(stats.status).toBe(0);
    },
  );

  it.skipIf(!typstAvailable())(
    "renders the clean-print-cv theme when typst is installed",
    async () => {
      const tempDir = await createTempDir();
      tempDirs.push(tempDir);
      const outputPath = join(tempDir, "clean-print-cv.pdf");

      await renderTypstPdf({
        document: {
          ...baseDocument,
          profileItems: [
            {
              network: "LinkedIn",
              username: "janedoe",
              url: "https://linkedin.com/in/janedoe",
            },
          ],
          languages: [{ language: "English", fluency: "Native", level: 5 }],
          certifications: [
            {
              title: "AWS Solutions Architect",
              subtitle: "Amazon",
              date: "2023",
              bullets: ["Professional level"],
            },
          ],
        },
        outputPath,
        jobId: "job-render-clean-print-cv",
        typstTheme: "clean-print-cv",
      });

      const stats = spawnSync("sh", ["-lc", `test -s "${outputPath}"`], {
        stdio: "ignore",
      });
      expect(stats.status).toBe(0);
    },
  );

  it.skipIf(!typstAvailable())(
    "renders the shokumu-keirekisho theme on A4 from a Japanese resume",
    async () => {
      const tempDir = await createTempDir();
      tempDirs.push(tempDir);
      const outputPath = join(tempDir, "shokumu-keirekisho.pdf");

      await renderTypstPdf({
        document: buildResumeRenderDocument(shokumuFixture, {
          language: "japanese",
        }),
        outputPath,
        jobId: "job-render-shokumu-keirekisho",
        typstTheme: "shokumu-keirekisho",
      });

      const pageSizes = await readPdfPageSizes(outputPath);
      expect(pageSizes.length).toBeGreaterThan(0);
      for (const size of pageSizes) {
        expect(size).toEqual({ width: 595, height: 842 });
      }
    },
  );

  it.skipIf(!typstAvailable() || !typstHasJapaneseFonts())(
    "lays out the shokumu-keirekisho sections and omits hidden or empty ones",
    async () => {
      const tempDir = await createTempDir();
      tempDirs.push(tempDir);
      const fullPath = join(tempDir, "shokumu-full.pdf");
      const sparsePath = join(tempDir, "shokumu-sparse.pdf");
      const document = buildResumeRenderDocument(shokumuFixture, {
        language: "japanese",
      });

      await renderTypstPdf({
        document,
        outputPath: fullPath,
        jobId: "job-render-shokumu-full",
        typstTheme: "shokumu-keirekisho",
      });
      const full = await readCompactPdfText(fullPath);

      expect(full).toContain("職務経歴書");
      expect(full).toMatch(/\d{4}年\d{1,2}月\d{1,2}日現在/);
      expect(full).toContain("氏名ミラー健太");
      for (const heading of [
        "■職務要約",
        "■職務経歴",
        "■活かせる経験・知識・技術",
        "■資格",
        "■語学",
        "■学歴",
        "■自己PR",
      ]) {
        expect(full).toContain(heading);
      }
      expect(full).toContain("株式会社サクラペイメンツ");
      expect(full).toContain("シニアソフトウェアエンジニア／テックリード");
      expect(full).toContain("東京都渋谷区");
      expect(full).toContain("新卒・中途エンジニア4名");
      expect(full).toContain("日本語能力試験（JLPT）N1合格");
      expect(full).toContain("日英バイリンガルのエンジニアとして");
      expect(full).toContain("以上");
      expect(full).not.toContain("非表示テスト株式会社");
      expect(full).not.toContain("非表示スキル");
      expect(full.indexOf("■職務要約")).toBeLessThan(full.indexOf("■職務経歴"));
      expect(full.indexOf("■職務経歴")).toBeLessThan(full.indexOf("■自己PR"));

      await renderTypstPdf({
        document: {
          ...document,
          summary: null,
          customFieldItems: [],
          skillGroups: [],
          certifications: [],
          languages: [],
          education: [],
        },
        outputPath: sparsePath,
        jobId: "job-render-shokumu-sparse",
        typstTheme: "shokumu-keirekisho",
      });
      const sparse = await readCompactPdfText(sparsePath);

      expect(sparse).toContain("■職務経歴");
      for (const heading of [
        "■職務要約",
        "■活かせる経験・知識・技術",
        "■資格",
        "■語学",
        "■学歴",
        "■自己PR",
      ]) {
        expect(sparse).not.toContain(heading);
      }
    },
  );

  it.skipIf(!typstAvailable() || !typstHasJapaneseFonts())(
    "renders the remaining shokumu-keirekisho sections and literal markup",
    async () => {
      const tempDir = await createTempDir();
      tempDirs.push(tempDir);
      const outputPath = join(tempDir, "shokumu-extra.pdf");
      const document = buildResumeRenderDocument(shokumuFixture, {
        language: "japanese",
      });

      await renderTypstPdf({
        document: {
          ...document,
          experience: [
            {
              ...document.experience[0],
              title: "株式会社サクラペイメンツ",
              bullets: ["手順 1 ~ 3 // 社内Wiki参照", "1. 番号で始まる行"],
            },
          ],
          projects: [
            {
              title: "OSS: kube-cost-reporter",
              subtitle: "Go, Kubernetes",
              date: "2022年～",
              bullets: ["スター 1,200 超"],
            },
          ],
          awards: [
            {
              title: "社長賞",
              subtitle: "サクラ",
              date: "2023年3月",
              bullets: [],
            },
          ],
          skillGroups: [
            { name: "言語", keywords: ["Go", "Java"] },
            { name: "Kubernetes", keywords: [] },
            { name: "要件定義", keywords: [] },
          ],
          languages: [{ language: "ベトナム語", fluency: null, level: 2 }],
        },
        outputPath,
        jobId: "job-render-shokumu-extra",
        typstTheme: "shokumu-keirekisho",
      });
      const text = await readCompactPdfText(outputPath);

      // The renderer escapes once; the theme must not escape again.
      expect(text).toContain("手順1~3//社内Wiki参照");
      expect(text).toContain("1.番号で始まる行");
      expect(text).not.toContain("\\");
      expect(text).toContain("■主なプロジェクト");
      expect(text).toContain("OSS:kube-cost-reporter（Go,Kubernetes）");
      expect(text).toContain("■受賞歴");
      expect(text).toContain("社長賞（サクラ）");
      // Name-only skills share one closing row instead of empty rows.
      expect(text).toContain("その他Kubernetes、要件定義");
      expect(text).toContain("レベル2");
      // Profiles and non-自己PR custom fields land under その他.
      expect(text).toContain("■その他");
      expect(text).toContain("LinkedInkenta-miller");
      expect(text).toContain("GitHubgithub.com/kenta-miller");
    },
  );

  it.skipIf(!typstAvailable() || !typstHasJapaneseFonts())(
    "localizes clean-print-cv headings for Japanese resumes only",
    async () => {
      const tempDir = await createTempDir();
      tempDirs.push(tempDir);
      const japanesePath = join(tempDir, "clean-ja.pdf");
      const englishPath = join(tempDir, "clean-en.pdf");

      await renderTypstPdf({
        document: buildResumeRenderDocument(shokumuFixture, {
          language: "japanese",
        }),
        outputPath: japanesePath,
        jobId: "job-render-clean-ja",
        typstTheme: "clean-print-cv",
      });
      await renderTypstPdf({
        document: baseDocument,
        outputPath: englishPath,
        jobId: "job-render-clean-en",
        typstTheme: "clean-print-cv",
      });
      const japanese = await readCompactPdfText(japanesePath);
      const english = await readCompactPdfText(englishPath);

      for (const heading of ["職務要約", "職務経歴", "スキル", "学歴"]) {
        expect(japanese).toContain(heading);
      }
      expect(japanese).not.toMatch(/PROFESSIONAL|TECHNICAL|EDUCATION/);
      // No empty slot (" |  | ") for a missing GitHub profile.
      expect(japanese).not.toMatch(/\|\|/);
      expect(english).toContain("PROFESSIONALEXPERIENCE");
    },
  );

  it.skipIf(!typstAvailable())(
    "renders US Letter pages in every theme when requested",
    async () => {
      const tempDir = await createTempDir();
      tempDirs.push(tempDir);

      for (const typstTheme of TYPST_THEME_VALUES) {
        const outputPath = join(tempDir, `${typstTheme}-letter.pdf`);
        await renderTypstPdf({
          document: baseDocument,
          outputPath,
          jobId: `job-render-letter-${typstTheme}`,
          typstTheme,
          paperSize: "letter",
        });

        expect(await readPdfPageSizes(outputPath), typstTheme).toEqual([
          { width: 612, height: 792 },
        ]);
      }
    },
  );

  it.skipIf(!typstAvailable())(
    "renders A4 pages in every theme by default",
    async () => {
      const tempDir = await createTempDir();
      tempDirs.push(tempDir);

      for (const typstTheme of TYPST_THEME_VALUES) {
        const outputPath = join(tempDir, `${typstTheme}-default.pdf`);
        await renderTypstPdf({
          document: baseDocument,
          outputPath,
          jobId: `job-render-default-${typstTheme}`,
          typstTheme,
        });

        expect(await readPdfPageSizes(outputPath), typstTheme).toEqual([
          { width: 595, height: 842 },
        ]);
      }
    },
  );
});
