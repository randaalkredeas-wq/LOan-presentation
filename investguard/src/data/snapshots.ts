import { PortfolioSnapshot, Benchmark } from "@/types";
import { mulberry32, hashSeed } from "./seedRandom";

const TODAY = new Date("2026-08-21T00:00:00Z");
const DAYS = 3 * 365; // 3 years of daily history, satisfies the 3Y date filter
const END_VALUE = 250430;
const END_COST_BASIS = 220000;
const START_COST_BASIS = 96000; // portfolio grew via deposits over the 3-year window
const YESTERDAY_VALUE = END_VALUE - 1240; // "Today's Change" = +SAR 1,240
const DRAWDOWN_WINDOW: [number, number] = [Math.round(DAYS * 0.42), Math.round(DAYS * 0.5)];
const DRAWDOWN_DEPTH = 0.09; // shared market correction depth

function dateAt(offsetFromEnd: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - offsetFromEnd);
  return d.toISOString().slice(0, 10);
}

/**
 * A single shared "market factor" daily-return series (with one broad
 * correction baked in) that every portfolio/benchmark series partially
 * tracks. This gives the mock data a realistic, non-zero correlation
 * structure so Beta comes out plausible instead of ~0.
 */
function buildMarketFactor(days: number): number[] {
  const rand = mulberry32(hashSeed("investguard-market-factor"));
  const returns: number[] = [];
  for (let i = 1; i <= days; i++) {
    const inDrawdown = i >= DRAWDOWN_WINDOW[0] && i <= DRAWDOWN_WINDOW[1];
    let drift = 0.00025;
    if (inDrawdown) {
      const span = DRAWDOWN_WINDOW[1] - DRAWDOWN_WINDOW[0];
      const mid = DRAWDOWN_WINDOW[0] + span * 0.55;
      drift = i < mid ? -DRAWDOWN_DEPTH / (span * 0.55) : DRAWDOWN_DEPTH / (span * 0.45);
    }
    returns.push(drift + (rand() - 0.5) * 2 * 0.006);
  }
  return returns;
}

const MARKET_FACTOR = buildMarketFactor(DAYS);

/**
 * Builds a daily index series (base 1.0) that partially tracks the shared
 * market factor (`factorBeta`) plus its own idiosyncratic drift/noise, then
 * optionally rescales so the series ends at exactly `endValue`.
 */
function buildIndexSeries(seed: number, days: number, drift: number, idioVol: number, factorBeta: number): number[] {
  const rand = mulberry32(seed);
  const values: number[] = [1];
  for (let i = 1; i <= days; i++) {
    const idiosyncratic = (rand() - 0.5) * 2 * idioVol;
    const ret = drift + factorBeta * MARKET_FACTOR[i - 1] + idiosyncratic;
    values.push(values[i - 1] * (1 + ret));
  }
  return values;
}

function rescaleToEnd(values: number[], endValue: number): number[] {
  const factor = endValue / values[values.length - 1];
  return values.map((v) => v * factor);
}

const portfolioIndex = rescaleToEnd(
  buildIndexSeries(hashSeed("investguard-portfolio"), DAYS, 0.00018, 0.0042, 0.75),
  END_VALUE
);

function buildCostBasisSeries(days: number): number[] {
  // Roughly step-wise growth driven by periodic deposits, smoothed.
  const series: number[] = [];
  for (let i = 0; i <= days; i++) {
    const t = i / days;
    const eased = 1 - Math.pow(1 - t, 1.6);
    series.push(START_COST_BASIS + (END_COST_BASIS - START_COST_BASIS) * eased);
  }
  return series;
}
const costBasisSeries = buildCostBasisSeries(DAYS);

export const PORTFOLIO_SNAPSHOTS: PortfolioSnapshot[] = portfolioIndex.map((value, i) => {
  const offsetFromEnd = DAYS - i;
  let totalValue = Math.round(value * 100) / 100;
  if (offsetFromEnd === 1) totalValue = YESTERDAY_VALUE;
  if (offsetFromEnd === 0) totalValue = END_VALUE;
  return {
    date: dateAt(offsetFromEnd),
    totalValue,
    costBasis: Math.round(costBasisSeries[i] * 100) / 100,
    cashValue: Math.round((totalValue * 0.032 + (i % 17)) * 100) / 100,
  };
});

function buildBenchmark(
  id: string,
  name: string,
  nameAr: string,
  region: Benchmark["region"],
  seedKey: string,
  drift: number,
  idioVol: number,
  factorBeta: number
): Benchmark {
  const idx = buildIndexSeries(hashSeed(seedKey), DAYS, drift, idioVol, factorBeta);
  const series = idx.map((v, i) => ({ date: dateAt(DAYS - i), value: Math.round(v * 10000) / 100 }));
  return { id, name, nameAr, region, series };
}

export const BENCHMARKS: Benchmark[] = [
  buildBenchmark("tasi", "Tadawul All Share (TASI)", "مؤشر تداول العام", "Saudi Arabia", "bench-tasi", 0.00005, 0.0055, 0.95),
  buildBenchmark("sp500", "S&P 500", "ستاندرد آند بورز 500", "USA", "bench-sp500", 0.00012, 0.005, 1.05),
  buildBenchmark("nasdaq100", "NASDAQ 100", "ناسداك 100", "USA", "bench-nasdaq100", 0.00015, 0.0075, 1.2),
  buildBenchmark("msciworld", "MSCI World", "إم إس سي آي وورلد", "Global", "bench-msciworld", 0.0001, 0.0042, 1.0),
];

export function getBenchmark(id: string): Benchmark {
  return BENCHMARKS.find((b) => b.id === id) ?? BENCHMARKS[0];
}
