/**
 * Word (.docx) export of the normalized resume document, so a resume can be
 * edited in Word, Google Docs or Pages after download (Japanese recruiters
 * often ask for 職務経歴書 in Word). Two layouts mirror the Typst PDFs:
 * `shokumu` follows the 職務経歴書 theme, `resume` the classic one.
 *
 * The package is written by hand (WordprocessingML + JSZip) rather than with
 * a docx library; it only needs paragraphs, bullets, tables and links.
 */
import type { PdfPaperSize } from "@shared/types";
import JSZip from "jszip";
import { getLatexResumeSectionTitles } from "./document";
import type {
  LatexResumeDocument,
  LatexResumeEntry,
  LatexResumeOrderedSectionKey,
} from "./types";

export type DocxResumeLayout = "resume" | "shokumu";

export interface RenderResumeDocxArgs {
  document: LatexResumeDocument;
  layout?: DocxResumeLayout;
  paperSize?: PdfPaperSize;
}

export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// ---------------------------------------------------------------------------
// Units and page geometry (twips: 1/20 pt)
// ---------------------------------------------------------------------------

const TWIPS_PER_MM = 1440 / 25.4;
const mm = (value: number) => Math.round(value * TWIPS_PER_MM);
const pt = (value: number) => Math.round(value * 20);

const PAGE_SIZES = {
  a4: { width: 11906, height: 16838 },
  letter: { width: 12240, height: 15840 },
} as const;

interface PageGeometry {
  width: number;
  height: number;
  marginX: number;
  marginTop: number;
  marginBottom: number;
}

function textWidth(page: PageGeometry): number {
  return page.width - 2 * page.marginX;
}

// ---------------------------------------------------------------------------
// XML helpers
// ---------------------------------------------------------------------------

const W_NS =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';

/** Drop what XML 1.0 cannot carry (control characters, U+FFFE/U+FFFF, lone surrogates). */
function stripInvalidXmlChars(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const allowed =
      code === 0x09 ||
      code === 0x0a ||
      code === 0x0d ||
      (code >= 0x20 && code <= 0xd7ff) ||
      (code >= 0xe000 && code <= 0xfffd) ||
      code >= 0x10000;
    if (allowed) result += char;
  }
  return result;
}

