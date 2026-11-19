import { describe, expect, it } from "vitest";
import {
  containsJapanesePlaceName,
  findPrefecture,
  mentionsJapanesePrefecture,
  mentionsKnownJapanPlace,
  resolveJapanPlace,
  toEnglishJapanPlace,
} from "./japan-places";

describe("japan-places", () => {
  it("resolves prefectures typed in English or Japanese", () => {
    for (const typed of ["Tokyo", "tokyo", "東京", "東京都"]) {
      expect(resolveJapanPlace(typed)).toEqual({
        en: "Tokyo",
        ja: ["東京都", "東京"],
      });
    }
    expect(resolveJapanPlace("北海道")).toEqual({
      en: "Hokkaido",
      ja: ["北海道"],
    });
  });

  it("keeps major cities at city level", () => {
    expect(resolveJapanPlace("横浜")).toEqual({
      en: "Yokohama",
      ja: ["横浜市", "横浜"],
    });
    expect(resolveJapanPlace("Osaka")).toEqual({
      en: "Osaka",
      ja: ["大阪市", "大阪", "大阪府"],
    });
    expect(resolveJapanPlace("博多")?.en).toBe("Fukuoka");
  });

  it("returns null for places outside Japan", () => {
    expect(resolveJapanPlace("London")).toBeNull();
    expect(resolveJapanPlace("")).toBeNull();
    expect(resolveJapanPlace(null)).toBeNull();
  });

  it("matches Japanese place names only as whole words", () => {
    expect(containsJapanesePlaceName("東京都港区", "東京")).toBe(true);
    expect(containsJapanesePlaceName("東京都港区", "東京都")).toBe(true);
    expect(containsJapanesePlaceName("東京 / リモート", "東京")).toBe(true);
    expect(containsJapanesePlaceName("神奈川県横浜市西区", "横浜")).toBe(true);
    expect(containsJapanesePlaceName("京都府京都市", "京都")).toBe(true);
    // 京都 sits inside 東京都, and 福島 is also a ward of Osaka.
    expect(containsJapanesePlaceName("東京都港区", "京都")).toBe(false);
    expect(containsJapanesePlaceName("大阪市福島区", "福島")).toBe(false);
    expect(containsJapanesePlaceName("東京都市大学", "京都市")).toBe(false);
  });

  it("detects Japanese prefecture names in addresses", () => {
    expect(mentionsJapanesePrefecture("東京都千代田区丸の内")).toBe(true);
    expect(mentionsJapanesePrefecture("大阪府吹田市")).toBe(true);
    expect(mentionsJapanesePrefecture("丸の内, JPC, Japan")).toBe(false);
    expect(mentionsJapanesePrefecture("New York, NY")).toBe(false);
  });

  it("detects any known place in English or Japanese", () => {
    expect(mentionsKnownJapanPlace("Chiyoda, Tokyo, Japan")).toBe(true);
    expect(mentionsKnownJapanPlace("Yokohama, Kanagawa, Japan")).toBe(true);
    expect(mentionsKnownJapanPlace("横浜市西区")).toBe(true);
    expect(mentionsKnownJapanPlace("丸の内, JPC, Japan")).toBe(false);
    expect(mentionsKnownJapanPlace("JPC, Japan")).toBe(false);
  });

  it("translates Japanese place names to English for job boards", () => {
    expect(toEnglishJapanPlace("東京")).toBe("Tokyo");
    expect(toEnglishJapanPlace("東京都")).toBe("Tokyo");
    expect(toEnglishJapanPlace("大阪")).toBe("Osaka");
    expect(toEnglishJapanPlace("Tokyo")).toBe("Tokyo");
    expect(toEnglishJapanPlace("London")).toBe("London");
    expect(toEnglishJapanPlace("渋谷")).toBe("渋谷");
  });

  it("keeps the Mynavi prefecture lookup unchanged", () => {
    expect(findPrefecture("東京")?.code).toBe("13");
    expect(findPrefecture("Yokohama")?.code).toBe("14");
  });
});
