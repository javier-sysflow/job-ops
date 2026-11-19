import { describe, expect, it } from "vitest";
import {
  ageOn,
  buildHistoryRows,
  buildLicenseRows,
  buildRirekishoData,
  deriveRirekishoDefaults,
  findYearMonths,
  htmlToLines,
  parseBirthDate,
  parsePeriod,
  parseRirekishoProfile,
  resolveRirekishoProfile,
} from "./rirekisho";

const TODAY = { year: 2026, month: 11, day: 19 };

/** Shaped like a 履歴書 import: 履歴書 lines as bullets, labelled custom fields. */
const RIREKISHO_IMPORT = {
  basics: {
    name: "山田 花子",
    phone: "090-1234-5678",
    email: "hanako@example.com",
    location: "〒160-0023 東京都新宿区西新宿1-1-1",
    customFields: [
      { id: "1", icon: "", text: "ふりがな：やまだ はなこ", link: "" },
      {
        id: "2",
        icon: "",
        text: "生年月日：1998年10月22日生（満28歳）",
        link: "",
      },
      { id: "3", icon: "", text: "連絡先：同上", link: "" },
    ],
  },
  summary: {
    title: "志望の動機、特技、好きな学科、アピールポイントなど",
    content:
      "<p>再エネの法人営業に携わりたいと考えています。</p><p>二段落目です。</p>",
  },
  sections: {
    education: {
      hidden: false,
      items: [
        {
          hidden: false,
          school: "サンプル大学",
          degree: "修士課程",
          area: "環境学専攻",
          period: "2026年9月 - 2028年9月（修了予定）",
        },
        {
          hidden: false,
          school: "見本大学",
          degree: "",
          area: "文学部",
          period: "2017年4月 - 2021年3月",
        },
        {
          hidden: true,
          school: "非表示大学",
          degree: "",
          area: "",
          period: "2010年",
        },
      ],
    },
    experience: {
      hidden: false,
      items: [
        {
          hidden: false,
          company: "株式会社みほん",
          position: "",
          period: "2025年2月 - 2027年1月（退職予定）",
          description:
            "<ul><li>2025年2月 入社（海外勤務）</li><li>太陽光の提案営業を担当</li><li>2027年1月 同社 退職予定</li></ul>",
          roles: [],
        },
        {
          hidden: false,
          company: "サンプル商事株式会社",
          position: "",
          period: "2021年4月 - 2024年12月",
          description:
            "<ul><li>2021年4月 入社 営業支援部に配属</li><li>2022年12月 営業部に異動</li><li>2024年12月 一身上の都合により退職</li></ul>",
          roles: [],
        },
      ],
    },
    certifications: {
      hidden: false,
      items: [
        { hidden: false, title: "TOEIC 900点", date: "2026年6月" },
        {
          hidden: false,
          title: "普通自動車第一種運転免許",
          date: "2020年11月",
        },
        { hidden: false, title: "日付なしの資格", date: "" },
      ],
    },
  },
  metadata: {
    notes:
      "本人希望記入欄：貴社の規定に従います。入社は2027年4月以降を希望します。",
  },
};

describe("dates", () => {
  it("finds year/months written in several ways", () => {
    expect(findYearMonths("2021年4月 - 2024年12月")).toEqual([
      { year: 2021, month: 4 },
      { year: 2024, month: 12 },
    ]);
    expect(findYearMonths("2021/04 – 2024.12")).toEqual([
      { year: 2021, month: 4 },
      { year: 2024, month: 12 },
    ]);
    expect(findYearMonths("Apr 2021 - December 2024")).toEqual([
      { year: 2021, month: 4 },
      { year: 2024, month: 12 },
    ]);
    expect(findYearMonths("令和3年4月〜令和元年5月")).toEqual([
      { year: 2021, month: 4 },
      { year: 2019, month: 5 },
    ]);
    expect(findYearMonths("２０２１年４月")).toEqual([
      { year: 2021, month: 4 },
    ]);
    expect(findYearMonths("2019 - 2021")).toEqual([
      { year: 2019, month: null },
      { year: 2021, month: null },
    ]);
    expect(findYearMonths("No dates here")).toEqual([]);
  });

  it("reads ongoing and planned periods", () => {
    expect(parsePeriod("2021年4月 - 現在")).toMatchObject({
      start: { year: 2021, month: 4 },
      end: null,
      ongoing: true,
    });
    expect(parsePeriod("2025年2月 - 2027年1月（退職予定）")).toMatchObject({
      expected: true,
      ongoing: false,
    });
    expect(parsePeriod("2021年3月").single).toBe(true);
  });

  it("parses a birth date and the age on a day", () => {
    expect(parseBirthDate("1998年10月22日生（満28歳）")).toBe("1998-10-22");
    expect(parseBirthDate("平成10年10月22日")).toBe("1998-10-22");
    expect(parseBirthDate("1998/1/5")).toBe("1998-01-05");
    expect(parseBirthDate("unknown")).toBe("");
    expect(ageOn({ year: 1998, month: 10, day: 22 }, TODAY)).toBe(28);
    expect(ageOn({ year: 1998, month: 11, day: 20 }, TODAY)).toBe(27);
  });
});

describe("htmlToLines", () => {
  it("splits list items and paragraphs and drops typed bullets", () => {
    expect(
      htmlToLines(
        "<ul><li>・一つ目 &amp; 二</li><li><p>二つ目</p></li></ul><p>三つ目</p>",
      ),
    ).toEqual(["一つ目 & 二", "二つ目", "三つ目"]);
  });
});

