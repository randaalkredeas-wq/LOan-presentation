"use client";

import { useMemo } from "react";
import { usePortfolioRawData } from "./usePortfolioRawData";
import { useSettings } from "@/contexts/SettingsContext";
import { useDateRange } from "@/contexts/DateRangeContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { localizedName } from "@/utils/formatters";
import {
  PortfolioScope,
  enrichHoldings,
  computePortfolioTotals,
  computeAccountSummaries,
  convertSnapshots,
} from "@/calculations/portfolioCalculations";
import {
  annualizedVolatility,
  maxDrawdown,
  beta as computeBeta,
  valueAtRisk,
  conditionalValueAtRisk,
  diversificationScore,
  largestSingleAssetExposure,
  computeRiskScore,
  buildKRIs,
} from "@/calculations/riskCalculations";
import {
  sectorExposure,
  assetClassExposure,
  regionExposure,
  currencyExposure,
  platformExposure,
  computeSymbolOverlap,
  computeTrueSectorExposure,
  platformConcentrationCheck,
} from "@/calculations/exposureCalculations";
import { buildKPIs } from "@/calculations/kpiCalculations";
import { generateAlerts } from "@/calculations/alertsEngine";
import { filterSnapshotsByRange } from "@/utils/dateRange";
import { convertCurrency } from "@/data/fx";

