import { EnrichedHolding, ExposureSlice, OverlapExposure, InvestmentAccount, InvestmentPlatform } from "@/types";
import { toBaseCurrency } from "@/data/fx";
import { Locale, localizedName } from "@/utils/formatters";

function groupBy(
  holdings: EnrichedHolding[],
  keyFn: (h: EnrichedHolding) => string
): ExposureSlice[] {
  const totals = new Map<string, number>();
  let grand = 0;
  for (const h of holdings) {
    const key = keyFn(h);
    totals.set(key, (totals.get(key) ?? 0) + h.marketValue);
    grand += h.marketValue;
  }
  return Array.from(totals.entries())
    .map(([key, value]) => ({ key, label: key, value, pct: grand !== 0 ? (value / grand) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function sectorExposure(holdings: EnrichedHolding[]): ExposureSlice[] {
  return groupBy(holdings, (h) => h.asset.sector);
}

export function assetClassExposure(holdings: EnrichedHolding[]): ExposureSlice[] {
  return groupBy(holdings, (h) => h.asset.assetClass);
}

export function regionExposure(holdings: EnrichedHolding[]): ExposureSlice[] {
  return groupBy(holdings, (h) => h.asset.region);
}

export function currencyExposure(holdings: EnrichedHolding[]): ExposureSlice[] {
  return groupBy(holdings, (h) => h.asset.currency);
}

export function platformExposure(holdings: EnrichedHolding[]): ExposureSlice[] {
  return groupBy(holdings, (h) => h.platformName);
}

export function accountExposure(holdings: EnrichedHolding[]): ExposureSlice[] {
  return groupBy(holdings, (h) => h.accountName);
}

/**
 * Hidden Exposure / Overlap Analysis — computes TRUE consolidated exposure
 * to an underlying symbol by combining direct holdings of that symbol with
 * look-through exposure via ETFs/Funds that hold it internally.
 */
export function computeSymbolOverlap(holdings: EnrichedHolding[]): OverlapExposure[] {
  const totalPortfolio = holdings.reduce((s, h) => s + h.marketValue, 0);
  if (totalPortfolio === 0) return [];

  const bySymbol = new Map<string, OverlapExposure>();

  const add = (
    symbol: string,
    name: string,
    weightPct: number,
    accountName: string,
    platformName: string,
    direct: boolean
  ) => {
    const existing = bySymbol.get(symbol);
    const entry: OverlapExposure = existing ?? { symbol, name, totalWeightPct: 0, sources: [] };
    entry.totalWeightPct += weightPct;
    entry.sources.push({ accountName, platformName, weightPct, direct });
    bySymbol.set(symbol, entry);
  };

  for (const h of holdings) {
    if (h.asset.assetClass === "Cash") continue;
    // Direct holding contribution
    add(h.asset.symbol, h.asset.name, h.weightPct, h.accountName, h.platformName, true);

    // Look-through contribution for ETFs / Funds
    if (h.asset.underlying) {
      for (const u of h.asset.underlying) {
        if (u.symbol.startsWith("OTHER") || u.symbol.startsWith("SA-SUKUK") || u.symbol.startsWith("GCC-SUKUK")) continue;
        const contributionPct = h.weightPct * (u.weightPct / 100);
        add(u.symbol, u.name, contributionPct, h.accountName, h.platformName, false);
      }
    }
  }

  return Array.from(bySymbol.values())
    .filter((e) => e.sources.length > 1 || e.sources.some((s) => !s.direct))
    .sort((a, b) => b.totalWeightPct - a.totalWeightPct);
}

/** True consolidated sector exposure including ETF/Fund look-through. */
export function computeTrueSectorExposure(holdings: EnrichedHolding[]): ExposureSlice[] {
  const totals = new Map<string, number>();
  let grand = 0;
  for (const h of holdings) {
    if (h.asset.assetClass === "Cash") {
      totals.set("Cash", (totals.get("Cash") ?? 0) + h.marketValue);
      grand += h.marketValue;
      continue;
    }
    if (h.asset.underlying) {
      for (const u of h.asset.underlying) {
        const value = h.marketValue * (u.weightPct / 100);
        totals.set(u.sector, (totals.get(u.sector) ?? 0) + value);
      }
      grand += h.marketValue;
    } else {
      totals.set(h.asset.sector, (totals.get(h.asset.sector) ?? 0) + h.marketValue);
      grand += h.marketValue;
    }
  }
  return Array.from(totals.entries())
    .map(([key, value]) => ({ key, label: key, value, pct: grand !== 0 ? (value / grand) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function platformConcentrationCheck(
  accounts: InvestmentAccount[],
  platforms: InvestmentPlatform[],
  maxPct: number,
  locale: Locale = "en"
): { platform: string; pct: number; breach: boolean }[] {
  const totals = new Map<string, number>();
  let grand = 0;
  for (const a of accounts) {
    const platform = platforms.find((p) => p.id === a.platformId);
    const name = platform ? localizedName(platform, locale) : "Unknown";
    const valueBase = toBaseCurrency(a.totalValue, a.currency);
    totals.set(name, (totals.get(name) ?? 0) + valueBase);
    grand += valueBase;
  }
  return Array.from(totals.entries())
    .map(([platform, value]) => ({ platform, pct: grand !== 0 ? (value / grand) * 100 : 0, breach: false }))
    .map((row) => ({ ...row, breach: row.pct > maxPct }))
    .sort((a, b) => b.pct - a.pct);
}
