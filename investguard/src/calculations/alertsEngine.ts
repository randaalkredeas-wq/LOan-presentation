import { RiskAlert, RiskLimit } from "@/types";
import { ExposureSlice, OverlapExposure } from "@/types";

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

function daysAgo(n: number, ref: string): string {
  const d = new Date(ref);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export interface AlertEngineInput {
  today: string;
  maxDrawdownPct: number; // negative
  limits: RiskLimit;
  topSectorExposure: ExposureSlice | undefined;
  topPlatformExposure: { platform: string; pct: number } | undefined;
  topSingleAsset: { symbol: string; name: string; weightPct: number } | undefined;
  topOverlap: OverlapExposure | undefined;
  currencyExposure: ExposureSlice[];
  alphaVsBenchmarkPct: number;
  benchmarkName: string;
}

export function generateAlerts(input: AlertEngineInput): RiskAlert[] {
  counter = 0;
  const alerts: RiskAlert[] = [];
  const { today } = input;

  if (input.topSingleAsset && input.topSingleAsset.weightPct > input.limits.maxSingleAssetExposurePct) {
    const critical = input.topSingleAsset.weightPct > input.limits.maxSingleAssetExposurePct * 1.3;
    alerts.push({
      id: nextId("alert"),
      severity: critical ? "critical" : "high",
      category: "Concentration",
      date: daysAgo(1, today),
      metricLabelKey: "kri.singleAssetExposure",
      currentValue: input.topSingleAsset.weightPct,
      threshold: input.limits.maxSingleAssetExposurePct,
      unit: "percent",
      descriptionKey: "alert.singleAssetExposure",
      descriptionParams: { symbol: input.topSingleAsset.symbol, value: input.topSingleAsset.weightPct.toFixed(1), limit: input.limits.maxSingleAssetExposurePct },
      status: "active",
    });
  }

  if (input.topOverlap && input.topOverlap.totalWeightPct > input.limits.maxSingleAssetExposurePct * 0.7) {
    alerts.push({
      id: nextId("alert"),
      severity: input.topOverlap.totalWeightPct > input.limits.maxSingleAssetExposurePct ? "critical" : "high",
      category: "Concentration",
      date: daysAgo(2, today),
      metricLabelKey: "kri.hiddenExposure",
      currentValue: input.topOverlap.totalWeightPct,
      threshold: input.limits.maxSingleAssetExposurePct,
      unit: "percent",
      descriptionKey: "alert.hiddenExposure",
      descriptionParams: { symbol: input.topOverlap.symbol, value: input.topOverlap.totalWeightPct.toFixed(1) },
      status: "active",
    });
  }

  if (input.topSectorExposure && input.topSectorExposure.pct > input.limits.maxSectorExposurePct) {
    alerts.push({
      id: nextId("alert"),
      severity: input.topSectorExposure.pct > input.limits.maxSectorExposurePct * 1.2 ? "high" : "warning",
      category: "Sector",
      date: daysAgo(3, today),
      metricLabelKey: "kri.sectorConcentration",
      currentValue: input.topSectorExposure.pct,
      threshold: input.limits.maxSectorExposurePct,
      unit: "percent",
      descriptionKey: "alert.sectorExposure",
      descriptionParams: { sector: input.topSectorExposure.label, value: input.topSectorExposure.pct.toFixed(1), limit: input.limits.maxSectorExposurePct },
      status: "active",
    });
  }

  if (input.topPlatformExposure && input.topPlatformExposure.pct > input.limits.maxPlatformExposurePct) {
    alerts.push({
      id: nextId("alert"),
      severity: "high",
      category: "Platform",
      date: daysAgo(4, today),
      metricLabelKey: "kri.platformConcentration",
      currentValue: input.topPlatformExposure.pct,
      threshold: input.limits.maxPlatformExposurePct,
      unit: "percent",
      descriptionKey: "alert.platformExposure",
      descriptionParams: { platform: input.topPlatformExposure.platform, value: input.topPlatformExposure.pct.toFixed(1), limit: input.limits.maxPlatformExposurePct },
      status: "active",
    });
  }

  const ddAbs = Math.abs(input.maxDrawdownPct);
  if (ddAbs > input.limits.maxDrawdownPct * 0.8) {
    const breached = ddAbs > input.limits.maxDrawdownPct;
    alerts.push({
      id: nextId("alert"),
      severity: breached ? "high" : "warning",
      category: "Drawdown",
      date: daysAgo(5, today),
      metricLabelKey: "kri.maxDrawdown",
      currentValue: ddAbs,
      threshold: input.limits.maxDrawdownPct,
      unit: "percent",
      descriptionKey: breached ? "alert.drawdownExceeded" : "alert.drawdownApproaching",
      descriptionParams: { value: ddAbs.toFixed(1), limit: input.limits.maxDrawdownPct },
      status: "active",
    });
  }

  const topCurrency = input.currencyExposure[0];
  if (topCurrency && topCurrency.pct > input.limits.maxCurrencyExposurePct) {
    alerts.push({
      id: nextId("alert"),
      severity: "warning",
      category: "Currency",
      date: daysAgo(6, today),
      metricLabelKey: "kri.currencyExposure",
      currentValue: topCurrency.pct,
      threshold: input.limits.maxCurrencyExposurePct,
      unit: "percent",
      descriptionKey: "alert.currencyExposure",
      descriptionParams: { currency: topCurrency.label, value: topCurrency.pct.toFixed(1), limit: input.limits.maxCurrencyExposurePct },
      status: "active",
    });
  }

  if (input.alphaVsBenchmarkPct > 1) {
    alerts.push({
      id: nextId("alert"),
      severity: "positive",
      category: "Performance",
      date: daysAgo(0, today),
      metricLabelKey: "kpi.alpha",
      currentValue: input.alphaVsBenchmarkPct,
      threshold: 0,
      unit: "percent",
      descriptionKey: "alert.outperformedBenchmark",
      descriptionParams: { value: input.alphaVsBenchmarkPct.toFixed(1), benchmark: input.benchmarkName },
      status: "active",
    });
  } else if (input.alphaVsBenchmarkPct < -1) {
    alerts.push({
      id: nextId("alert"),
      severity: "warning",
      category: "Performance",
      date: daysAgo(0, today),
      metricLabelKey: "kpi.alpha",
      currentValue: input.alphaVsBenchmarkPct,
      threshold: 0,
      unit: "percent",
      descriptionKey: "alert.underperformedBenchmark",
      descriptionParams: { value: Math.abs(input.alphaVsBenchmarkPct).toFixed(1), benchmark: input.benchmarkName },
      status: "active",
    });
  }

  return alerts.sort((a, b) => (a.date < b.date ? 1 : -1));
}
