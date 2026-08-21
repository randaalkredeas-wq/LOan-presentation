import { EnrichedHolding, KRI, PortfolioSnapshot, RiskMetric } from "@/types";

export function dailyReturns(snapshots: PortfolioSnapshot[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1].totalValue;
    const cur = snapshots[i].totalValue;
    if (prev > 0) out.push((cur - prev) / prev);
  }
  return out;
}

export function annualizedVolatility(snapshots: PortfolioSnapshot[]): number {
  const returns = dailyReturns(snapshots);
  if (returns.length < 2) return 0;
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  const dailyStd = Math.sqrt(variance);
  return dailyStd * Math.sqrt(252) * 100; // annualized, in %
}

export function maxDrawdown(snapshots: PortfolioSnapshot[]): number {
  let peak = -Infinity;
  let maxDd = 0;
  for (const s of snapshots) {
    peak = Math.max(peak, s.totalValue);
    const dd = peak > 0 ? (s.totalValue - peak) / peak : 0;
    maxDd = Math.min(maxDd, dd);
  }
  return maxDd * 100; // negative %
}

export function beta(portfolioSnapshots: PortfolioSnapshot[], benchmarkSeries: { date: string; value: number }[]): number {
  const benchMap = new Map(benchmarkSeries.map((b) => [b.date, b.value]));
  const pairs: { p: number; b: number }[] = [];
  for (let i = 1; i < portfolioSnapshots.length; i++) {
    const prevDate = portfolioSnapshots[i - 1].date;
    const curDate = portfolioSnapshots[i].date;
    const bPrev = benchMap.get(prevDate);
    const bCur = benchMap.get(curDate);
    if (bPrev === undefined || bCur === undefined || bPrev === 0) continue;
    const pPrev = portfolioSnapshots[i - 1].totalValue;
    const pCur = portfolioSnapshots[i].totalValue;
    if (pPrev === 0) continue;
    pairs.push({ p: (pCur - pPrev) / pPrev, b: (bCur - bPrev) / bPrev });
  }
  if (pairs.length < 2) return 1;
  const meanP = pairs.reduce((s, x) => s + x.p, 0) / pairs.length;
  const meanB = pairs.reduce((s, x) => s + x.b, 0) / pairs.length;
  let cov = 0;
  let varB = 0;
  for (const x of pairs) {
    cov += (x.p - meanP) * (x.b - meanB);
    varB += (x.b - meanB) ** 2;
  }
  return varB !== 0 ? cov / varB : 1;
}

/** Historical-simulation Value at Risk at the given confidence (e.g. 0.95). Returns a negative %. */
export function valueAtRisk(snapshots: PortfolioSnapshot[], confidence = 0.95): number {
  const returns = dailyReturns(snapshots).slice().sort((a, b) => a - b);
  if (returns.length === 0) return 0;
  const idx = Math.max(0, Math.floor((1 - confidence) * returns.length) - 1);
  return returns[Math.max(0, idx)] * 100;
}

/** Conditional VaR (Expected Shortfall): average of losses beyond the VaR cutoff. */
export function conditionalValueAtRisk(snapshots: PortfolioSnapshot[], confidence = 0.95): number {
  const returns = dailyReturns(snapshots).slice().sort((a, b) => a - b);
  if (returns.length === 0) return 0;
  const cutoffIdx = Math.max(1, Math.floor((1 - confidence) * returns.length));
  const tail = returns.slice(0, cutoffIdx);
  if (tail.length === 0) return returns[0] * 100;
  return (tail.reduce((s, r) => s + r, 0) / tail.length) * 100;
}

/** Herfindahl-Hirschman style concentration index (0-100) across a set of weights (%). */
export function concentrationIndex(weightsPct: number[]): number {
  const hhi = weightsPct.reduce((s, w) => s + (w / 100) ** 2, 0);
  return Math.min(100, hhi * 100);
}

export function largestSingleAssetExposure(holdings: EnrichedHolding[]): { symbol: string; name: string; weightPct: number } | null {
  const nonCash = holdings.filter((h) => h.asset.assetClass !== "Cash");
  if (nonCash.length === 0) return null;
  const top = nonCash.reduce((max, h) => (h.weightPct > max.weightPct ? h : max), nonCash[0]);
  return { symbol: top.symbol, name: top.asset.name, weightPct: top.weightPct };
}

