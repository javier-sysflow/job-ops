import { JSDOM } from "jsdom";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildResumeRenderDocument } from "./document";
import { furiganaOf, renderResumeDocx } from "./docx";
import shokumuFixture from "./fixtures/shokumu-keirekisho-ja.json";
import type { LatexResumeDocument } from "./types";

const { DOMParser } = new JSDOM().window;

function parseXml(xml: string): Document {
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  const error = parsed.getElementsByTagName("parsererror")[0];
  if (error) throw new Error(`Malformed XML: ${error.textContent}`);
  return parsed;
}

async function unpack(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const read = async (name: string) => {
    const file = zip.file(name);
    if (!file) throw new Error(`Missing part ${name}`);
    return file.async("string");
  };
  const documentXml = await read("word/document.xml");
  // Every XML part must be well-formed, or Word refuses the file.
  for (const name of Object.keys(zip.files)) {
    if (name.endsWith(".xml") || name.endsWith(".rels")) {
      parseXml(await read(name));
    }
  }
  const text = [...parseXml(documentXml).getElementsByTagName("w:t")]
    .map((node) => node.textContent ?? "")
    .join("");
  return { zip, read, documentXml, text };
}

function englishDocument(
  overrides: Partial<LatexResumeDocument> = {},
): LatexResumeDocument {
  return {
    name: "Aiko Tanaka",
    headline: "Customer Success Manager",
    location: "Tokyo",
    contactItems: [
      { text: "aiko@example.com", url: "mailto:aiko@example.com" },
      { text: "javascript link", url: "javascript:alert(1)" },
    ],
    profileItems: [],
    customFieldItems: [],
    summary: "Led <strong>enterprise</strong> accounts & cut churn <5%.",
    experience: [
      {
        title: "Acme K.K.",
        subtitle: "Manager / Tokyo",
        position: "Manager",
        location: "Tokyo",
        date: "2021 – Present",
        bullets: ["Grew <em>renewals</em> 20%", "Bad\u0001char kept clean"],
        url: "acme.example.com",
      },
    ],
    education: [],
    projects: [],
    skillGroups: [{ name: "Tools", keywords: ["Salesforce", "Zendesk"] }],
    languages: [],
    interests: [],
    awards: [],
    certifications: [],
    publications: [],
    volunteer: [],
    references: [],
    language: "english",
    renderDate: "2026-11-18",
    ...overrides,
  };
}

