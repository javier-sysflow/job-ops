/**
 * Fork: 履歴書 (rirekisho), the standard Japanese CV form (厚生労働省 2021 様式).
 *
 * The form is filled from the same résumé the 職務経歴書 uses, plus a few form
 * fields kept in the per-user `rirekishoProfile` setting. A field that was
 * never saved falls back to where a 履歴書 import put it: ふりがな and 生年月日
 * custom fields, the 志望動機 summary, and 本人希望記入欄 in the résumé notes.
 * A field saved as "" stays blank on purpose.
 */
import { z } from "zod";

const text = (max: number) => z.string().max(max).optional();

export const rirekishoProfileSchema = z.object({
  furigana: text(100),
  /** ISO date, YYYY-MM-DD. */
  birthDate: text(20),
  /** Optional on the 2021 form: blank means "not stated". */
  gender: text(20),
  postalCode: text(20),
  address: text(300),
  addressFurigana: text(300),
  contactPostalCode: text(20),
  contactAddress: text(300),
  contactAddressFurigana: text(300),
  contactPhone: text(50),
  contactEmail: text(200),
  /** The base 志望動機. Jobs get their own, written for that company. */
  motivation: text(3000),
  wishes: text(1500),
});

export type RirekishoProfile = z.infer<typeof rirekishoProfileSchema>;
export type RirekishoProfileField = keyof RirekishoProfile;
export type ResolvedRirekishoProfile = Required<{
  [K in RirekishoProfileField]: string;
}>;

export const RIREKISHO_PROFILE_FIELDS = Object.keys(
  rirekishoProfileSchema.shape,
) as RirekishoProfileField[];

export const DEFAULT_RIREKISHO_WISHES = "貴社の規定に従います。";

