import { resolvePeriod, type PeriodKey, type ResolvedPeriod } from "./periods";

const VALID_KEYS: PeriodKey[] = [
  "today", "this_week", "this_month", "last_month",
  "this_quarter", "last_quarter", "this_year", "last_year", "custom",
];

export function resolvePeriodFromParams(
  params: { period?: string; from?: string; to?: string },
  now: Date = new Date()
): { key: PeriodKey; resolved: ResolvedPeriod } {
  const key = VALID_KEYS.includes(params.period as PeriodKey) ? (params.period as PeriodKey) : "this_month";

  if (key === "custom" && params.from && params.to) {
    const resolved = resolvePeriod("custom", now, { start: new Date(params.from), end: new Date(params.to) });
    return { key, resolved };
  }
  return { key: key === "custom" ? "this_month" : key, resolved: resolvePeriod(key === "custom" ? "this_month" : key, now) };
}
