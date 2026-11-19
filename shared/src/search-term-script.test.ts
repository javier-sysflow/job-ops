import { describe, expect, it } from "vitest";
import {
  describeNoUsableTerms,
  filterSearchTermsForSource,
  hasJapaneseScript,
} from "./search-term-script";

const RIHO_TERMS = [
  "renewable energy consultant",
  "energy consultant",
  "再生可能エネルギー コンサルタント",
  "脱炭素 コンサルタント",
  "PPA 営業",
  "ESG",
];

describe("hasJapaneseScript", () => {
  it("spots kanji, hiragana and katakana", () => {
    expect(hasJapaneseScript("営業")).toBe(true);
    expect(hasJapaneseScript("コンサルタント")).toBe(true);
    expect(hasJapaneseScript("PPA 営業")).toBe(true);
    expect(hasJapaneseScript("energy consultant")).toBe(false);
    expect(hasJapaneseScript("Développeur")).toBe(false);
  });
});

describe("filterSearchTermsForSource", () => {
  it("sends Mynavi Japanese terms and single Latin words, not English phrases", () => {
    expect(filterSearchTermsForSource("mynavi", RIHO_TERMS)).toEqual([
      "再生可能エネルギー コンサルタント",
      "脱炭素 コンサルタント",
      "PPA 営業",
      "ESG",
    ]);
  });

  it("sends English-only boards no Japanese terms", () => {
    for (const source of ["himalayas", "workingnomads", "startupjobs"]) {
      expect(filterSearchTermsForSource(source, RIHO_TERMS)).toEqual([
        "renewable energy consultant",
        "energy consultant",
        "ESG",
      ]);
    }
  });

  it("sends every other source every term", () => {
    for (const source of ["indeed", "linkedin", "japandev", "freehire"]) {
      expect(filterSearchTermsForSource(source, RIHO_TERMS)).toEqual(
        RIHO_TERMS,
      );
    }
  });
});

describe("describeNoUsableTerms", () => {
  it("explains a skipped board", () => {
    expect(describeNoUsableTerms("mynavi", ["energy consultant"])).toMatch(
      /Japanese/,
    );
    expect(describeNoUsableTerms("himalayas", ["営業"])).toMatch(/English/);
  });

  it("is null when the board can use a term, or when there are no terms", () => {
    expect(describeNoUsableTerms("mynavi", RIHO_TERMS)).toBeNull();
    expect(describeNoUsableTerms("mynavi", [])).toBeNull();
    expect(describeNoUsableTerms("indeed", ["営業"])).toBeNull();
  });
});