describe("profile", () => {
  it("falls back to what a 履歴書 import left in the résumé", () => {
    expect(deriveRirekishoDefaults(RIREKISHO_IMPORT)).toEqual({
      furigana: "やまだ はなこ",
      birthDate: "1998-10-22",
      gender: "",
      postalCode: "160-0023",
      address: "東京都新宿区西新宿1-1-1",
      addressFurigana: "",
      contactPostalCode: "",
      contactAddress: "同上",
      contactAddressFurigana: "",
      contactPhone: "",
      contactEmail: "",
      motivation:
        "再エネの法人営業に携わりたいと考えています。\n二段落目です。",
      wishes: "貴社の規定に従います。入社は2027年4月以降を希望します。",
    });
  });

  it("does not treat a 職務要約 summary as the 志望動機", () => {
    expect(
      deriveRirekishoDefaults({
        ...RIREKISHO_IMPORT,
        summary: { title: "職務要約", content: "<p>営業10年。</p>" },
      }).motivation,
    ).toBe("");
  });

  it("uses saved values, and keeps a field saved as empty blank", () => {
    const resolved = resolveRirekishoProfile(
      { furigana: "ヤマダ ハナコ", birthDate: "" },
      RIREKISHO_IMPORT,
    );
    expect(resolved.furigana).toBe("ヤマダ ハナコ");
    expect(resolved.birthDate).toBe("");
    expect(resolved.postalCode).toBe("160-0023");
  });

  it("parses stored JSON and rejects junk", () => {
    expect(parseRirekishoProfile('{"furigana":"やまだ"}')).toEqual({
      furigana: "やまだ",
    });
    expect(parseRirekishoProfile("not json")).toBeNull();
    expect(parseRirekishoProfile('{"furigana":42}')).toBeNull();
    expect(parseRirekishoProfile(null)).toBeNull();
  });
});

describe("buildHistoryRows", () => {
  it("orders 学歴 then 職歴 oldest first and keeps 履歴書-style bullets", () => {
    const rows = buildHistoryRows(RIREKISHO_IMPORT, TODAY).map(
      (item) => `${item.year}|${item.month}|${item.align}|${item.text}`,
    );
    expect(rows).toEqual([
      "||center|学歴",
      "2017|4|left|見本大学 文学部 入学",
      "2021|3|left|見本大学 文学部 卒業",
      "2026|9|left|サンプル大学 修士課程 環境学専攻 入学",
      "2028|9|left|サンプル大学 修士課程 環境学専攻 修了見込み",
      "||center|職歴",
      "2021|4|left|サンプル商事株式会社 入社 営業支援部に配属",
      "2022|12|left|営業部に異動",
      "2024|12|left|一身上の都合により退職",
      "2025|2|left|株式会社みほん 入社（海外勤務）",
      "||left|太陽光の提案営業を担当",
      "2027|1|left|同社 退職予定",
      "||right|以上",
    ]);
  });

  it("builds 入社/退職 rows from dates when the bullets are duties", () => {
    const rows = buildHistoryRows(
      {
        sections: {
          experience: {
            items: [
              {
                company: "株式会社前職",
                position: "営業部",
                period: "2018年4月 - 2020年3月",
                description:
                  "<ul><li>新規開拓</li><li>既存顧客の深耕</li></ul>",
                roles: [{ position: "営業課長に昇進", period: "2019年4月 -" }],
              },
              {
                company: "株式会社現職",
                position: "",
                period: "2020年4月 - 現在",
                description: "<p>法人営業を担当</p>",
              },
            ],
          },
        },
      },
      TODAY,
    ).map((item) => `${item.year}|${item.month}|${item.text}`);
    expect(rows).toEqual([
      "||職歴",
      "2018|4|株式会社前職 入社",
      "||営業部",
      "2019|4|営業課長に昇進",
      "2020|3|株式会社前職 退職",
      "2020|4|株式会社現職 入社",
      "||現在に至る",
      "||以上",
    ]);
  });

  it("writes 卒業 for a single graduation date and なし with no work", () => {
    const rows = buildHistoryRows(
      {
        sections: {
          education: { items: [{ school: "見本高校", period: "2014年3月" }] },
        },
      },
      TODAY,
    ).map((item) => `${item.year}|${item.month}|${item.text}`);
    expect(rows).toEqual([
      "||学歴",
      "2014|3|見本高校 卒業",
      "||職歴",
      "||なし",
      "||以上",
    ]);
  });
});

describe("buildLicenseRows", () => {
  it("lists certifications oldest first, undated last", () => {
    expect(
      buildLicenseRows(RIREKISHO_IMPORT).map(
        (item) => `${item.year}|${item.month}|${item.text}`,
      ),
    ).toEqual([
      "2020|11|普通自動車第一種運転免許",
      "2026|6|TOEIC 900点",
      "||日付なしの資格",
    ]);
  });
});

describe("buildRirekishoData", () => {
  it("prefers the job's own 志望動機 and defaults the wishes", () => {
    const data = buildRirekishoData({
      resumeJson: { ...RIREKISHO_IMPORT, metadata: { notes: "" } },
      profile: null,
      motivation: "貴社の事業に惹かれました。",
      today: TODAY,
    });
    expect(data.motivation).toBe("貴社の事業に惹かれました。");
    expect(data.wishes).toBe("貴社の規定に従います。");
    expect(data.age).toBe(28);
    expect(data.name).toBe("山田 花子");
    expect(data.phone).toBe("090-1234-5678");
  });

  it("falls back to the base 志望動機 without a job one", () => {
    const data = buildRirekishoData({
      resumeJson: RIREKISHO_IMPORT,
      profile: { motivation: "基本の志望動機" },
      motivation: "  ",
      today: TODAY,
    });
    expect(data.motivation).toBe("基本の志望動機");
  });
});