function escapeXml(value: string): string {
  return stripInvalidXmlChars(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CJK_PATTERN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

function hasCjk(value: string | null | undefined): boolean {
  return Boolean(value && CJK_PATTERN.test(value));
}

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

// ---------------------------------------------------------------------------
// Runs and paragraphs
// ---------------------------------------------------------------------------

interface RunStyle {
  bold?: boolean;
  italic?: boolean;
  /** Point size. */
  size?: number;
  /** Hex colour without '#'. */
  color?: string;
  font?: "heading";
  /** Extra character spacing in points. */
  spacing?: number;
  link?: boolean;
}

interface Fonts {
  body: string;
  bodyEastAsia: string;
  heading: string;
  headingEastAsia: string;
}

class DocxContext {
  private readonly links = new Map<string, string>();

  constructor(
    readonly fonts: Fonts,
    readonly page: PageGeometry,
  ) {}

  linkRelationshipId(url: string): string {
    const existing = this.links.get(url);
    if (existing) return existing;
    const id = `rIdLink${this.links.size + 1}`;
    this.links.set(url, id);
    return id;
  }

  linkRelationships(): string {
    return [...this.links.entries()]
      .map(
        ([url, id]) =>
          `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeXml(url)}" TargetMode="External"/>`,
      )
      .join("");
  }

  run(text: string, style: RunStyle = {}): string {
    if (!text) return "";
    const props: string[] = [];
    if (style.link) props.push('<w:rStyle w:val="Hyperlink"/>');
    if (style.font === "heading") {
      props.push(
        `<w:rFonts w:ascii="${this.fonts.heading}" w:hAnsi="${this.fonts.heading}" w:eastAsia="${this.fonts.headingEastAsia}" w:cs="${this.fonts.heading}"/>`,
      );
    }
    if (style.bold) props.push("<w:b/><w:bCs/>");
    if (style.italic) props.push("<w:i/><w:iCs/>");
    if (style.color) props.push(`<w:color w:val="${style.color}"/>`);
    if (style.spacing) props.push(`<w:spacing w:val="${pt(style.spacing)}"/>`);
    if (style.size) {
      const halfPoints = Math.round(style.size * 2);
      props.push(
        `<w:sz w:val="${halfPoints}"/><w:szCs w:val="${halfPoints}"/>`,
      );
    }
    const rPr = props.length > 0 ? `<w:rPr>${props.join("")}</w:rPr>` : "";
    const body = text
      .split(/(\t|\n)/)
      .map((part) => {
        if (part === "\t") return "<w:tab/>";
        if (part === "\n") return "<w:br/>";
        return part ? `<w:t xml:space="preserve">${escapeXml(part)}</w:t>` : "";
      })
      .join("");
    return `<w:r>${rPr}${body}</w:r>`;
  }

  /**
   * Summary and bullet text keeps <strong>/<b>/<em>/<i> from the editor
   * (the normalizer strips every other tag); turn them into run formatting.
   */
  markup(text: string, base: RunStyle = {}): string {
    let bold = 0;
    let italic = 0;
    const runs: string[] = [];
    for (const part of text.split(/(<\/?(?:strong|b|em|i)\b[^>]*>)/gi)) {
      if (!part) continue;
      const tag = /^<(\/?)(strong|b|em|i)\b/i.exec(part);
      if (tag) {
        const closing = tag[1] === "/";
        const isBold = /^(strong|b)$/i.test(tag[2] ?? "");
        if (isBold) bold = Math.max(0, bold + (closing ? -1 : 1));
        else italic = Math.max(0, italic + (closing ? -1 : 1));
        continue;
      }
      runs.push(
        this.run(part, {
          ...base,
          bold: base.bold || bold > 0,
          italic: base.italic || italic > 0,
        }),
      );
    }
    return runs.join("");
  }

  /** A hyperlink around `label`, or plain runs when the URL is unusable. */
  link(label: string, url: string | null | undefined, style: RunStyle = {}) {
    const target = normalizeLinkUrl(url);
    if (!target) return this.run(label, style);
    const id = this.linkRelationshipId(target);
    return `<w:hyperlink r:id="${id}" w:history="1">${this.run(label, {
      ...style,
      link: true,
    })}</w:hyperlink>`;
  }
}

/**
 * Word refuses to open a package whose hyperlink target is not a valid URI,
 * so only well-formed http(s)/mailto/tel links become hyperlinks.
 */
function normalizeLinkUrl(url: string | null | undefined): string | null {
  const raw = clean(url);
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return null;
    }
    if (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      !parsed.hostname.includes(".")
    ) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

interface ParagraphStyle {
  style?: string;
  align?: "left" | "center" | "right" | "both";
  keepNext?: boolean;
  keepLines?: boolean;
  bullet?: boolean;
  /** Right-aligned tab stop position (twips from the text margin). */
  rightTab?: number;
  /** Space before/after in points. */
  before?: number;
  after?: number;
}

function paragraph(content: string, style: ParagraphStyle = {}): string {
  const props: string[] = [];
  if (style.style) props.push(`<w:pStyle w:val="${style.style}"/>`);
  if (style.keepNext) props.push("<w:keepNext/>");
  if (style.keepLines) props.push("<w:keepLines/>");
  if (style.bullet) {
    props.push('<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>');
  }
  if (style.rightTab !== undefined) {
    props.push(
      `<w:tabs><w:tab w:val="right" w:pos="${Math.round(style.rightTab)}"/></w:tabs>`,
    );
  }
  if (style.before !== undefined || style.after !== undefined) {
    const before =
      style.before !== undefined ? ` w:before="${pt(style.before)}"` : "";
    const after =
      style.after !== undefined ? ` w:after="${pt(style.after)}"` : "";
    props.push(`<w:spacing${before}${after}/>`);
  }
  if (style.align) props.push(`<w:jc w:val="${style.align}"/>`);
  const pPr = props.length > 0 ? `<w:pPr>${props.join("")}</w:pPr>` : "";
  return `<w:p>${pPr}${content}</w:p>`;
}

function heading(ctx: DocxContext, text: string): string {
  return paragraph(ctx.run(text), { style: "Heading1" });
}

/** Paragraph text split on blank lines / line breaks. */
function splitParagraphs(value: string): string[] {
  return value
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

interface CellSpec {
  content: string;
  width: number;
  span?: number;
  fill?: string;
}

function tableCell(cell: CellSpec): string {
  const props = [`<w:tcW w:w="${cell.width}" w:type="dxa"/>`];
  if (cell.span && cell.span > 1)
    props.push(`<w:gridSpan w:val="${cell.span}"/>`);
  if (cell.fill) {
    props.push(`<w:shd w:val="clear" w:color="auto" w:fill="${cell.fill}"/>`);
  }
  // Every cell must end with a paragraph.
  const content = cell.content.endsWith("</w:p>")
    ? cell.content
    : `${cell.content}${paragraph("")}`;
  return `<w:tc><w:tcPr>${props.join("")}</w:tcPr>${content}</w:tc>`;
}

function tableRow(
  cells: CellSpec[],
  options: { header?: boolean; cantSplit?: boolean } = {},
): string {
  const props: string[] = [];
  if (options.cantSplit) props.push("<w:cantSplit/>");
  if (options.header) props.push("<w:tblHeader/>");
  const trPr = props.length > 0 ? `<w:trPr>${props.join("")}</w:trPr>` : "";
  return `<w:tr>${trPr}${cells.map(tableCell).join("")}</w:tr>`;
}

function table(args: {
  widths: number[];
  rows: string[];
  bordered: boolean;
  cellMargins: { top: number; bottom: number; left: number; right: number };
}): string {
  const total = args.widths.reduce((sum, width) => sum + width, 0);
  const border = 'w:val="single" w:sz="4" w:space="0" w:color="6E6E6E"';
  const borders = args.bordered
    ? `<w:tblBorders><w:top ${border}/><w:left ${border}/><w:bottom ${border}/><w:right ${border}/><w:insideH ${border}/><w:insideV ${border}/></w:tblBorders>`
    : "";
  const margins = args.cellMargins;
  const tblPr = `<w:tblPr><w:tblW w:w="${total}" w:type="dxa"/>${borders}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="${margins.top}" w:type="dxa"/><w:left w:w="${margins.left}" w:type="dxa"/><w:bottom w:w="${margins.bottom}" w:type="dxa"/><w:right w:w="${margins.right}" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="0000" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr>`;
  const grid = `<w:tblGrid>${args.widths
    .map((width) => `<w:gridCol w:w="${width}"/>`)
    .join("")}</w:tblGrid>`;
  return `<w:tbl>${tblPr}${grid}${args.rows.join("")}</w:tbl>`;
}

// ---------------------------------------------------------------------------
// 職務経歴書 layout (mirrors typst-themes/shokumu-keirekisho/main.typ)
// ---------------------------------------------------------------------------

const SHOKUMU_FILL = "EDEDED";
const SHOKUMU_MUTED = "555555";

// Separators in a "start ～ end" period. Plain hyphens only count when
// spaced, so "2021-04" stays intact.
const PERIOD_SEPARATOR = /\s*[～〜~]\s*|\s*[–—]\s*|\s+-{1,3}\s+/;

/**
 * The period column is narrow, so a "start ～ end" range always breaks at
 * its separator ("2021年4月～ / 現在") instead of wrapping mid-word.
 */
function shokumuPeriodText(value: string): string {
  let text = clean(value);
  if (hasCjk(text)) text = text.replace(/\s*~\s*/g, "～");
  const found = PERIOD_SEPARATOR.exec(text);
  if (!found || found.index === 0) return text;
  const end = text.slice(found.index + found[0].length);
  if (!end) return text;
  const start = text.slice(0, found.index);
  return /[～〜~]/.test(found[0]) ? `${start}～\n${end}` : `${start}\n– ${end}`;
}

const SELF_PR_PREFIX = /^(自己\s*(PR|ＰＲ)|self[\s\-_]*pr)\s*[:：]\s*/i;

function isSelfPrTitle(value: string): boolean {
  const key = value.toLowerCase().replace(/[\s\-_・]/g, "");
  return key === "自己pr" || key === "自己ｐｒ" || key === "selfpr";
}

function renderShokumuBody(
  ctx: DocxContext,
  document: LatexResumeDocument,
): string {
  const width = textWidth(ctx.page);
  const labelWidth = mm(32);
  const gutter = pt(10);
  const name = clean(document.name);
  const summary = clean(document.summary);
  const isJapanese =
    document.language === "japanese" ||
    hasCjk(name) ||
    hasCjk(summary) ||
    document.experience.some((entry) =>
      hasCjk(
        [entry.title, entry.position, entry.subtitle, ...entry.bullets].join(
          " ",
        ),
      ),
    );
  const listSeparator = isJapanese ? "、" : ", ";
  const paren = (value: string) =>
    isJapanese ? `（${value}）` : ` (${value})`;
  const out: string[] = [];

  const bullets = (items: string[]) =>
    items.map((item) => paragraph(ctx.markup(item), { bullet: true })).join("");

  // Borderless two-column grid: period/label on the left, details right.
  const labelGrid = (rows: Array<[string, string] | [string]>) =>
    table({
      widths: [labelWidth + gutter, width - labelWidth - gutter],
      bordered: false,
      cellMargins: { top: 0, bottom: pt(4), left: 0, right: 0 },
      rows: rows.map((row) =>
        row.length === 1
          ? tableRow([{ content: row[0], width, span: 2 }], { cantSplit: true })
          : tableRow(
              [
                { content: row[0], width: labelWidth + gutter },
                { content: row[1], width: width - labelWidth - gutter },
              ],
              { cantSplit: true },
            ),
      ),
    });

  const periodCell = (date: string | null | undefined) =>
    paragraph(ctx.run(shokumuPeriodText(date ?? ""), { size: 9.5 }));

  const entryRows = (entries: LatexResumeEntry[]) =>
    entries.map((entry): [string, string] => {
      const subtitle = clean(entry.subtitle);
      const title = ctx.link(clean(entry.title), entry.url);
      const detail = subtitle
        ? `${title}${ctx.run(paren(subtitle), { size: 9, color: SHOKUMU_MUTED })}`
        : title;
      return [
        periodCell(entry.date),
        paragraph(detail) + bullets(entry.bullets),
      ];
    });

  // Title block
  out.push(
    paragraph(
      ctx.run("職務経歴書", {
        font: "heading",
        bold: true,
        size: 18,
        spacing: 8,
      }),
      { align: "center", after: 8 },
    ),
  );
  const date = document.renderDate ?? new Date().toISOString().slice(0, 10);
  const [year, month, day] = date.split("-").map((part) => Number(part));
  out.push(
    paragraph(ctx.run(`${year}年${month}月${day}日現在`), { align: "right" }),
  );
  if (name) {
    out.push(
      paragraph(`${ctx.run("氏名　")}${ctx.run(name, { size: 11 })}`, {
        align: "right",
      }),
    );
  }

  if (summary) {
    out.push(heading(ctx, "■職務要約"));
    for (const part of splitParagraphs(summary)) {
      out.push(paragraph(ctx.markup(part), { align: "both" }));
    }
  }

  if (document.experience.length > 0) {
    out.push(heading(ctx, "■職務経歴"));
    document.experience.forEach((entry, index) => {
      const role = {
        position:
          entry.position !== undefined || entry.location !== undefined
            ? clean(entry.position)
            : clean(entry.subtitle),
        location: clean(entry.location),
      };
      const headerContent = paragraph(
        ctx.link(clean(entry.title), entry.url, {
          font: "heading",
          bold: true,
          size: 10.5,
        }) +
          (role.location
            ? `${ctx.run("\t")}${ctx.run(role.location, { size: 9, color: SHOKUMU_MUTED })}`
            : ""),
        { keepNext: true, rightTab: width - pt(14) },
      );
      const details =
        (role.position
          ? paragraph(ctx.run(role.position, { bold: true }), {
              keepNext: entry.bullets.length > 0,
              after: entry.bullets.length > 0 ? 3 : 0,
            })
          : "") + bullets(entry.bullets);
      const period = clean(entry.date);
      const detailRow = period
        ? tableRow(
            [
              { content: periodCell(period), width: labelWidth },
              { content: details, width: width - labelWidth },
            ],
            { cantSplit: entry.bullets.length <= 12 },
          )
        : tableRow([{ content: details, width, span: 2 }], {
            cantSplit: entry.bullets.length <= 12,
          });
      if (index > 0) out.push(paragraph("", { after: 0 }));
      out.push(
        table({
          widths: [labelWidth, width - labelWidth],
          bordered: true,
          cellMargins: { top: pt(4), bottom: pt(4), left: pt(7), right: pt(7) },
          rows: [
            tableRow(
              [{ content: headerContent, width, span: 2, fill: SHOKUMU_FILL }],
              {
                header: true,
                cantSplit: true,
              },
            ),
            detailRow,
          ],
        }),
      );
    });
  }

  if (document.projects.length > 0) {
    out.push(heading(ctx, "■主なプロジェクト"));
    out.push(labelGrid(entryRows(document.projects)));
  }

  // Skills listed by name only gather into one closing "その他" row; an
  // empty catch-all group would only repeat the row label.
  const otherLabel = isJapanese ? "その他" : "Other";
  const keywordGroups = document.skillGroups.filter(
    (group) => group.keywords.length > 0,
  );
  const bareSkills = document.skillGroups
    .filter((group) => group.keywords.length === 0)
    .map((group) => clean(group.name))
    .filter(
      (value) =>
        value && !["その他", "other", "others"].includes(value.toLowerCase()),
    );
  if (keywordGroups.length > 0) {
    const skillLabelWidth = labelWidth + mm(10);
    const skillRow = (label: string, value: string) =>
      tableRow(
        [
          {
            content: paragraph(ctx.run(label, { bold: true })),
            width: skillLabelWidth,
            fill: SHOKUMU_FILL,
          },
          {
            content: paragraph(ctx.run(value)),
            width: width - skillLabelWidth,
          },
        ],
        { cantSplit: true },
      );
    const rows = keywordGroups.map((group) =>
      skillRow(clean(group.name), group.keywords.join(listSeparator)),
    );
    if (bareSkills.length > 0) {
      rows.push(skillRow(otherLabel, bareSkills.join(listSeparator)));
    }
    out.push(heading(ctx, "■活かせる経験・知識・技術"));
    out.push(
      table({
        widths: [skillLabelWidth, width - skillLabelWidth],
        bordered: true,
        cellMargins: { top: pt(4), bottom: pt(4), left: pt(7), right: pt(7) },
        rows,
      }),
    );
  } else if (bareSkills.length > 0) {
    out.push(heading(ctx, "■活かせる経験・知識・技術"));
    out.push(paragraph(ctx.run(bareSkills.join(listSeparator))));
  }

  if (document.certifications.length > 0) {
    out.push(heading(ctx, "■資格"));
    out.push(labelGrid(entryRows(document.certifications)));
  }

  if (document.awards.length > 0) {
    out.push(heading(ctx, "■受賞歴"));
    out.push(labelGrid(entryRows(document.awards)));
  }

  if (document.languages.length > 0) {
    out.push(heading(ctx, "■語学"));
    out.push(
      labelGrid(
        document.languages.map((item): [string, string] => {
          const fluency = clean(item.fluency);
          const level =
            !fluency && typeof item.level === "number" && item.level > 0
              ? `${isJapanese ? "レベル " : "Level "}${item.level}`
              : "";
          return [
            paragraph(ctx.run(clean(item.language), { bold: true })),
            paragraph(ctx.run(fluency || level)),
          ];
        }),
      ),
    );
  }

  if (document.education.length > 0) {
    out.push(heading(ctx, "■学歴"));
    out.push(
      labelGrid(
        document.education.map((entry): [string, string] => {
          let degree = clean(entry.subtitle);
          if (hasCjk(degree)) degree = degree.replace(/, /g, " ");
          const title = ctx.link(clean(entry.title), entry.url);
          return [
            periodCell(entry.date),
            paragraph(degree ? `${title}${ctx.run(`　${degree}`)}` : title) +
              bullets(entry.bullets),
          ];
        }),
      ),
    );
  }

  if (document.publications.length > 0) {
    out.push(heading(ctx, "■著作・発表"));
    out.push(labelGrid(entryRows(document.publications)));
  }

  if (document.volunteer.length > 0) {
    out.push(heading(ctx, "■ボランティア活動"));
    out.push(labelGrid(entryRows(document.volunteer)));
  }

  // 自己PR comes from a custom field titled 自己PR / Self PR, or an untitled
  // field written as "自己PR: ...". Other custom fields go under その他.
  let selfPr = "";
  for (const item of document.customFieldItems) {
    const title = clean(item.title);
    const body = clean(item.text);
    if (!selfPr && isSelfPrTitle(title) && body && body !== title)
      selfPr = body;
  }
  if (!selfPr) {
    for (const item of document.customFieldItems) {
      const title = clean(item.title);
      const body = clean(item.text);
      const prefix = SELF_PR_PREFIX.exec(body);
      if (!selfPr && (!title || title === body) && prefix) {
        selfPr = body.slice(prefix[0].length).trim();
      }
    }
  }
  const isSelfPrField = (title: string, body: string) =>
    isSelfPrTitle(title) ||
    ((!title || title === body) && SELF_PR_PREFIX.test(body));

  const otherRows: Array<[string, string] | [string]> = [
    ...document.profileItems.map((item): [string, string] => {
      const shown =
        clean(item.username) || clean(item.url) || clean(item.network);
      return [
        paragraph(ctx.run(clean(item.network), { bold: true })),
        paragraph(ctx.link(shown, item.url)),
      ];
    }),
    ...document.customFieldItems
      .filter((item) => !isSelfPrField(clean(item.title), clean(item.text)))
      .map((item): [string, string] | [string] => {
        const title = clean(item.title);
        const body = clean(item.text);
        const value = paragraph(ctx.link(body, item.url));
        return !title || title === body
          ? [value]
          : [paragraph(ctx.run(title, { bold: true })), value];
      }),
  ];
  if (otherRows.length > 0) {
    out.push(heading(ctx, "■その他"));
    out.push(labelGrid(otherRows));
  }

  if (selfPr) {
    out.push(heading(ctx, "■自己PR"));
    for (const part of splitParagraphs(selfPr)) {
      out.push(paragraph(ctx.run(part), { align: "both" }));
    }
  }

  out.push(paragraph(ctx.run("以上"), { align: "right", before: 14 }));
  return out.join("");
}

// ---------------------------------------------------------------------------
// Résumé layout (mirrors the classic Typst theme)
// ---------------------------------------------------------------------------

const RESUME_SECTION_ORDER: LatexResumeOrderedSectionKey[] = [
  "profiles",
  "experience",
  "education",
  "projects",
  "skills",
  "languages",
  "interests",
  "awards",
  "certifications",
  "publications",
  "volunteer",
  "references",
];

function renderResumeBody(
  ctx: DocxContext,
  document: LatexResumeDocument,
): string {
  const titles = document.sectionTitles ?? getLatexResumeSectionTitles();
  const japanese =
    document.language === "japanese" ||
    /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(
      [document.name, document.headline, document.summary].join(" "),
    );
  const listSeparator = japanese ? "、" : ", ";
  const levelLabel = japanese ? "レベル" : "Level";
  const tab = textWidth(ctx.page);
  const out: string[] = [];

  const bullets = (items: string[]) =>
    items.map((item) => paragraph(ctx.markup(item), { bullet: true })).join("");

  const labelled = (label: string, value: string) =>
    `${ctx.run(`${label}: `, { bold: true })}${value}`;

  // Header
  out.push(
    paragraph(ctx.run(clean(document.name), { bold: true, size: 20 }), {
      style: "Title",
    }),
  );
  if (clean(document.headline)) {
    out.push(
      paragraph(ctx.run(clean(document.headline), { size: 9.5 }), {
        align: "center",
      }),
    );
  }
  if (clean(document.location)) {
    out.push(
      paragraph(ctx.run(clean(document.location), { size: 9 }), {
        align: "center",
      }),
    );
  }
  if (document.contactItems.length > 0) {
    const contact = document.contactItems
      .map((item) => ctx.link(item.text, item.url, { size: 8.8 }))
      .join(ctx.run("  |  ", { size: 8.8 }));
    out.push(paragraph(contact, { align: "center" }));
  }

  const entry = (item: LatexResumeEntry, kind: "subheading" | "project") => {
    const date = clean(item.date);
    const title = ctx.link(clean(item.title), item.url, { bold: true });
    const projectSubtitle =
      kind === "project" && clean(item.subtitle)
        ? ctx.run(` ${clean(item.subtitle)}`, { italic: true })
        : "";
    const head = paragraph(
      `${title}${projectSubtitle}${date ? `${ctx.run("\t")}${ctx.run(date, { size: 9 })}` : ""}`,
      { keepNext: true, rightTab: tab, before: 3 },
    );
    const subline =
      kind === "subheading"
        ? [
            clean(item.subtitle) || clean(item.secondaryTitle),
            clean(item.secondarySubtitle),
          ]
            .filter(Boolean)
            .join(" / ")
        : "";
    const sub = subline
      ? paragraph(ctx.run(subline, { italic: true }), {
          keepNext: item.bullets.length > 0,
        })
      : "";
    return head + sub + bullets(item.bullets);
  };

  const entrySection = (
    title: string,
    items: LatexResumeEntry[],
    kind: "subheading" | "project",
  ) =>
    items.length === 0
      ? ""
      : heading(ctx, title) + items.map((item) => entry(item, kind)).join("");

  const lineSection = (title: string, lines: string[]) =>
    lines.length === 0
      ? ""
      : heading(ctx, title) +
        lines.map((line) => paragraph(line, { bullet: true })).join("");

  if (clean(document.summary)) {
    out.push(heading(ctx, titles.summary));
    for (const part of splitParagraphs(clean(document.summary))) {
      out.push(paragraph(ctx.markup(part)));
    }
  }

  out.push(
    lineSection(
      titles.customFields,
      document.customFieldItems.map((item) => {
        const value = ctx.link(item.text, item.url);
        if (!item.title) return value;
        if (item.title === item.text)
          return ctx.run(item.title, { bold: true });
        return labelled(item.title, value);
      }),
    ),
  );

  const builders: Record<LatexResumeOrderedSectionKey, () => string> = {
    profiles: () =>
      lineSection(
        titles.profiles,
        document.profileItems.map((item) =>
          labelled(
            item.network,
            ctx.link(item.username || item.url || item.network, item.url),
          ),
        ),
      ),
    experience: () =>
      entrySection(titles.experience, document.experience, "subheading"),
    education: () =>
      entrySection(titles.education, document.education, "subheading"),
    projects: () => entrySection(titles.projects, document.projects, "project"),
    skills: () =>
      document.skillGroups.length === 0
        ? ""
        : heading(ctx, titles.skills) +
          document.skillGroups
            .map((group) =>
              paragraph(
                group.keywords.length > 0
                  ? labelled(
                      group.name,
                      ctx.run(group.keywords.join(listSeparator)),
                    )
                  : ctx.run(group.name, { bold: true }),
              ),
            )
            .join(""),
    languages: () =>
      lineSection(
        titles.languages,
        document.languages.map((item) => {
          const detail = [
            item.fluency,
            item.level ? `${levelLabel} ${item.level}` : "",
          ]
            .filter(Boolean)
            .join(" | ");
          return detail
            ? labelled(item.language, ctx.run(detail))
            : ctx.run(item.language, { bold: true });
        }),
      ),
    interests: () =>
      lineSection(
        titles.interests,
        document.interests.map((item) =>
          item.keywords.length > 0
            ? labelled(item.name, ctx.run(item.keywords.join(listSeparator)))
            : ctx.run(item.name, { bold: true }),
        ),
      ),
    awards: () => entrySection(titles.awards, document.awards, "subheading"),
    certifications: () =>
      entrySection(
        titles.certifications,
        document.certifications,
        "subheading",
      ),
    publications: () =>
      entrySection(titles.publications, document.publications, "subheading"),
    volunteer: () =>
      entrySection(titles.volunteer, document.volunteer, "subheading"),
    references: () =>
      entrySection(titles.references, document.references, "subheading"),
  };

  for (const key of document.sectionOrder ?? RESUME_SECTION_ORDER) {
    out.push(builders[key]());
  }

  return out.filter(Boolean).join("");
}

// ---------------------------------------------------------------------------
// Package parts
// ---------------------------------------------------------------------------

function stylesXml(args: {
  fonts: Fonts;
  layout: DocxResumeLayout;
  japanese: boolean;
}): string {
  const { fonts, layout } = args;
  const lang = args.japanese
    ? '<w:lang w:val="ja-JP" w:eastAsia="ja-JP" w:bidi="ar-SA"/>'
    : '<w:lang w:val="en-US" w:eastAsia="ja-JP" w:bidi="ar-SA"/>';
  // Yu Mincho/Gothic already carry tall line gaps at single spacing, which
  // matches the 職務経歴書 PDF's leading.
  const lineSpacing = layout === "shokumu" ? 240 : 252;
  const linkColor = layout === "shokumu" ? "" : '<w:color w:val="0645AD"/>';
  const headingFonts = `<w:rFonts w:ascii="${fonts.heading}" w:hAnsi="${fonts.heading}" w:eastAsia="${fonts.headingEastAsia}" w:cs="${fonts.heading}"/>`;
  const heading1 =
    layout === "shokumu"
      ? `<w:pPr><w:keepNext/><w:keepLines/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="1E1E1E"/></w:pBdr><w:spacing w:before="${pt(16)}" w:after="${pt(7)}"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr>${headingFonts}<w:b/><w:bCs/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>`
      : `<w:pPr><w:keepNext/><w:keepLines/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="202020"/></w:pBdr><w:spacing w:before="${pt(10)}" w:after="${pt(4)}"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr>${headingFonts}<w:b/><w:bCs/><w:color w:val="202020"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles ${W_NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${fonts.body}" w:hAnsi="${fonts.body}" w:eastAsia="${fonts.bodyEastAsia}" w:cs="${fonts.body}"/><w:color w:val="0F0F0F"/><w:sz w:val="20"/><w:szCs w:val="20"/>${lang}</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="${lineSpacing}" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>${heading1}</w:style><w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:qFormat/></w:style><w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/></w:style><w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="DefaultParagraphFont"/>${linkColor ? `<w:rPr>${linkColor}</w:rPr>` : ""}</w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;
}

function numberingXml(japanese: boolean): string {
  // Japanese content takes 「・」 flush with the text, English a round bullet.
  const marker = japanese ? "・" : "•";
  const indent = japanese
    ? '<w:ind w:left="200" w:hanging="200"/>'
    : '<w:ind w:left="300" w:hanging="200"/>';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering ${W_NS}><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="${marker}"/><w:lvlJc w:val="left"/><w:pPr>${indent}</w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
}

function settingsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings ${W_NS}><w:defaultTabStop w:val="720"/><w:characterSpacingControl w:val="compressPunctuation"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat><w:themeFontLang w:val="en-US" w:eastAsia="ja-JP"/></w:settings>`;
}

function footerXml(): string {
  const field = (instr: string) =>
    `<w:fldSimple w:instr=" ${instr} "><w:r><w:rPr><w:color w:val="555555"/><w:sz w:val="17"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr ${W_NS}><w:p><w:pPr><w:jc w:val="center"/></w:pPr>${field("PAGE")}<w:r><w:rPr><w:color w:val="555555"/><w:sz w:val="17"/></w:rPr><w:t xml:space="preserve"> / </w:t></w:r>${field("NUMPAGES")}</w:p></w:ftr>`;
}

function coreXml(title: string, author: string): string {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escapeXml(title)}</dc:title><dc:creator>${escapeXml(author)}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
}

const APP_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>JobOps</Application></Properties>`;

function contentTypesXml(withFooter: boolean): string {
  const footer = withFooter
    ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
    : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>${footer}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
}

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;

function documentRelsXml(ctx: DocxContext, withFooter: boolean): string {
  const base =
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const footer = withFooter
    ? `<Relationship Id="rIdFooter1" Type="${base}/footer" Target="footer1.xml"/>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="${base}/styles" Target="styles.xml"/><Relationship Id="rIdSettings" Type="${base}/settings" Target="settings.xml"/><Relationship Id="rIdNumbering" Type="${base}/numbering" Target="numbering.xml"/>${footer}${ctx.linkRelationships()}</Relationships>`;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function resolvePage(
  layout: DocxResumeLayout,
  paperSize: PdfPaperSize,
): PageGeometry {
  // "auto" follows the Typst renderer, which defaults to A4.
  const size = paperSize === "letter" ? PAGE_SIZES.letter : PAGE_SIZES.a4;
  return layout === "shokumu"
    ? { ...size, marginX: mm(20), marginTop: mm(18), marginBottom: mm(20) }
    : { ...size, marginX: 936, marginTop: 835, marginBottom: 835 };
}

function isJapaneseDocument(document: LatexResumeDocument): boolean {
  return (
    document.language === "japanese" ||
    /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(
      [document.name, document.headline, document.summary].join(" "),
    )
  );
}

/**
 * Build the resume as a .docx package. Fonts are ones Word ships on Windows
 * and macOS (Yu Mincho / Yu Gothic for Japanese); other editors substitute.
 */
export async function renderResumeDocx(
  args: RenderResumeDocxArgs,
): Promise<Buffer> {
  const layout = args.layout ?? "resume";
  const page = resolvePage(layout, args.paperSize ?? "auto");
  const japanese = layout === "shokumu" || isJapaneseDocument(args.document);
  const fonts: Fonts =
    layout === "shokumu"
      ? {
          body: "Yu Mincho",
          bodyEastAsia: "Yu Mincho",
          heading: "Yu Gothic",
          headingEastAsia: "Yu Gothic",
        }
      : {
          body: "Cambria",
          bodyEastAsia: "Yu Mincho",
          heading: "Cambria",
          headingEastAsia: "Yu Gothic",
        };
  const ctx = new DocxContext(fonts, page);
  const withFooter = layout === "shokumu";
  const body =
    layout === "shokumu"
      ? renderShokumuBody(ctx, args.document)
      : renderResumeBody(ctx, args.document);
  const footerRef = withFooter
    ? '<w:footerReference w:type="default" r:id="rIdFooter1"/>'
    : "";
  const sectPr = `<w:sectPr>${footerRef}<w:pgSz w:w="${page.width}" w:h="${page.height}"/><w:pgMar w:top="${page.marginTop}" w:right="${page.marginX}" w:bottom="${page.marginBottom}" w:left="${page.marginX}" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>`;
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${W_NS}><w:body>${body}${sectPr}</w:body></w:document>`;

  const name = clean(args.document.name);
  const title =
    layout === "shokumu"
      ? name
        ? `職務経歴書 ${name}`
        : "職務経歴書"
      : name || "Resume";

  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypesXml(withFooter));
  zip.file("_rels/.rels", ROOT_RELS);
  zip.file("docProps/core.xml", coreXml(title, name));
  zip.file("docProps/app.xml", APP_XML);
  zip.file("word/document.xml", documentXml);
  zip.file("word/styles.xml", stylesXml({ fonts, layout, japanese }));
  zip.file("word/settings.xml", settingsXml());
  zip.file("word/numbering.xml", numberingXml(japanese));
  if (withFooter) zip.file("word/footer1.xml", footerXml());
  zip.file("word/_rels/document.xml.rels", documentRelsXml(ctx, withFooter));

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    mimeType: DOCX_MIME_TYPE,
  });
}
