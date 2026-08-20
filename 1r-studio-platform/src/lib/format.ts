// Reusable currency & date formatters — SAR primary currency, Arabic/English aware.
import { format as formatDateFns } from "date-fns";
import { ar as arSA, enUS } from "date-fns/locale";

export type Locale = "ar" | "en";

/**
 * Currency formatter.
 * Arabic:  "2,500 ريال"
 * English: "SAR 2,500"
 */
export function formatCurrency(
  amount: number | string,
  locale: Locale,
  opts: { decimals?: 0 | 2 } = {}
): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const decimals = opts.decimals ?? (Number.isInteger(value) ? 0 : 2);
  const num = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return locale === "ar" ? `${num} ريال` : `SAR ${num}`;
}

/** Compact currency for tight card spaces, e.g. "12.4K" */
export function formatCurrencyCompact(amount: number | string, locale: Locale): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const num = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
  return locale === "ar" ? `${num} ريال` : `SAR ${num}`;
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(value);
}

export function formatPercent(value: number, locale: Locale, opts: { signed?: boolean } = {}): string {
  const sign = opts.signed && value > 0 ? "+" : "";
  const num = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
  return `${sign}${num}%`;
}

/**
 * Date formatter.
 * Arabic:  "25 سبتمبر 2026"
 * English: "25 September 2026"
 */
export function formatDate(date: Date | string, locale: Locale, pattern = "d MMMM yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDateFns(d, pattern, { locale: locale === "ar" ? arSA : enUS });
}

export function formatDateShort(date: Date | string, locale: Locale): string {
  return formatDate(date, locale, "d MMM yyyy");
}

export function formatDateISO(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function formatDateTime(date: Date | string, locale: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${formatDate(d, locale)} — ${formatDateFns(d, "h:mm a", { locale: locale === "ar" ? arSA : enUS })}`;
}