export function usePortfolioAnalytics(scope?: PortfolioScope) {
  const raw = usePortfolioRawData();
  const { settings } = useSettings();
  const { range, customRange } = useDateRange();
  const { language } = useLanguage();

  const enrichedHoldings = useMemo(
    () => enrichHoldings(raw.holdings, raw.accounts, raw.platforms, settings.baseCurrency, scope, language),
    [raw.holdings, raw.accounts, raw.platforms, settings.baseCurrency, scope, language]
  );

  const filteredSnapshots = useMemo(
    () => convertSnapshots(filterSnapshotsByRange(raw.snapshots, range, customRange), settings.baseCurrency),
    [raw.snapshots, range, customRange, settings.baseCurrency]
  );

  const accountSummaries = useMemo(
    () => computeAccountSummaries(raw.accounts, raw.platforms, settings.baseCurrency),
    [raw.accounts, raw.platforms, settings.baseCurrency]
  );

  const todaysChange = useMemo(() => {
    if (raw.snapshots.length < 2) return 0;
    const last = raw.snapshots[raw.snapshots.length - 1];
    const prev = raw.snapshots[raw.snapshots.length - 2];
    return convertCurrency(last.totalValue - prev.totalValue, "SAR", settings.baseCurrency);
  }, [raw.snapshots, settings.baseCurrency]);

  const totals = useMemo(
    () => computePortfolioTotals(enrichedHoldings, raw.accounts, scope, todaysChange),
    [enrichedHoldings, raw.accounts, scope, todaysChange]
  );

  const benchmark = useMemo(
    () => raw.benchmarks.find((b) => b.id === settings.benchmarkId) ?? raw.benchmarks[0],
    [raw.benchmarks, settings.benchmarkId]
  );

  const maxDD = useMemo(() => maxDrawdown(raw.snapshots), [raw.snapshots]);
  const volatility = useMemo(() => annualizedVolatility(filteredSnapshots.length > 20 ? filteredSnapshots : raw.snapshots), [filteredSnapshots, raw.snapshots]);
  const betaVal = useMemo(() => (benchmark ? computeBeta(raw.snapshots, benchmark.series) : 1), [raw.snapshots, benchmark]);
  const varPct = useMemo(() => valueAtRisk(raw.snapshots), [raw.snapshots]);
  const cvarPct = useMemo(() => conditionalValueAtRisk(raw.snapshots), [raw.snapshots]);

  const diversification = useMemo(() => diversificationScore(enrichedHoldings), [enrichedHoldings]);
  const topSingleAsset = useMemo(() => largestSingleAssetExposure(enrichedHoldings), [enrichedHoldings]);

  const sectorExp = useMemo(() => sectorExposure(enrichedHoldings), [enrichedHoldings]);
  const trueSectorExp = useMemo(() => computeTrueSectorExposure(enrichedHoldings), [enrichedHoldings]);
  const assetClassExp = useMemo(() => assetClassExposure(enrichedHoldings), [enrichedHoldings]);
  const regionExp = useMemo(() => regionExposure(enrichedHoldings), [enrichedHoldings]);
  const currencyExp = useMemo(() => currencyExposure(enrichedHoldings), [enrichedHoldings]);
  const platformExp = useMemo(() => platformExposure(enrichedHoldings), [enrichedHoldings]);
  const platformConcentration = useMemo(
    () => platformConcentrationCheck(raw.accounts, raw.platforms, settings.riskLimits.maxPlatformExposurePct, language),
    [raw.accounts, raw.platforms, settings.riskLimits.maxPlatformExposurePct, language]
  );
  const overlaps = useMemo(() => computeSymbolOverlap(enrichedHoldings), [enrichedHoldings]);

  const liquidityRiskPct = useMemo(() => {
    const fundPct = assetClassExp.find((s) => s.key === "Fund")?.pct ?? 0;
    return fundPct;
  }, [assetClassExp]);

  const riskScore = useMemo(
    () =>
      computeRiskScore({
        volatility,
        maxDrawdownPct: maxDD,
        concentrationPct: topSingleAsset?.weightPct ?? 0,
        platformConcentrationPct: platformConcentration[0]?.pct ?? 0,
        diversification,
        liquidityRiskPct,
      }),
    [volatility, maxDD, topSingleAsset, platformConcentration, diversification, liquidityRiskPct]
  );

  const kris = useMemo(
    () =>
      buildKRIs({
        volatility,
        maxDrawdownPct: maxDD,
        beta: betaVal,
        varPct,
        cvarPct,
        singleAssetExposurePct: topSingleAsset?.weightPct ?? 0,
        sectorExposurePct: trueSectorExp.filter((s) => s.key !== "Cash")[0]?.pct ?? 0,
        platformExposurePct: platformConcentration[0]?.pct ?? 0,
        liquidityRiskPct,
        currencyExposurePct: currencyExp[0]?.pct ?? 0,
        diversification,
        limits: settings.riskLimits,
      }),
    [volatility, maxDD, betaVal, varPct, cvarPct, topSingleAsset, trueSectorExp, platformConcentration, liquidityRiskPct, currencyExp, diversification, settings.riskLimits]
  );

  const kpis = useMemo(
    () =>
      benchmark
        ? buildKPIs({
            snapshots: raw.snapshots,
            transactions: raw.transactions,
            totalPnl: totals.pnl,
            totalReturnPct: totals.returnPct,
            totalValue: totals.totalValue,
            benchmark,
            toBase: (currency) => convertCurrency(1, currency, settings.baseCurrency),
          })
        : [],
    [raw.snapshots, raw.transactions, totals, benchmark, settings.baseCurrency]
  );

  const alerts = useMemo(() => {
    const alphaKpi = kpis.find((k) => k.id === "alpha");
    return generateAlerts({
      today: raw.snapshots[raw.snapshots.length - 1]?.date ?? new Date().toISOString().slice(0, 10),
      maxDrawdownPct: maxDD,
      limits: settings.riskLimits,
      topSectorExposure: trueSectorExp.filter((s) => s.key !== "Cash")[0],
      topPlatformExposure: platformConcentration[0],
      topSingleAsset: topSingleAsset ?? undefined,
      topOverlap: overlaps[0],
      currencyExposure: currencyExp,
      alphaVsBenchmarkPct: alphaKpi?.currentValue ?? 0,
      benchmarkName: benchmark ? localizedName(benchmark, language) : "",
    });
  }, [raw.snapshots, maxDD, settings.riskLimits, trueSectorExp, platformConcentration, topSingleAsset, overlaps, currencyExp, kpis, benchmark, language]);

  return {
    ...raw,
    settings,
    scope,
    enrichedHoldings,
    filteredSnapshots,
    accountSummaries,
    totals,
    benchmark,
    maxDD,
    volatility,
    betaVal,
    varPct,
    cvarPct,
    diversification,
    topSingleAsset,
    sectorExp,
    trueSectorExp,
    assetClassExp,
    regionExp,
    currencyExp,
    platformExp,
    platformConcentration,
    overlaps,
    riskScore,
    kris,
    kpis,
    alerts,
  };
}
