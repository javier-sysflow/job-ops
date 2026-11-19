import { describe, expect, it } from "vitest";
import {
  matchesRequestedCity,
  matchesRequestedCountry,
  parseSearchCitiesSetting,
  resolveSearchCities,
  serializeSearchCitiesSetting,
  shouldApplyStrictCityFilter,
} from "./search-cities";

describe("search-cities", () => {
  it("parses and deduplicates search cities", () => {
    expect(parseSearchCitiesSetting("Leeds|london|Leeds")).toEqual([
      "Leeds",
      "london",
    ]);
    expect(parseSearchCitiesSetting("Leeds\nLondon\nleeds")).toEqual([
      "Leeds",
      "London",
    ]);
    expect(parseSearchCitiesSetting("")).toEqual([]);
  });

  it("serializes search cities", () => {
    expect(serializeSearchCitiesSetting(["Leeds", "London"])).toBe(
      "Leeds|London",
    );
    expect(serializeSearchCitiesSetting([])).toBeNull();
  });

  it("resolves search cities from list/single/env/fallback", () => {
    expect(
      resolveSearchCities({
        list: [" Leeds ", "London", "leeds"],
      }),
    ).toEqual(["Leeds", "London"]);

    expect(resolveSearchCities({ single: "Leeds|London" })).toEqual([
      "Leeds",
      "London",
    ]);
    expect(resolveSearchCities({ env: "Leeds\nLondon" })).toEqual([
      "Leeds",
      "London",
    ]);
    expect(resolveSearchCities({ fallback: "UK" })).toEqual(["UK"]);
  });

  it("falls back when single/env values parse to empty", () => {
    expect(resolveSearchCities({ single: "", fallback: "UK" })).toEqual(["UK"]);
    expect(resolveSearchCities({ single: "||", fallback: "UK" })).toEqual([
      "UK",
    ]);
    expect(resolveSearchCities({ env: "   ", fallback: "UK" })).toEqual(["UK"]);
  });

  it("returns empty array when all resolve options are empty", () => {
    expect(
      resolveSearchCities({
        list: [],
        single: "",
        env: "",
        fallback: "",
      }),
    ).toEqual([]);
  });

  it("applies strict filter only when city differs from country", () => {
    expect(shouldApplyStrictCityFilter("Leeds", "united kingdom")).toBe(true);
    expect(shouldApplyStrictCityFilter("UK", "united kingdom")).toBe(false);
    expect(shouldApplyStrictCityFilter("usa", "united states")).toBe(false);
  });

  it("matches by whole location tokens and avoids substring false positives", () => {
    expect(matchesRequestedCity("Leeds, England, UK", "Leeds")).toBe(true);
    expect(matchesRequestedCity("Manchester, England, UK", "Chester")).toBe(
      false,
    );
    expect(
      matchesRequestedCity("New York, NY, United States", "new york"),
    ).toBe(true);
  });

  it("matches requested countries using canonical names and common aliases", () => {
    expect(matchesRequestedCountry("Zagreb, Croatia", "croatia")).toBe(true);
    expect(
      matchesRequestedCountry("Leeds, England, UK", "united kingdom"),
    ).toBe(true);
    expect(
      matchesRequestedCountry(
        "Austin, Texas, United States of America",
        "united states",
      ),
    ).toBe(true);
    expect(matchesRequestedCountry("Bengaluru, India", "croatia")).toBe(false);
    expect(matchesRequestedCountry(undefined, "croatia")).toBe(false);
  });

  it("matches ISO-2 codes and localized country names", () => {
    expect(
      matchesRequestedCountry("Amsterdam Zuid, NH, NL", "netherlands"),
    ).toBe(true);
    expect(matchesRequestedCountry("Berlin, DE", "germany")).toBe(false);
    expect(matchesRequestedCountry("Amsterdam, Netherlands", "NL")).toBe(true);
    expect(matchesRequestedCountry("Berlin, BE, DE", "germany")).toBe(true);
    expect(matchesRequestedCountry("Amsterdam, Nederland", "netherlands")).toBe(
      true,
    );
    expect(matchesRequestedCountry("Berlin, Deutschland", "germany")).toBe(
      true,
    );
    expect(matchesRequestedCountry("Madrid, España", "spain")).toBe(true);
    expect(matchesRequestedCountry("İstanbul, Türkiye", "turkey")).toBe(true);
  });

  it.each([
    "US",
    "USA",
    "us",
    "usa",
  ])("matches the %s country suffix without treating it as a subdivision", (suffix) => {
    expect(
      matchesRequestedCountry(`New York, NY, ${suffix}`, "united states"),
    ).toBe(true);
    expect(matchesRequestedCountry(`New York, NY, ${suffix}`, "canada")).toBe(
      false,
    );
  });

  it("does not confuse country codes with subdivision abbreviations", () => {
    expect(matchesRequestedCountry("San Francisco, CA", "canada")).toBe(false);
    expect(matchesRequestedCountry("San Francisco, CA, US", "canada")).toBe(
      false,
    );
    expect(matchesRequestedCountry("Indianapolis, IN", "india")).toBe(false);
    expect(matchesRequestedCountry("IN", "india")).toBe(true);
  });

  it("treats Japanese and English names of a Japanese city as the same", () => {
    expect(matchesRequestedCity("Chiyoda, Tokyo, Japan", "東京")).toBe(true);
    expect(matchesRequestedCity("Tokyo, Tokyo, Japan", "東京都")).toBe(true);
    expect(matchesRequestedCity("東京都港区", "Tokyo")).toBe(true);
    expect(matchesRequestedCity("東京都港区", "東京")).toBe(true);
    expect(matchesRequestedCity("神奈川県横浜市", "Yokohama")).toBe(true);
    expect(matchesRequestedCity("Osaka, Osaka, Japan", "大阪")).toBe(true);
    expect(matchesRequestedCity("東京都港区", "京都")).toBe(false);
    expect(matchesRequestedCity("Kyoto, Japan", "東京")).toBe(false);
    expect(matchesRequestedCity("Yokohama, Kanagawa, Japan", "東京")).toBe(
      false,
    );
  });

  it("treats a Tokyo ward named on its own as Tokyo", () => {
    expect(matchesRequestedCity("Shibuya, Japan", "東京")).toBe(true);
    expect(matchesRequestedCity("Minato City, Tokyo, Japan", "東京")).toBe(true);
    expect(matchesRequestedCity("Setagaya City, JP", "Tokyo")).toBe(true);
    expect(matchesRequestedCity("Shinjuku-ku, Japan", "東京都")).toBe(true);
    expect(matchesRequestedCity("渋谷区神南1丁目", "東京")).toBe(true);
    // Wards that share a name with wards elsewhere, or another place named.
    expect(matchesRequestedCity("Minato City, JP", "東京")).toBe(false);
    expect(matchesRequestedCity("Chuo-ku, Osaka, Japan", "東京")).toBe(false);
    expect(matchesRequestedCity("Nakano, Nagano, Japan", "東京")).toBe(false);
    expect(matchesRequestedCity("Ota, Gunma, Japan", "東京")).toBe(false);
    // Only a Tokyo search uses ward names.
    expect(matchesRequestedCity("Shibuya, Japan", "Osaka")).toBe(false);
  });

  it("recognises a Tokyo ward on its own as Japan", () => {
    expect(matchesRequestedCountry("Shinjuku-ku", "japan")).toBe(true);
    expect(matchesRequestedCountry("Shinjuku-ku", "united states")).toBe(false);
    expect(matchesRequestedCountry("Kochi, Kerala, India", "japan")).toBe(false);
    expect(matchesRequestedCountry("日本（フルリモート）", "japan")).toBe(true);
  });

  it("recognises a Japanese address as Japan", () => {
    expect(matchesRequestedCountry("東京都港区", "japan")).toBe(true);
    expect(matchesRequestedCountry("東京都港区", "united states")).toBe(false);
  });
});
