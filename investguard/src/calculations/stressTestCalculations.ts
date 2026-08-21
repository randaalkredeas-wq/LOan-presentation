import { EnrichedHolding, StressScenario, StressTestResult } from "@/types";

export const PRESET_MARKET_SHOCKS: StressScenario[] = [
  { id: "market-5", nameKey: "stress.marketShock5", kind: "market", shockPct: -5 },
  { id: "market-10", nameKey: "stress.marketShock10", kind: "market", shockPct: -10 },
  { id: "market-20", nameKey: "stress.marketShock20", kind: "market", shockPct: -20 },
  { id: "market-30", nameKey: "stress.marketShock30", kind: "market", shockPct: -30 },
];

export const PRESET_SECTOR_SHOCKS: StressScenario[] = [
  { id: "sector-tech", nameKey: "stress.sectorTech", kind: "sector", shockPct: -15, sector: "Technology" },
  { id: "sector-financials", nameKey: "stress.sectorFinancials", kind: "sector", shockPct: -15, sector: "Financials" },
  { id: "sector-energy", nameKey: "stress.sectorEnergy", kind: "sector", shockPct: -20, sector: "Energy" },
];

/**
 * Applies a shock scenario to the current consolidated holdings and
 * estimates the resulting portfolio loss / value. Market shocks apply
 * uniformly to non-cash holdings; sector/custom shocks apply only to the
 * matching sector or symbol (including ETF/Fund look-through weight).
 */
export function runStressTest(holdings: EnrichedHolding[], scenario: StressScenario): StressTestResult {
  const totalValue = holdings.reduce((s, h) => s + h.marketValue, 0);
  const contributions: { symbol: string; name: string; loss: number }[] = [];

  for (const h of holdings) {
    if (h.asset.assetClass === "Cash") continue;

    let exposureFraction = 0; // fraction of this holding's value exposed to the shock
    if (scenario.kind === "market") {
      exposureFraction = 1;
    } else if (scenario.kind === "sector" && scenario.sector) {
      if (h.asset.sector === scenario.sector) {
        exposureFraction = 1;
      } else if (h.asset.underlying) {
        exposureFraction = h.asset.underlying
          .filter((u) => u.sector === scenario.sector)
          .reduce((s, u) => s + u.weightPct / 100, 0);
      }
    } else if (scenario.kind === "custom") {
      if (scenario.symbol && h.asset.symbol === scenario.symbol) {
        exposureFraction = 1;
      } else if (scenario.sector) {
        if (h.asset.sector === scenario.sector) exposureFraction = 1;
        else if (h.asset.underlying) {
          exposureFraction = h.asset.underlying
            .filter((u) => u.sector === scenario.sector)
            .reduce((s, u) => s + u.weightPct / 100, 0);
        }
      }
    }

    if (exposureFraction > 0) {
      const loss = h.marketValue * exposureFraction * (scenario.shockPct / 100);
      if (loss !== 0) contributions.push({ symbol: h.symbol, name: h.asset.name, loss });
    }
  }

  const estimatedLoss = contributions.reduce((s, c) => s + c.loss, 0);
  const estimatedPortfolioValue = totalValue + estimatedLoss;
  const impactPct = totalValue !== 0 ? (estimatedLoss / totalValue) * 100 : 0;

  const topContributors = contributions
    .sort((a, b) => a.loss - b.loss)
    .slice(0, 5);

  return { scenario, estimatedLoss, estimatedPortfolioValue, impactPct, topContributors };
}
