/**
 * Fork: Japan's 47 prefectures with their JIS codes (Mynavi's prefecture
 * filter), English names and Japanese names, plus major cities that users type
 * instead of a prefecture. Location matching uses it so 東京 and Tokyo are the
 * same place.
 */
export interface Prefecture {
  code: string;
  en: string;
  ja: string;
  /** Japanese name without 都/道/府/県, e.g. 東京 for 東京都. */
  short: string;
}

export const PREFECTURES: readonly Prefecture[] = [
  { code: "1", en: "Hokkaido", ja: "北海道", short: "北海道" },
  { code: "2", en: "Aomori", ja: "青森県", short: "青森" },
  { code: "3", en: "Iwate", ja: "岩手県", short: "岩手" },
  { code: "4", en: "Miyagi", ja: "宮城県", short: "宮城" },
  { code: "5", en: "Akita", ja: "秋田県", short: "秋田" },
  { code: "6", en: "Yamagata", ja: "山形県", short: "山形" },
  { code: "7", en: "Fukushima", ja: "福島県", short: "福島" },
  { code: "8", en: "Ibaraki", ja: "茨城県", short: "茨城" },
  { code: "9", en: "Tochigi", ja: "栃木県", short: "栃木" },
  { code: "10", en: "Gunma", ja: "群馬県", short: "群馬" },
  { code: "11", en: "Saitama", ja: "埼玉県", short: "埼玉" },
  { code: "12", en: "Chiba", ja: "千葉県", short: "千葉" },
  { code: "13", en: "Tokyo", ja: "東京都", short: "東京" },
  { code: "14", en: "Kanagawa", ja: "神奈川県", short: "神奈川" },
  { code: "15", en: "Niigata", ja: "新潟県", short: "新潟" },
  { code: "16", en: "Toyama", ja: "富山県", short: "富山" },
  { code: "17", en: "Ishikawa", ja: "石川県", short: "石川" },
  { code: "18", en: "Fukui", ja: "福井県", short: "福井" },
  { code: "19", en: "Yamanashi", ja: "山梨県", short: "山梨" },
  { code: "20", en: "Nagano", ja: "長野県", short: "長野" },
  { code: "21", en: "Gifu", ja: "岐阜県", short: "岐阜" },
  { code: "22", en: "Shizuoka", ja: "静岡県", short: "静岡" },
  { code: "23", en: "Aichi", ja: "愛知県", short: "愛知" },
  { code: "24", en: "Mie", ja: "三重県", short: "三重" },
  { code: "25", en: "Shiga", ja: "滋賀県", short: "滋賀" },
  { code: "26", en: "Kyoto", ja: "京都府", short: "京都" },
  { code: "27", en: "Osaka", ja: "大阪府", short: "大阪" },
  { code: "28", en: "Hyogo", ja: "兵庫県", short: "兵庫" },
  { code: "29", en: "Nara", ja: "奈良県", short: "奈良" },
  { code: "30", en: "Wakayama", ja: "和歌山県", short: "和歌山" },
  { code: "31", en: "Tottori", ja: "鳥取県", short: "鳥取" },
  { code: "32", en: "Shimane", ja: "島根県", short: "島根" },
  { code: "33", en: "Okayama", ja: "岡山県", short: "岡山" },
  { code: "34", en: "Hiroshima", ja: "広島県", short: "広島" },
  { code: "35", en: "Yamaguchi", ja: "山口県", short: "山口" },
  { code: "36", en: "Tokushima", ja: "徳島県", short: "徳島" },
  { code: "37", en: "Kagawa", ja: "香川県", short: "香川" },
  { code: "38", en: "Ehime", ja: "愛媛県", short: "愛媛" },
  { code: "39", en: "Kochi", ja: "高知県", short: "高知" },
  { code: "40", en: "Fukuoka", ja: "福岡県", short: "福岡" },
  { code: "41", en: "Saga", ja: "佐賀県", short: "佐賀" },
  { code: "42", en: "Nagasaki", ja: "長崎県", short: "長崎" },
  { code: "43", en: "Kumamoto", ja: "熊本県", short: "熊本" },
  { code: "44", en: "Oita", ja: "大分県", short: "大分" },
  { code: "45", en: "Miyazaki", ja: "宮崎県", short: "宮崎" },
  { code: "46", en: "Kagoshima", ja: "鹿児島県", short: "鹿児島" },
  { code: "47", en: "Okinawa", ja: "沖縄県", short: "沖縄" },
];

