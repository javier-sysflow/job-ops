/**
 * Japan's 47 prefectures with their JIS codes (Mynavi's prefecture filter),
 * English names and Japanese names, plus major cities that users type
 * instead of a prefecture.
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
