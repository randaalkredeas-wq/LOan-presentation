import { Currency, FxRate } from "@/types";

/**
 * Mock FX rates to base currency SAR. In a real integration this would be
 * fetched from a market data provider on an interval and cached.
 */
export const FX_RATES: FxRate[] = [
  { currency: "SAR", rateToBase: 1 },
  { currency: "USD", rateToBase: 3.75 },
  { currency: "EUR", rateToBase: 4.06 },
  { currency: "GBP", rateToBase: 4.75 },
  { currency: "Other", rateToBase: 1 },
];

export function getFxRate(currency: Currency): number {
  return FX_RATES.find((r) => r.currency === currency)?.rateToBase ?? 1;
}

/** @deprecated Prefer `convertCurrency`, which supports a configurable target/base currency. */
export function toBaseCurrency(amount: number, currency: Currency): number {
  return amount * getFxRate(currency);
}

/** Converts an amount from one currency to another via their SAR cross-rates. */
export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  return (amount * getFxRate(from)) / getFxRate(to);
}