export function parseRirekishoProfile(
  raw: string | null | undefined,
): RirekishoProfile | null {
  if (!raw) return null;
  try {
    const parsed = rirekishoProfileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function serializeRirekishoProfile(
  value: RirekishoProfile | null | undefined,
): string | null {
  return value ? JSON.stringify(value) : null;
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

type RecordLike = Record<string, unknown>;

function asRecord(value: unknown): RecordLike {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  );
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** One entry per list item or paragraph, without bullets or tags. */
export function htmlToLines(html: string): string[] {
  if (!html) return [];
  return decodeEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/\s*(li|p|div|h[1-6])\s*>/gi, "\n")
      .replace(/<[^>]*>/g, ""),
  )
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^[\s・•●◦▪-]+/u, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

function visibleItems(resumeJson: unknown, section: string): RecordLike[] {
  const sectionRecord = asRecord(
    asRecord(asRecord(resumeJson).sections)[section],
  );
  if (sectionRecord.hidden === true) return [];
  return asArray(sectionRecord.items)
    .map(asRecord)
    .filter((item) => item.hidden !== true);
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export interface YearMonth {
  year: number;
  month: number | null;
}

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const ERA_START: Record<string, number> = {
  令和: 2018,
  平成: 1988,
  昭和: 1925,
};
const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const DATE_SOURCE = [
  "(令和|平成|昭和)\\s*(元|\\d{1,2})\\s*年(?:\\s*(\\d{1,2})\\s*月)?",
  "(\\d{4})\\s*年(?:\\s*(\\d{1,2})\\s*月)?",
  "(\\d{4})\\s*[/.\\-]\\s*(\\d{1,2})(?!\\d)",
  "(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?\\s*,?\\s*(\\d{4})",
  "(\\d{1,2})\\s*/\\s*(\\d{4})",
  "(?<!\\d)(\\d{4})(?!\\d)",
].join("|");

function toYearMonth(match: RegExpExecArray): YearMonth | null {
  let year: number;
  let month: number | null = null;
  if (match[1]) {
    const eraYear = match[2] === "元" ? 1 : Number(match[2]);
    year = ERA_START[match[1]] + eraYear;
    month = match[3] ? Number(match[3]) : null;
  } else if (match[4]) {
    year = Number(match[4]);
    month = match[5] ? Number(match[5]) : null;
  } else if (match[6]) {
    year = Number(match[6]);
    month = Number(match[7]);
  } else if (match[8]) {
    year = Number(match[9]);
    month = MONTHS.indexOf(match[8].toLowerCase().slice(0, 3)) + 1;
  } else if (match[10]) {
    year = Number(match[11]);
    month = Number(match[10]);
  } else {
    year = Number(match[12]);
  }
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return null;
  if (month !== null && (month < 1 || month > 12)) month = null;
  return { year, month };
}

/** Every year/month in the text, in order (2021年4月, 2021/04, Apr 2021, 令和3年4月...). */
export function findYearMonths(value: string): YearMonth[] {
  const pattern = new RegExp(DATE_SOURCE, "gi");
  const found: YearMonth[] = [];
  const normalized = toHalfWidthDigits(value);
  for (
    let match = pattern.exec(normalized);
    match;
    match = pattern.exec(normalized)
  ) {
    const parsed = toYearMonth(match);
    if (parsed) found.push(parsed);
  }
  return found;
}

const ONGOING_PATTERN =
  /現在|在職中|在学中|present|current|now|ongoing|to date|today/i;
const EXPECTED_PATTERN = /予定|見込/;

export interface ParsedPeriod {
  start: YearMonth | null;
  end: YearMonth | null;
  /** Only one date was given. */
  single: boolean;
  /** No end date, and the text says it is still going (現在, Present). */
  ongoing: boolean;
  /** The text marks the end as planned (退職予定, 修了予定, 見込み). */
  expected: boolean;
}

export function parsePeriod(value: string): ParsedPeriod {
  const dates = findYearMonths(value ?? "");
  const end = dates[1] ?? null;
  return {
    start: dates[0] ?? null,
    end,
    single: dates.length === 1,
    ongoing: !end && ONGOING_PATTERN.test(value ?? ""),
    expected: EXPECTED_PATTERN.test(value ?? ""),
  };
}

function monthKey(value: YearMonth): number {
  return value.year * 12 + (value.month ?? 1);
}

function isAfter(value: YearMonth, today: CalendarDate): boolean {
  return monthKey(value) > today.year * 12 + today.month;
}

/** 1998年10月22日 / 1998-10-22 / 平成10年10月22日 → 1998-10-22. */
export function parseBirthDate(value: string): string {
  const normalized = toHalfWidthDigits(value ?? "");
  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;
  const japanese = /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/.exec(
    normalized,
  );
  const era =
    /(令和|平成|昭和)\s*(元|\d{1,2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/.exec(
      normalized,
    );
  const numeric = /(\d{4})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{1,2})/.exec(
    normalized,
  );
  if (japanese) {
    [year, month, day] = [
      Number(japanese[1]),
      Number(japanese[2]),
      Number(japanese[3]),
    ];
  } else if (era) {
    year = ERA_START[era[1]] + (era[2] === "元" ? 1 : Number(era[2]));
    [month, day] = [Number(era[3]), Number(era[4])];
  } else if (numeric) {
    [year, month, day] = [
      Number(numeric[1]),
      Number(numeric[2]),
      Number(numeric[3]),
    ];
  }
  if (!year || !month || !day || month > 12 || day > 31) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseIsoDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value?.trim() ?? "");
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function ageOn(birth: CalendarDate, today: CalendarDate): number {
  const hadBirthday =
    today.month > birth.month ||
    (today.month === birth.month && today.day >= birth.day);
  return today.year - birth.year - (hadBirthday ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Profile fallbacks from a 履歴書 import
// ---------------------------------------------------------------------------

const LABELS: Array<[RirekishoProfileField | "contact", RegExp]> = [
  ["furigana", /^(ふりがな|フリガナ|furigana)$/i],
  ["birthDate", /^(生年月日|誕生日|date of birth|birth ?date|dob)$/i],
  ["gender", /^(性別|gender)$/i],
  ["contact", /^(連絡先)$/],
];

/** The labelled value of a custom field: a title, or "ラベル：値" in the text. */
function labelledCustomFields(resumeJson: unknown): Map<string, string> {
  const values = new Map<string, string>();
  for (const raw of asArray(
    asRecord(asRecord(resumeJson).basics).customFields,
  )) {
    const item = asRecord(raw);
    const title = str(item.title) || str(item.name);
    const body = str(item.text) || str(item.value);
    for (const [key, label] of LABELS) {
      if (values.has(key)) continue;
      if (title && label.test(title) && body && body !== title) {
        values.set(key, body);
        continue;
      }
      const prefixed = /^([^:：]{1,20})\s*[:：]\s*(.+)$/s.exec(body);
      if (
        (!title || title === body) &&
        prefixed &&
        label.test(prefixed[1].trim())
      ) {
        values.set(key, prefixed[2].trim());
      }
    }
  }
  return values;
}

/** The reading of the name from a ふりがな custom field, or "". */
export function furiganaFromCustomField(item: {
  title?: string | null;
  text?: string | null;
}): string {
  return (
    labelledCustomFields({
      basics: {
        customFields: [{ title: item.title ?? "", text: item.text ?? "" }],
      },
    }).get("furigana") ?? ""
  );
}

const POSTAL_PATTERN = /〒\s*([0-9０-９]{3}[-－ー]?[0-9０-９]{3,4})/;

function splitPostalCode(value: string): {
  postalCode: string;
  address: string;
} {
  const match = POSTAL_PATTERN.exec(value);
  if (!match) return { postalCode: "", address: value.trim() };
  const address = (
    value.slice(0, match.index) + value.slice(match.index + match[0].length)
  )
    .replace(/^[\s,、，]+|[\s,、，]+$/g, "")
    .replace(/\s{2,}/g, " ");
  return {
    postalCode: toHalfWidthDigits(match[1]).replace(/[－ー]/, "-"),
    address,
  };
}

const MOTIVATION_TITLE = /志望|動機|アピール|自己\s*(PR|ＰＲ)|特技/i;
const WISHES_PREFIX = /^\s*本人希望(記入)?欄?\s*[:：]\s*/;

export function deriveRirekishoDefaults(
  resumeJson: unknown,
): ResolvedRirekishoProfile {
  const resume = asRecord(resumeJson);
  const basics = asRecord(resume.basics);
  const summary = asRecord(resume.summary);
  const labelled = labelledCustomFields(resumeJson);
  const { postalCode, address } = splitPostalCode(str(basics.location));
  const contact = splitPostalCode(labelled.get("contact") ?? "");
  const summaryText = htmlToLines(str(summary.content)).join("\n");

  return {
    furigana: labelled.get("furigana") ?? "",
    birthDate: parseBirthDate(labelled.get("birthDate") ?? ""),
    gender: labelled.get("gender") ?? "",
    postalCode,
    address,
    addressFurigana: "",
    contactPostalCode: contact.postalCode,
    contactAddress: contact.address,
    contactAddressFurigana: "",
    contactPhone: "",
    contactEmail: "",
    motivation:
      summaryText && MOTIVATION_TITLE.test(str(summary.title))
        ? summaryText
        : "",
    wishes: str(asRecord(resume.metadata).notes).replace(WISHES_PREFIX, ""),
  };
}

export function resolveRirekishoProfile(
  stored: RirekishoProfile | null | undefined,
  resumeJson: unknown,
): ResolvedRirekishoProfile {
  const defaults = deriveRirekishoDefaults(resumeJson);
  const resolved = { ...defaults };
  for (const field of RIREKISHO_PROFILE_FIELDS) {
    const value = stored?.[field];
    if (value !== undefined) resolved[field] = value;
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// 学歴・職歴 and 免許・資格 rows
// ---------------------------------------------------------------------------

export interface RirekishoRow {
  year: string;
  month: string;
  text: string;
  align: "left" | "center" | "right";
}

function row(date: YearMonth | null, value: string): RirekishoRow {
  return {
    year: date ? String(date.year) : "",
    month: date?.month ? String(date.month) : "",
    text: value,
    align: "left",
  };
}

function sortByDate<T>(items: T[], dateOf: (item: T) => YearMonth | null): T[] {
  return items
    .map((item, index) => ({ item, index, date: dateOf(item) }))
    .sort((left, right) => {
      if (left.date && right.date) {
        return (
          monthKey(left.date) - monthKey(right.date) || left.index - right.index
        );
      }
      if (left.date) return -1;
      if (right.date) return 1;
      return left.index - right.index;
    })
    .map(({ item }) => item);
}

const GRADUATE_PATTERN = /修士|博士|大学院|研究科|master|mba|ph\.?\s?d|doctor/i;

function educationRows(
  resumeJson: unknown,
  today: CalendarDate,
): RirekishoRow[] {
  const entries = visibleItems(resumeJson, "education").map((item) => ({
    name: [str(item.school), str(item.degree), str(item.area)]
      .filter(Boolean)
      .join(" "),
    period: parsePeriod(str(item.period) || str(item.date)),
  }));
  const rows: RirekishoRow[] = [];
  for (const { name, period } of sortByDate(
    entries.filter((entry) => entry.name),
    (entry) => entry.period.start,
  )) {
    const finish = GRADUATE_PATTERN.test(name) ? "修了" : "卒業";
    const finishWord = (date: YearMonth) =>
      period.expected || isAfter(date, today) ? `${finish}見込み` : finish;
    if (period.start && period.single && !period.ongoing) {
      rows.push(row(period.start, `${name} ${finishWord(period.start)}`));
      continue;
    }
    if (period.start) rows.push(row(period.start, `${name} 入学`));
    if (period.end) {
      rows.push(row(period.end, `${name} ${finishWord(period.end)}`));
    } else if (period.start) {
      rows.push(row(null, "在学中"));
    } else {
      rows.push(row(null, name));
    }
  }
  return rows;
}

const LEADING_DATE =
  /^((?:令和|平成|昭和)\s*(?:元|\d{1,2})\s*年\s*\d{1,2}\s*月|\d{4}\s*年\s*\d{1,2}\s*月|\d{4}\s*[/.]\s*\d{1,2}(?!\d))\s*[:：]?\s*(.*)$/;

function workRows(resumeJson: unknown, today: CalendarDate): RirekishoRow[] {
  const entries = visibleItems(resumeJson, "experience").map((item) => ({
    company: str(item.company),
    position: str(item.position),
    period: parsePeriod(str(item.period) || str(item.date)),
    lines: htmlToLines(str(item.description)),
    roles: asArray(item.roles)
      .map(asRecord)
      .map((role) => ({
        position: str(role.position),
        period: parsePeriod(str(role.period)),
      }))
      .filter((role) => role.position),
  }));
  const sorted = sortByDate(
    entries.filter((entry) => entry.company || entry.lines.length > 0),
    (entry) => entry.period.start,
  );

  const rows: RirekishoRow[] = [];
  let lastEntryRows: RirekishoRow[] = [];
  for (const entry of sorted) {
    const entryRows: RirekishoRow[] = [];
    const datedLines = entry.lines.map((line) =>
      LEADING_DATE.exec(toHalfWidthDigits(line)),
    );
    const datedCount = datedLines.filter(Boolean).length;

    if (datedCount > 0 && datedCount * 2 >= entry.lines.length) {
      // The bullets are already 履歴書 lines ("2021年4月 入社 ..."): keep them.
      entry.lines.forEach((line, index) => {
        const dated = datedLines[index];
        if (!dated) {
          entryRows.push(row(null, line));
          return;
        }
        const rest = dated[2].trim();
        if (rest)
          entryRows.push(row(findYearMonths(dated[1])[0] ?? null, rest));
      });
      const firstDated = entryRows.find((item) => item.year);
      if (
        entry.company &&
        firstDated &&
        !entryRows.some((item) => item.text.includes(entry.company))
      ) {
        firstDated.text = `${entry.company} ${firstDated.text}`;
      }
    } else {
      const { start, end, expected } = entry.period;
      entryRows.push(
        row(start, entry.company ? `${entry.company} 入社` : entry.position),
      );
      if (entry.company && entry.position)
        entryRows.push(row(null, entry.position));
      for (const role of sortByDate(entry.roles, (item) => item.period.start)) {
        entryRows.push(row(role.period.start, role.position));
      }
      if (end) {
        entryRows.push(
          expected || isAfter(end, today)
            ? row(end, "退職予定")
            : row(end, entry.company ? `${entry.company} 退職` : "退職"),
        );
      }
    }
    rows.push(...entryRows);
    lastEntryRows = entryRows;
  }

  const last = sorted.at(-1);
  const lastIsCurrent =
    last &&
    !last.period.end &&
    (last.period.ongoing || last.period.start !== null);
  if (
    lastIsCurrent &&
    !lastEntryRows.some((item) => item.text.includes("退職"))
  ) {
    rows.push(row(null, "現在に至る"));
  }
  return rows;
}

/** The 学歴・職歴 table, headed 学歴 / 職歴 and closed with 以上. */
export function buildHistoryRows(
  resumeJson: unknown,
  today: CalendarDate,
): RirekishoRow[] {
  const education = educationRows(resumeJson, today);
  const work = workRows(resumeJson, today);
  const heading = (value: string): RirekishoRow => ({
    year: "",
    month: "",
    text: value,
    align: "center",
  });
  return [
    ...(education.length > 0 ? [heading("学歴"), ...education] : []),
    heading("職歴"),
    ...(work.length > 0 ? work : [row(null, "なし")]),
    { year: "", month: "", text: "以上", align: "right" },
  ];
}

export function buildLicenseRows(resumeJson: unknown): RirekishoRow[] {
  const entries = visibleItems(resumeJson, "certifications")
    .map((item) => ({
      title: str(item.title),
      date: findYearMonths(str(item.date))[0] ?? null,
    }))
    .filter((entry) => entry.title);
  return sortByDate(entries, (entry) => entry.date).map((entry) =>
    row(entry.date, entry.title),
  );
}

// ---------------------------------------------------------------------------
// The whole form
// ---------------------------------------------------------------------------

export interface RirekishoData {
  createdOn: CalendarDate;
  name: string;
  furigana: string;
  birthDate: CalendarDate | null;
  age: number | null;
  gender: string;
  postalCode: string;
  address: string;
  addressFurigana: string;
  phone: string;
  email: string;
  contactPostalCode: string;
  contactAddress: string;
  contactAddressFurigana: string;
  contactPhone: string;
  contactEmail: string;
  historyRows: RirekishoRow[];
  licenseRows: RirekishoRow[];
  motivation: string;
  wishes: string;
}

export function buildRirekishoData(args: {
  resumeJson: unknown;
  profile: RirekishoProfile | null | undefined;
  /** A job's own 志望動機; the profile's base one when absent. */
  motivation?: string | null;
  today: CalendarDate;
}): RirekishoData {
  const basics = asRecord(asRecord(args.resumeJson).basics);
  const profile = resolveRirekishoProfile(args.profile, args.resumeJson);
  const birthDate = parseIsoDate(profile.birthDate);
  return {
    createdOn: args.today,
    name: str(basics.name),
    furigana: profile.furigana,
    birthDate,
    age: birthDate ? ageOn(birthDate, args.today) : null,
    gender: profile.gender,
    postalCode: profile.postalCode,
    address: profile.address,
    addressFurigana: profile.addressFurigana,
    phone: str(basics.phone),
    email: str(basics.email),
    contactPostalCode: profile.contactPostalCode,
    contactAddress: profile.contactAddress,
    contactAddressFurigana: profile.contactAddressFurigana,
    contactPhone: profile.contactPhone,
    contactEmail: profile.contactEmail,
    historyRows: buildHistoryRows(args.resumeJson, args.today),
    licenseRows: buildLicenseRows(args.resumeJson),
    motivation: (args.motivation?.trim() || profile.motivation).trim(),
    wishes: profile.wishes.trim() || DEFAULT_RIREKISHO_WISHES,
  };
}
