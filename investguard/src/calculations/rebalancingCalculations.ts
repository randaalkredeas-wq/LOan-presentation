import { EnrichedHolding, TargetAllocation } from "@/types";
import { computeTrueSectorExposure } from "./exposureCalculations";

export interface RebalancingRow {
  sector: string;
  targetPct: number;
  actualPct: number;
  driftPct: number; // actual - target
  status: "onTarget" | "overweight" | "underweight";
}

const ON_TARGET_TOLERANCE = 2; // +/- 2% is considered on target

export function computeRebalancing(holdings: EnrichedHolding[], targets: TargetAllocation[]): RebalancingRow[] {
  const actual = computeTrueSectorExposure(holdings);
  const actualMap = new Map(actual.map((a) => [a.key, a.pct]));

  const rows: RebalancingRow[] = targets.map((t) => {
    const actualPct = actualMap.get(t.sector) ?? 0;
    const driftPct = actualPct - t.targetPct;
    const status: RebalancingRow["status"] =
      Math.abs(driftPct) <= ON_TARGET_TOLERANCE ? "onTarget" : driftPct > 0 ? "overweight" : "underweight";
    return { sector: t.sector, targetPct: t.targetPct, actualPct, driftPct, status };
  });

  // Include any sector with meaningful actual allocation that has no explicit target.
  for (const a of actual) {
    if (!targets.some((t) => t.sector === a.key) && a.pct > 1) {
      rows.push({ sector: a.key, targetPct: 0, actualPct: a.pct, driftPct: a.pct, status: "overweight" });
    }
  }

  return rows.sort((a, b) => Math.abs(b.driftPct) - Math.abs(a.driftPct));
}
