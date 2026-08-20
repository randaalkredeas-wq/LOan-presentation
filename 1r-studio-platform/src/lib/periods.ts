// Date Comparison Engine — resolves named/custom periods and their "previous equivalent period".
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, startOfYear, endOfYear,
  subDays, subMonths, subQuarters, subYears, differenceInCalendarDays, addDays,
} from "date-fns";

export type PeriodKey =
  | "today" | "this_week" | "this_month" | "last_month"
  | "this_quarter" | "last_quarter" | "this_year" | "last_year" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ResolvedPeriod {
  key: PeriodKey;
  current: DateRange;
  previous: DateRange; // previous equivalent period, for growth/comparison calculations
}

const WEEK_OPTS = { weekStartsOn: 6 as const }; // Saturday-start week (common in Saudi Arabia)

export function resolvePeriod(key: PeriodKey, now: Date, custom?: DateRange): ResolvedPeriod {
  switch (key) {
    case "today": {
      const current = { start: startOfDay(now), end: endOfDay(now) };
      const prevDay = subDays(now, 1);
      return { key, current, previous: { start: startOfDay(prevDay), end: endOfDay(prevDay) } };
    }
    case "this_week": {
      const current = { start: startOfWeek(now, WEEK_OPTS), end: endOfWeek(now, WEEK_OPTS) };
      const prevRef = subDays(now, 7);
      return { key, current, previous: { start: startOfWeek(prevRef, WEEK_OPTS), end: endOfWeek(prevRef, WEEK_OPTS) } };
    }
    case "this_month": {
      const current = { start: startOfMonth(now), end: endOfMonth(now) };
      const prevRef = subMonths(now, 1);
      return { key, current, previous: { start: startOfMonth(prevRef), end: endOfMonth(prevRef) } };
    }
    case "last_month": {
      const ref = subMonths(now, 1);
      const current = { start: startOfMonth(ref), end: endOfMonth(ref) };
      const prevRef = subMonths(ref, 1);
      return { key, current, previous: { start: startOfMonth(prevRef), end: endOfMonth(prevRef) } };
    }
    case "this_quarter": {
      const current = { start: startOfQuarter(now), end: endOfQuarter(now) };
      const prevRef = subQuarters(now, 1);
      return { key, current, previous: { start: startOfQuarter(prevRef), end: endOfQuarter(prevRef) } };
    }
    case "last_quarter": {
      const ref = subQuarters(now, 1);
      const current = { start: startOfQuarter(ref), end: endOfQuarter(ref) };
      const prevRef = subQuarters(ref, 1);
      return { key, current, previous: { start: startOfQuarter(prevRef), end: endOfQuarter(prevRef) } };
    }
    case "this_year": {
      const current = { start: startOfYear(now), end: endOfYear(now) };
      const prevRef = subYears(now, 1);
      return { key, current, previous: { start: startOfYear(prevRef), end: endOfYear(prevRef) } };
    }
    case "last_year": {
      const ref = subYears(now, 1);
      const current = { start: startOfYear(ref), end: endOfYear(ref) };
      const prevRef = subYears(ref, 1);
      return { key, current, previous: { start: startOfYear(prevRef), end: endOfYear(prevRef) } };
    }
    case "custom": {
      if (!custom) throw new Error("custom period requires a date range");
      const current = { start: startOfDay(custom.start), end: endOfDay(custom.end) };
      const lengthDays = differenceInCalendarDays(current.end, current.start) + 1;
      const prevEnd = subDays(current.start, 1);
      const prevStart = subDays(prevEnd, lengthDays - 1);
      return { key, current, previous: { start: startOfDay(prevStart), end: endOfDay(prevEnd) } };
    }
  }
}

export function growthPercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export type Trend = "up" | "down" | "flat";
export function trendOf(current: number, previous: number): Trend {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

/** Rolling N-month buckets ending at `now`, oldest first — used for KRI/sales trend charts. */
export function lastNMonths(now: Date, n: number): DateRange[] {
  const out: DateRange[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const ref = subMonths(now, i);
    out.push({ start: startOfMonth(ref), end: endOfMonth(ref) });
  }
  return out;
}

export function monthLabel(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export { addDays };