describe("renderResumeDocx", () => {
  it("writes a well-formed Word package for the résumé layout", async () => {
    const { zip, read, documentXml, text } = await unpack(
      await renderResumeDocx({
        document: englishDocument(),
        layout: "resume",
        paperSize: "letter",
      }),
    );

    expect(Object.keys(zip.files)).toEqual(
      expect.arrayContaining([
        "[Content_Types].xml",
        "_rels/.rels",
        "word/document.xml",
        "word/styles.xml",
        "word/numbering.xml",
        "word/_rels/document.xml.rels",
      ]),
    );
    expect(text).toContain("Aiko Tanaka");
    expect(text).toContain("Led enterprise accounts & cut churn <5%.");
    expect(text).toContain("Badchar kept clean");
    expect(text).toContain("Tools: Salesforce, Zendesk");
    // Inline <strong>/<em> become run formatting, not literal tags.
    expect(documentXml).toContain(
      '<w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">enterprise</w:t>',
    );
    expect(documentXml).toContain(
      '<w:rPr><w:i/><w:iCs/></w:rPr><w:t xml:space="preserve">renewals</w:t>',
    );
    // Real Word bullets, so pressing Enter in Word continues the list.
    expect(documentXml).toContain('<w:numId w:val="1"/>');
    // US Letter page.
    expect(documentXml).toContain('<w:pgSz w:w="12240" w:h="15840"/>');

    const rels = await read("word/_rels/document.xml.rels");
    expect(rels).toContain('Target="mailto:aiko@example.com"');
    expect(rels).toContain('Target="https://acme.example.com/"');
    expect(rels).not.toContain("javascript:");
    expect(text).toContain("javascript link");
  });

  it("lays out the 職務経歴書 with tables, Japanese headings and A4", async () => {
    const document = {
      ...buildResumeRenderDocument(shokumuFixture, { language: "japanese" }),
      renderDate: "2026-11-18",
    };
    const { zip, read, documentXml, text } = await unpack(
      await renderResumeDocx({
        document,
        layout: "shokumu",
        paperSize: "auto",
      }),
    );

    expect(text).toContain("職務経歴書");
    expect(text).toContain("2026年11月18日現在");
    expect(text).toContain("ミラー 健太");
    for (const heading of [
      "■職務要約",
      "■職務経歴",
      "■活かせる経験・知識・技術",
      "■資格",
      "■学歴",
      "■自己PR",
    ]) {
      expect(text).toContain(heading);
    }
    expect(text).toContain("株式会社サクラペイメンツ");
    // The period column breaks at the range separator.
    expect(documentXml).toMatch(/2021年4月～<\/w:t><w:br\/><w:t[^>]*>現在/);
    // 自己PR is its own section, not repeated under その他.
    expect(text.match(/日英バイリンガルのエンジニアとして/g)).toHaveLength(1);
    expect(text.endsWith("以上")).toBe(true);
    expect(documentXml).toContain("<w:tbl>");
    expect(documentXml).toContain("<w:tblHeader/>");
    expect(documentXml).toContain('<w:pgSz w:w="11906" w:h="16838"/>');
    expect(Object.keys(zip.files)).toContain("word/footer1.xml");
    expect(await read("word/numbering.xml")).toContain('w:val="・"');
    expect(await read("docProps/core.xml")).toContain(
      "<dc:title>職務経歴書 ミラー 健太</dc:title>",
    );
  });

  it("puts ふりがな above the name in the 職務経歴書, not under その他", async () => {
    const base = buildResumeRenderDocument(shokumuFixture, {
      language: "japanese",
    });
    const { text } = await unpack(
      await renderResumeDocx({
        document: {
          ...base,
          customFieldItems: [
            { title: null, text: "ふりがな：みらー けんた", url: null },
            ...base.customFieldItems,
          ],
        },
        layout: "shokumu",
      }),
    );

    expect(text.match(/みらー けんた/g)).toHaveLength(1);
    expect(text.indexOf("ふりがな　みらー けんた")).toBeGreaterThan(-1);
    expect(text.indexOf("ふりがな　みらー けんた")).toBeLessThan(
      text.indexOf("氏名"),
    );
  });

  it("joins English skill groups with commas and leaves 履歴書-only fields out", async () => {
    const base = buildResumeRenderDocument(shokumuFixture, {
      language: "japanese",
    });
    const { text } = await unpack(
      await renderResumeDocx({
        document: {
          ...base,
          skillGroups: [
            { name: "営業", keywords: ["法人営業", "提案営業"] },
            {
              name: "Sales",
              keywords: ["Business Development", "Account Management"],
            },
          ],
          customFieldItems: [
            ...base.customFieldItems,
            { title: null, text: "生年月日：1998年10月22日生", url: null },
            { title: null, text: "連絡先：同上", url: null },
            { title: "性別", text: "女", url: null },
            { title: null, text: "趣味：登山", url: null },
          ],
        },
        layout: "shokumu",
      }),
    );

    expect(text).toContain("法人営業、提案営業");
    expect(text).toContain("Business Development, Account Management");
    expect(text).not.toContain("生年月日");
    expect(text).not.toContain("同上");
    expect(text).not.toContain("性別");
    expect(text).toContain("趣味：登山");
  });

  it("reads ふりがな from a titled or untitled custom field", () => {
    expect(furiganaOf({ title: null, text: "ふりがな：きくちはら りほ" })).toBe(
      "きくちはら りほ",
    );
    expect(furiganaOf({ title: "フリガナ", text: "キクチハラ リホ" })).toBe(
      "キクチハラ リホ",
    );
    expect(furiganaOf({ title: "Furigana", text: "kikuchihara riho" })).toBe(
      "kikuchihara riho",
    );
    expect(furiganaOf({ title: null, text: "生年月日：1998年" })).toBe("");
    expect(furiganaOf({ title: "趣味", text: "ふりがな：x" })).toBe("");
  });

  it("leaves out empty 職務経歴書 sections", async () => {
    const { text } = await unpack(
      await renderResumeDocx({
        document: englishDocument({
          summary: null,
          skillGroups: [],
          name: "山田 花子",
        }),
        layout: "shokumu",
      }),
    );

    expect(text).not.toContain("■職務要約");
    expect(text).not.toContain("■活かせる経験・知識・技術");
    expect(text).not.toContain("■資格");
    expect(text).toContain("■職務経歴");
  });
});