/** Major cities people search for, mapped to their prefecture code. */
const CITY_TO_PREFECTURE_CODE: Record<string, string> = {
  yokohama: "14",
  横浜: "14",
  横浜市: "14",
  kawasaki: "14",
  川崎: "14",
  川崎市: "14",
  nagoya: "23",
  名古屋: "23",
  名古屋市: "23",
  kobe: "28",
  神戸: "28",
  神戸市: "28",
  sapporo: "1",
  札幌: "1",
  札幌市: "1",
  sendai: "4",
  仙台: "4",
  仙台市: "4",
  fukuoka: "40",
  博多: "40",
  福岡市: "40",
  osaka: "27",
  大阪市: "27",
  kyoto: "26",
  京都市: "26",
  hiroshima: "34",
  広島市: "34",
};

/** Finds the prefecture for a typed place name (Tokyo, 東京, 東京都, 横浜...). */
export function findPrefecture(
  place: string | null | undefined,
): Prefecture | null {
  const trimmed = place?.trim() ?? "";
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  const cityCode = CITY_TO_PREFECTURE_CODE[lower];
  if (cityCode) return PREFECTURES.find((p) => p.code === cityCode) ?? null;

  const exact = PREFECTURES.find(
    (p) =>
      p.ja === trimmed || p.short === trimmed || p.en.toLowerCase() === lower,
  );
  if (exact) return exact;

  // "Tokyo Prefecture", "Osaka-fu", "Aichi-ken"
  const english = lower
    .replace(/[\s-]+(prefecture|city|metropolis|ken|to|fu)$/u, "")
    .replace(/\s+/g, "");
  return PREFECTURES.find((p) => p.en.toLowerCase() === english) ?? null;
}

/** Major cities, so a city search keeps city precision (横浜 ≠ all of 神奈川). */
interface MajorCity {
  en: string;
  ja: string;
  short: string;
  /** Other names people type, e.g. 博多 for Fukuoka. */
  extra?: string[];
}

const MAJOR_CITIES: readonly MajorCity[] = [
  { en: "Yokohama", ja: "横浜市", short: "横浜" },
  { en: "Kawasaki", ja: "川崎市", short: "川崎" },
  { en: "Nagoya", ja: "名古屋市", short: "名古屋" },
  { en: "Kobe", ja: "神戸市", short: "神戸" },
  { en: "Sapporo", ja: "札幌市", short: "札幌" },
  { en: "Sendai", ja: "仙台市", short: "仙台" },
  { en: "Fukuoka", ja: "福岡市", short: "福岡", extra: ["博多"] },
  { en: "Osaka", ja: "大阪市", short: "大阪" },
  { en: "Kyoto", ja: "京都市", short: "京都" },
  { en: "Hiroshima", ja: "広島市", short: "広島" },
];

export interface JapanPlaceNames {
  /** English name, e.g. "Tokyo". */
  en: string;
  /** Japanese spellings, e.g. ["東京都", "東京"]. */
  ja: string[];
}

/**
 * Resolves a typed place (Tokyo, 東京, 東京都, 横浜, Osaka...) to its English
 * and Japanese names, or null when it is not a known Japanese place.
 */
export function resolveJapanPlace(
  place: string | null | undefined,
): JapanPlaceNames | null {
  const trimmed = place?.trim() ?? "";
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  const city = MAJOR_CITIES.find(
    (c) =>
      c.en.toLowerCase() === lower ||
      c.ja === trimmed ||
      c.short === trimmed ||
      c.extra?.includes(trimmed),
  );
  const prefecture = findPrefecture(trimmed);
  if (city) {
    // Osaka/Kyoto/Fukuoka/Hiroshima share the prefecture's name, so accept
    // both 大阪市 and 大阪府 there.
    const sameName = prefecture?.en === city.en;
    return {
      en: city.en,
      ja: [
        city.ja,
        city.short,
        ...(city.extra ?? []),
        ...(sameName && prefecture ? [prefecture.ja] : []),
      ],
    };
  }
  if (!prefecture) return null;
  return {
    en: prefecture.en,
    ja:
      prefecture.ja === prefecture.short
        ? [prefecture.ja]
        : [prefecture.ja, prefecture.short],
  };
}

