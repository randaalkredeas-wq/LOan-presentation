import { Currency } from "@/types";

export type Locale = "en" | "ar";

// Arabic locale is pinned to Western (Latin) numerals via the `-u-nu-latn`
// extension — the convention in Gulf fintech products, where digits stay
// scannable/consistent across languages while labels and layout go RTL.
const localeMap: Record<Locale, string> = {
  en: "en-US",
  ar: "ar-SA-u-nu-latn",
};

export function formatCurrency(value: number, currency: Currency, locale: Locale = "en", opts: { compact?: boolean; signed?: boolean } = {}): string {
  const { compact = false, signed = false } = opts;
  const currencyCode = currency === "Other" ? "USD" : currency;
  const formatter = new Intl.NumberFormat(localeMap[locale], {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "code",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
    minimumFractionDigits: compact ? 0 : 0,
    signDisplay: signed ? "always" : "auto",
  });
  return formatter.format(value).replace(/ /g, " ");
}

export function formatNumber(value: number, locale: Locale = "en", digits = 0): string {
  return new Intl.NumberFormat(localeMap[locale], {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value: number, locale: Locale = "en", opts: { digits?: number; signed?: boolean } = {}): string {
  const { digits = 1, signed = true } = opts;
  const formatter = new Intl.NumberFormat(localeMap[locale], {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: signed ? "always" : "auto",
  });
  return formatter.format(value / 100);
}

export function formatCompactNumber(value: number, locale: Locale = "en"): string {
  return new Intl.NumberFormat(localeMap[locale], {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(iso: string, locale: Locale = "en", opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }): string {
  return new Intl.DateTimeFormat(localeMap[locale], opts).format(new Date(iso));
}

export function signClass(value: number): string {
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted-foreground";
}
