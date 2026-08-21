import { EnrichedHolding, RiskLevel } from "@/types";
import { AccountSummaryRow } from "./portfolioCalculations";

export interface RiskReturnPoint {
  id: string;
  label: string;
  group: "Holding" | "Account" | "Asset Class";
  riskScore: number; // 0-100 (x-axis)
  returnPct: number; // (y-axis)
  size: number; // bubble size = market value
  riskLevel: RiskLevel;
}

const riskLevelScore: Record<RiskLevel, number> = { Low: 20, Medium: 48, High: 75, Critical: 92 };

export function holdingsToRiskReturnPoints(holdings: EnrichedHolding[]): RiskReturnPoint[] {
  return holdings
    .filter((h) => h.asset.assetClass !== "Cash")
    .map((h) => ({
      id: h.id,
      label: h.symbol,
      group: "Holding" as const,
      riskScore: riskLevelScore[h.asset.riskLevel],
      returnPct: h.returnPct,
      size: h.marketValue,
      riskLevel: h.asset.riskLevel,
    }));
}

export function accountsToRiskReturnPoints(accounts: AccountSummaryRow[]): RiskReturnPoint[] {
  return accounts.map((a) => ({
    id: a.account.id,
    label: a.account.name,
    group: "Account" as const,
    riskScore: a.account.riskScore,
    returnPct: a.returnPct,
    size: a.valueBase,
    riskLevel: a.account.riskLevel,
  }));
}

export function assetClassToRiskReturnPoints(holdings: EnrichedHolding[]): RiskReturnPoint[] {
  const groups = new Map<string, { value: number; cost: number; riskLevel: RiskLevel }>();
  for (const h of holdings) {
    const key = h.asset.assetClass;
    const g = groups.get(key) ?? { value: 0, cost: 0, riskLevel: h.asset.riskLevel };
    g.value += h.marketValue;
    g.cost += h.costValue;
    groups.set(key, g);
  }
  return Array.from(groups.entries()).map(([key, g]) => ({
    id: key,
    label: key,
    group: "Asset Class" as const,
    riskScore: riskLevelScore[g.riskLevel],
    returnPct: g.cost !== 0 ? ((g.value - g.cost) / g.cost) * 100 : 0,
    size: g.value,
    riskLevel: g.riskLevel,
  }));
}