const HAN = /\p{Script=Han}/u;
/** Kanji that may sit right before a place name: 神奈川県|横浜市. */
const ALLOWED_BEFORE = new Set(["都", "道", "府", "県"]);
/** Kanji that may follow a short name: 東京|都, 横浜|市, 東京|駅. */
const ALLOWED_AFTER = new Set(["都", "道", "府", "県", "市", "区", "駅"]);
/** A name ending in one of these is complete, so anything may follow it. */
const PLACE_SUFFIXES = new Set(["都", "道", "府", "県", "市"]);

/**
 * True when `text` names the Japanese place `name` as a whole word. Japanese
 * has no spaces, so kanji around the match decide: 東京都港区 contains 東京 but
 * not 京都, and 大阪市福島区 does not contain the prefecture 福島.
 */
export function containsJapanesePlaceName(
  text: string | null | undefined,
  name: string,
): boolean {
  if (!text || !name) return false;
  const complete = PLACE_SUFFIXES.has(name.at(-1) ?? "");
  let from = 0;
  while (from <= text.length - name.length) {
    const index = text.indexOf(name, from);
    if (index === -1) return false;
    const before = index > 0 ? text[index - 1] : "";
    const after = text[index + name.length] ?? "";
    const beforeOk = !before || !HAN.test(before) || ALLOWED_BEFORE.has(before);
    const afterOk =
      complete || !after || !HAN.test(after) || ALLOWED_AFTER.has(after);
    if (beforeOk && afterOk) return true;
    from = index + 1;
  }
  return false;
}

/** True when `text` names any prefecture in Japanese (東京都港区, 大阪府...). */
export function mentionsJapanesePrefecture(
  text: string | null | undefined,
): boolean {
  if (!text) return false;
  return PREFECTURES.some((p) => containsJapanesePlaceName(text, p.ja));
}

/**
 * True when `text` names any known Japanese prefecture or major city, in
 * English or Japanese. "丸の内, JPC, Japan" (an Indeed label) names none.
 */
export function mentionsKnownJapanPlace(
  text: string | null | undefined,
): boolean {
  if (!text) return false;
  const tokens = new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean),
  );
  return (
    PREFECTURES.some(
      (p) =>
        tokens.has(p.en.toLowerCase()) ||
        containsJapanesePlaceName(text, p.ja) ||
        containsJapanesePlaceName(text, p.short),
    ) ||
    MAJOR_CITIES.some(
      (c) =>
        tokens.has(c.en.toLowerCase()) ||
        containsJapanesePlaceName(text, c.ja) ||
        containsJapanesePlaceName(text, c.short),
    )
  );
}

/**
 * Tokyo's special wards whose names exist nowhere else in Japan. LinkedIn and
 * others sometimes label a job with the ward alone ("Shibuya, Japan",
 * "Shinjuku-ku"). Chuo, Minato and Kita are left out: Osaka, Nagoya, Sapporo
 * and others have wards with the same names. Ota is left out in English
 * because Ota City (太田市) is in Gunma.
 */
const TOKYO_WARDS_EN = new Set([
  "chiyoda",
  "shinjuku",
  "bunkyo",
  "taito",
  "sumida",
  "koto",
  "shinagawa",
  "meguro",
  "setagaya",
  "shibuya",
  "nakano",
  "suginami",
  "toshima",
  "arakawa",
  "itabashi",
  "nerima",
  "adachi",
  "katsushika",
  "edogawa",
]);

const TOKYO_WARDS_JA = [
  "千代田区",
  "新宿区",
  "文京区",
  "台東区",
  "墨田区",
  "江東区",
  "品川区",
  "目黒区",
  "大田区",
  "世田谷区",
  "渋谷区",
  "中野区",
  "杉並区",
  "豊島区",
  "荒川区",
  "板橋区",
  "練馬区",
  "足立区",
  "葛飾区",
  "江戸川区",
];

/**
 * True when `text` names a Tokyo ward and no other known Japanese place, so
 * "Shibuya, Japan" counts as Tokyo but "Nakano, Nagano" does not.
 */
export function namesTokyoWardOnly(text: string | null | undefined): boolean {
  if (!text) return false;
  const tokens = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const namesWard =
    tokens.some((token) => TOKYO_WARDS_EN.has(token)) ||
    TOKYO_WARDS_JA.some((ward) => text.includes(ward));
  return namesWard && !mentionsKnownJapanPlace(text);
}

/**
 * English name for a place typed in Japanese (東京 → Tokyo), for job boards
 * that only understand English place names. Anything else is returned as is.
 */
export function toEnglishJapanPlace(place: string): string {
  if (!HAN.test(place)) return place;
  return resolveJapanPlace(place)?.en ?? place;
}