export function diversificationScore(holdings: EnrichedHolding[]): number {
  const nonCash = holdings.filter((h) => h.asset.assetClass !== "Cash");
  if (nonCash.length === 0) return 0;
  const sectorWeights = new Map<string, number>();
  for (const h of nonCash) {
    sectorWeights.set(h.asset.sector, (sectorWeights.get(h.asset.sector) ?? 0) + h.weightPct);
  }
  const sectorHHI = concentrationIndex(Array.from(sectorWeights.values()));
  const assetHHI = concentrationIndex(nonCash.map((h) => h.weightPct));
  const countBonus = Math.min(20, nonCash.length * 1.2);
  const raw = 100 - (sectorHHI * 0.5 + assetHHI * 0.5) + countBonus * 0.15;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export interface RiskScoreBreakdown {
  overall: number; // 0-100, higher = riskier
  level: "Low" | "Moderate" | "High" | "Critical";
  categories: RiskMetric[];
}

export function computeRiskScore(params: {
  volatility: number; // annualized %
  maxDrawdownPct: number; // negative %
  concentrationPct: number; // largest single asset %
  platformConcentrationPct: number; // largest platform %
  diversification: number; // 0-100 (higher is better)
  liquidityRiskPct: number; // % illiquid-ish (funds) of portfolio
}): RiskScoreBreakdown {
  const volScore = Math.min(100, (params.volatility / 35) * 100);
  const ddScore = Math.min(100, (Math.abs(params.maxDrawdownPct) / 25) * 100);
  const concScore = Math.min(100, (params.concentrationPct / 40) * 100);
  const platformScore = Math.min(100, (params.platformConcentrationPct / 60) * 100);
  const diversificationScoreInverse = 100 - params.diversification;
  const liquidityScore = Math.min(100, params.liquidityRiskPct * 1.6);

  const categories: RiskMetric[] = [
    { id: "market", category: "Market Risk", score: volScore, weight: 0.22 },
    { id: "concentration", category: "Concentration Risk", score: concScore, weight: 0.2 },
    { id: "volatility", category: "Volatility", score: volScore, weight: 0.15 },
    { id: "drawdown", category: "Drawdown", score: ddScore, weight: 0.18 },
    { id: "liquidity", category: "Liquidity", score: liquidityScore, weight: 0.07 },
    { id: "diversification", category: "Diversification", score: diversificationScoreInverse, weight: 0.1 },
    { id: "platform", category: "Platform Exposure", score: platformScore, weight: 0.08 },
  ];

  const overall = Math.round(categories.reduce((s, c) => s + c.score * c.weight, 0));
  const level = overall <= 30 ? "Low" : overall <= 60 ? "Moderate" : overall <= 80 ? "High" : "Critical";
  return { overall: Math.max(0, Math.min(100, overall)), level, categories };
}

export function buildKRIs(params: {
  volatility: number;
  maxDrawdownPct: number;
  beta: number;
  varPct: number;
  cvarPct: number;
  singleAssetExposurePct: number;
  sectorExposurePct: number;
  platformExposurePct: number;
  liquidityRiskPct: number;
  currencyExposurePct: number;
  diversification: number;
  limits: {
    maxSingleAssetExposurePct: number;
    maxSectorExposurePct: number;
    maxPlatformExposurePct: number;
    maxDrawdownPct: number;
    maxCurrencyExposurePct: number;
  };
}): KRI[] {
  const status = (value: number, limit: number, invert = false): KRI["status"] => {
    const ratio = invert ? limit / Math.max(value, 0.0001) : value / Math.max(limit, 0.0001);
    if (ratio >= 1.3) return "critical";
    if (ratio >= 1.0) return "high";
    if (ratio >= 0.75) return "moderate";
    return "low";
  };

  return [
    {
      id: "volatility",
      labelKey: "kri.volatility",
      currentValue: params.volatility,
      limit: 25,
      unit: "percent",
      status: status(params.volatility, 25),
      trend: params.volatility > 18 ? "up" : "flat",
    },
    {
      id: "maxDrawdown",
      labelKey: "kri.maxDrawdown",
      currentValue: Math.abs(params.maxDrawdownPct),
      limit: params.limits.maxDrawdownPct,
      unit: "percent",
      status: status(Math.abs(params.maxDrawdownPct), params.limits.maxDrawdownPct),
      trend: "down",
    },
    {
      id: "beta",
      labelKey: "kri.beta",
      currentValue: params.beta,
      limit: 1.3,
      unit: "ratio",
      status: status(params.beta, 1.3),
      trend: params.beta > 1 ? "up" : "flat",
    },
    {
      id: "var",
      labelKey: "kri.var",
      currentValue: Math.abs(params.varPct),
      limit: 5,
      unit: "percent",
      status: status(Math.abs(params.varPct), 5),
      trend: "flat",
    },
    {
      id: "cvar",
      labelKey: "kri.cvar",
      currentValue: Math.abs(params.cvarPct),
      limit: 7,
      unit: "percent",
      status: status(Math.abs(params.cvarPct), 7),
      trend: "flat",
    },
    {
      id: "singleAsset",
      labelKey: "kri.singleAssetExposure",
      currentValue: params.singleAssetExposurePct,
      limit: params.limits.maxSingleAssetExposurePct,
      unit: "percent",
      status: status(params.singleAssetExposurePct, params.limits.maxSingleAssetExposurePct),
      trend: "up",
    },
    {
      id: "sectorConcentration",
      labelKey: "kri.sectorConcentration",
      currentValue: params.sectorExposurePct,
      limit: params.limits.maxSectorExposurePct,
      unit: "percent",
      status: status(params.sectorExposurePct, params.limits.maxSectorExposurePct),
      trend: "up",
    },
    {
      id: "platformConcentration",
      labelKey: "kri.platformConcentration",
      currentValue: params.platformExposurePct,
      limit: params.limits.maxPlatformExposurePct,
      unit: "percent",
      status: status(params.platformExposurePct, params.limits.maxPlatformExposurePct),
      trend: "flat",
    },
    {
      id: "liquidity",
      labelKey: "kri.liquidityRisk",
      currentValue: params.liquidityRiskPct,
      limit: 35,
      unit: "percent",
      status: status(params.liquidityRiskPct, 35),
      trend: "flat",
    },
    {
      id: "currencyExposure",
      labelKey: "kri.currencyExposure",
      currentValue: params.currencyExposurePct,
      limit: params.limits.maxCurrencyExposurePct,
      unit: "percent",
      status: status(params.currencyExposurePct, params.limits.maxCurrencyExposurePct),
      trend: "flat",
    },
    {
      id: "diversification",
      labelKey: "kri.diversificationScore",
      currentValue: params.diversification,
      limit: 60,
      unit: "score",
      status: status(params.diversification, 60, true),
      trend: params.diversification > 60 ? "up" : "down",
    },
  ];
}
