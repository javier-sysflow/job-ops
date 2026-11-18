/**
 * Locale-aware formatting for dates, numbers, money and relative time.
 * Use these instead of hard-coded "en-GB"/"en-US" so Japanese users get
 * Japanese formats (2026年11月18日, ¥8,000,000, 3日前).
 */
import { getUiLanguage, getUiLocale } from "./language";

const formatterCache = new Map<string, Intl.DateTimeFormat>();
const numberFormatterCache = new Map<string, Intl.NumberFormat>();

function dateFormatter(options: Intl.DateTimeFormatOptions) {
  const locale = getUiLocale();
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, formatter);
  }
  return formatter;
}

function numberFormatter(options: Intl.NumberFormatOptions) {
  const locale = getUiLocale();
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = numberFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatterCache.set(key, formatter);
  }
  return formatter;
}

function toDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
): string {
  const date = toDate(value);
  return date ? dateFormatter(options).format(date) : "";
}

export function formatTime(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
): string {
  const date = toDate(value);
  return date ? dateFormatter(options).format(date) : "";
}

export function formatDateTime(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
): string {
  const date = toDate(value);
  return date ? dateFormatter(options).format(date) : "";
}

export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return numberFormatter(options).format(value);
}

/** Currency with no decimals for JPY; compact 万/億 style in Japanese. */
export function formatCurrency(
  value: number,
  currency: string,
  options: Intl.NumberFormatOptions = {},
): string {
  const upper = currency.toUpperCase();
  return numberFormatter({
    style: "currency",
    currency: upper,
    maximumFractionDigits: upper === "JPY" ? 0 : 2,
    ...options,
  }).format(value);
}

/** e.g. "3 days ago" / "3日前". */
export function formatRelativeTime(
  value: Date | string | number,
  now: Date = new Date(),
): string {
  const date = toDate(value);
  if (!date) return "";
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat(getUiLocale(), {
    numeric: "auto",
  });
  if (abs < 60) return formatter.format(diffSeconds, "second");
  if (abs < 3600)
    return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86_400)
    return formatter.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 30 * 86_400) {
    return formatter.format(Math.round(diffSeconds / 86_400), "day");
  }
  if (abs < 365 * 86_400) {
    return formatter.format(Math.round(diffSeconds / (30 * 86_400)), "month");
  }
  return formatter.format(Math.round(diffSeconds / (365 * 86_400)), "year");
}

export function isJapaneseUi(): boolean {
  return getUiLanguage() === "ja";
}
