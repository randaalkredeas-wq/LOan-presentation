import { DateRangeKey, PortfolioSnapshot } from "@/types";

export const DATE_RANGE_KEYS: DateRangeKey[] = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "3Y", "CUSTOM"];

export function rangeToDays(key: DateRangeKey, referenceDate: Date): number {
  switch (key) {
    case "1D":
      return 1;
    case "1W":
      return 7;
    case "1M":
      return 30;
    case "3M":
      return 91;
    case "6M":
      return 182;
    case "YTD": {
      const start = new Date(Date.UTC(referenceDate.getUTCFullYear(), 0, 1));
      return Math.round((referenceDate.getTime() - start.getTime()) / 86400000);
    }
    case "1Y":
      return 365;
    case "3Y":
      return 365 * 3;
    default:
      return 365;
  }
}

export interface CustomRange {
  from: string;
  to: string;
}

export function filterSnapshotsByRange(
  snapshots: PortfolioSnapshot[],
  key: DateRangeKey,
  custom?: CustomRange
): PortfolioSnapshot[] {
  if (snapshots.length === 0) return [];
  const last = new Date(snapshots[snapshots.length - 1].date);

  if (key === "CUSTOM" && custom?.from && custom?.to) {
    const from = new Date(custom.from).getTime();
    const to = new Date(custom.to).getTime();
    return snapshots.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= from && t <= to;
    });
  }

  const days = rangeToDays(key, last);
  const cutoff = new Date(last);
  cutoff.setDate(cutoff.getDate() - days);
  return snapshots.filter((s) => new Date(s.date).getTime() >= cutoff.getTime());
}
