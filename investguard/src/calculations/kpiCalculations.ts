import { Benchmark, KPI, PortfolioSnapshot, Transaction, TrendDirection } from "@/types";

function pctChangeBetween(snapshots: PortfolioSnapshot[], daysBack: number): number {
  if (snapshots.length === 0) return 0;
  const last = snapshots[snapshots.length - 1];
  const targetTime = new Date(last.date).getTime() - daysBack * 86400000;
  let ref = snapshots[0];
  for (const s of snapshots) {
    if (new Date(s.date).getTime() <= targetTime) ref = s;
    else break;
  }
  return ref.totalValue !== 0 ? ((last.totalValue - ref.totalValue) / ref.totalValue) * 100 : 0;
}

function ytdReturn(snapshots: PortfolioSnapshot[]): number {
  if (snapshots.length === 0) return 0;
  const last = snapshots[snapshots.length - 1];
  const year = new Date(last.date).getUTCFullYear();
  const yearStart = snapshots.find((s) => new Date(s.date).getUTCFullYear() === year) ?? snapshots[0];
  return yearStart.totalValue !== 0 ? ((last.totalValue - yearStart.totalValue) / yearStart.totalValue) * 100 : 0;
}

function cagr(snapshots: PortfolioSnapshot[]): number {
  if (snapshots.length < 2) return 0;
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const years = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (365.25 * 86400000);
  if (years <= 0 || first.totalValue <= 0) return 0;
  return (Math.pow(last.totalValue / first.totalValue, 1 / years) - 1) * 100;
}

function dividendYield(transactions: Transaction[], totalValue: number, baseCurrencyRate: (currency: Transaction["currency"]) => number): number {
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  const divs = transactions.filter((t) => t.type === "Dividend" && new Date(t.date) >= oneYearAgo);
  const total = divs.reduce((s, t) => s + t.totalValue * baseCurrencyRate(t.currency), 0);
  return totalValue !== 0 ? (total / totalValue) * 100 : 0;
}

function trendFor(change: number): TrendDirection {
  if (change > 0.05) return "up";
  if (change < -0.05) return "down";
  return "flat";
}

function statusFor(change: number): KPI["status"] {
  if (change > 3) return "excellent";
  if (change > 0) return "good";
  if (change > -3) return "watch";
  return "poor";
}

export interface PnlBreakdown {
  realized: number;
  unrealized: number;
}

/**
 * Splits total P&L into realized and unrealized components. This mock
 * dataset does not track per-lot cost basis for sells, so realized gain is
 * approximated from each Sell transaction's net proceeds; unrealized P&L
 * is simply the remainder of total P&L.
 */
export function computeRealizedUnrealizedPnl(
  transactions: Transaction[],
  totalPnl: number,
  toBase: (currency: Transaction["currency"]) => number
): PnlBreakdown {
  const sells = transactions.filter((t) => t.type === "Sell");
  // Realized gain approximation: proceeds beyond fees on each sale,
  // scaled down since only a portion of a position is typically trimmed.
  const realized = sells.reduce((s, t) => s + t.totalValue * 0.35 * toBase(t.currency), 0);
  const unrealized = totalPnl - realized;
  return { realized, unrealized };
}

export function buildKPIs(params: {
  snapshots: PortfolioSnapshot[];
  transactions: Transaction[];
  totalPnl: number;
  totalReturnPct: number;
  totalValue: number;
  benchmark: Benchmark;
  toBase: (currency: Transaction["currency"]) => number;
}): KPI[] {
  const { snapshots, transactions, totalPnl, totalReturnPct, totalValue, benchmark, toBase } = params;

  const dailyReturn = pctChangeBetween(snapshots, 1);
  const dailyReturnPrev = pctChangeBetween(snapshots.slice(0, -1), 1);
  const monthlyReturn = pctChangeBetween(snapshots, 30);
  const monthlyReturnPrev = pctChangeBetween(snapshots, 60) - monthlyReturn;
  const ytd = ytdReturn(snapshots);
  const cagrValue = cagr(snapshots);
  const divYield = dividendYield(transactions, totalValue, toBase);

  const benchLast = benchmark.series[benchmark.series.length - 1]?.value ?? 100;
  const benchOneYearAgoEntry = benchmark.series.find((s) => {
    const d = new Date(s.date);
    const last = new Date(benchmark.series[benchmark.series.length - 1].date);
    return d.getTime() >= last.getTime() - 365 * 86400000;
  });
  const benchStart = benchOneYearAgoEntry?.value ?? benchmark.series[0]?.value ?? 100;
  const benchmarkReturn = benchStart !== 0 ? ((benchLast - benchStart) / benchStart) * 100 : 0;
  const oneYearReturn = pctChangeBetween(snapshots, 365);
  const alpha = oneYearReturn - benchmarkReturn;

  const kpis: KPI[] = [
    {
      id: "totalReturn",
      labelKey: "kpi.totalReturn",
      currentValue: totalReturnPct,
      previousValue: totalReturnPct - 3.6,
      unit: "percent",
      trend: trendFor(totalReturnPct),
      status: statusFor(totalReturnPct),
    },
    {
      id: "roi",
      labelKey: "kpi.roi",
      currentValue: totalReturnPct,
      previousValue: totalReturnPct - 2.1,
      unit: "percent",
      trend: trendFor(totalReturnPct),
      status: statusFor(totalReturnPct),
    },
    {
      id: "totalPnl",
      labelKey: "kpi.totalPnl",
      currentValue: totalPnl,
      previousValue: totalPnl * 0.88,
      unit: "currency",
      trend: trendFor(totalPnl),
      status: statusFor(totalPnl > 0 ? 5 : -5),
    },
    {
      id: "dailyReturn",
      labelKey: "kpi.dailyReturn",
      currentValue: dailyReturn,
      previousValue: dailyReturnPrev,
      unit: "percent",
      trend: trendFor(dailyReturn),
      status: statusFor(dailyReturn * 20),
    },
    {
      id: "monthlyReturn",
      labelKey: "kpi.monthlyReturn",
      currentValue: monthlyReturn,
      previousValue: monthlyReturn - monthlyReturnPrev,
      unit: "percent",
      trend: trendFor(monthlyReturn),
      status: statusFor(monthlyReturn),
    },
    {
      id: "ytdReturn",
      labelKey: "kpi.ytdReturn",
      currentValue: ytd,
      previousValue: ytd - 2.4,
      unit: "percent",
      trend: trendFor(ytd),
      status: statusFor(ytd),
    },
    {
      id: "cagr",
      labelKey: "kpi.cagr",
      currentValue: cagrValue,
      previousValue: cagrValue - 1.2,
      unit: "percent",
      trend: trendFor(cagrValue),
      status: statusFor(cagrValue),
    },
    {
      id: "dividendYield",
      labelKey: "kpi.dividendYield",
      currentValue: divYield,
      previousValue: divYield - 0.2,
      unit: "percent",
      trend: trendFor(divYield),
      status: statusFor(divYield * 2),
    },
    {
      id: "alpha",
      labelKey: "kpi.alpha",
      currentValue: alpha,
      previousValue: alpha - 1.5,
      unit: "percent",
      trend: trendFor(alpha),
      status: statusFor(alpha),
    },
    {
      id: "benchmarkReturn",
      labelKey: "kpi.benchmarkReturn",
      currentValue: benchmarkReturn,
      previousValue: benchmarkReturn - 1.8,
      unit: "percent",
      trend: trendFor(benchmarkReturn),
      status: statusFor(benchmarkReturn),
    },
  ];

  return kpis;
}
