import {
  Holding,
  InvestmentAccount,
  InvestmentPlatform,
  EnrichedHolding,
  Currency,
  PortfolioSnapshot,
} from "@/types";
import { getAsset } from "@/data/assets";
import { convertCurrency } from "@/data/fx";

/** Mock snapshots/benchmarks are generated natively in SAR terms. */
export const MOCK_DATA_NATIVE_CURRENCY: Currency = "SAR";

/** Converts a portfolio value time series into the selected base currency. */
export function convertSnapshots(snapshots: PortfolioSnapshot[], baseCurrency: Currency): PortfolioSnapshot[] {
  if (baseCurrency === MOCK_DATA_NATIVE_CURRENCY) return snapshots;
  return snapshots.map((s) => ({
    ...s,
    totalValue: convertCurrency(s.totalValue, MOCK_DATA_NATIVE_CURRENCY, baseCurrency),
    costBasis: convertCurrency(s.costBasis, MOCK_DATA_NATIVE_CURRENCY, baseCurrency),
    cashValue: convertCurrency(s.cashValue, MOCK_DATA_NATIVE_CURRENCY, baseCurrency),
  }));
}

export interface PortfolioScope {
  accountId?: string; // filter to a single account
  platformId?: string; // filter to a single platform (all its accounts)
}

export function scopeFilter(scope: PortfolioScope | undefined) {
  return (accountId: string, platformId: string): boolean => {
    if (!scope) return true;
    if (scope.accountId) return accountId === scope.accountId;
    if (scope.platformId) return platformId === scope.platformId;
    return true;
  };
}

/**
 * Enriches raw holdings with asset reference data, market values converted
 * to the base currency, P&L, return %, and portfolio weight %. This is the
 * single place the rest of the app reads consolidated holding data from.
 */
export function enrichHoldings(
  holdings: Holding[],
  accounts: InvestmentAccount[],
  platforms: InvestmentPlatform[],
  baseCurrency: Currency,
  scope?: PortfolioScope
): EnrichedHolding[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const platformMap = new Map(platforms.map((p) => [p.id, p]));
  const filter = scopeFilter(scope);

  const filtered = holdings.filter((h) => filter(h.accountId, h.platformId));

  const withValues = filtered.map((h) => {
    const asset = getAsset(h.symbol);
    const account = accountMap.get(h.accountId);
    const platform = platformMap.get(h.platformId);
    const marketValueNative = h.quantity * h.currentPrice;
    const costValueNative = h.quantity * h.averageCost;
    const marketValue = convertCurrency(marketValueNative, asset.currency, baseCurrency);
    const costValue = convertCurrency(costValueNative, asset.currency, baseCurrency);
    return {
      ...h,
      asset,
      platformName: platform?.name ?? "Unknown",
      accountName: account?.name ?? "Unknown",
      marketValue,
      costValue,
      pnl: marketValue - costValue,
      returnPct: costValue !== 0 ? ((marketValue - costValue) / costValue) * 100 : 0,
      weightPct: 0, // filled below once total is known
    } satisfies EnrichedHolding;
  });

  const total = withValues.reduce((sum, h) => sum + h.marketValue, 0);
  return withValues.map((h) => ({
    ...h,
    weightPct: total !== 0 ? (h.marketValue / total) * 100 : 0,
  }));
}

export interface PortfolioTotals {
  totalValue: number;
  costBasis: number;
  pnl: number;
  returnPct: number;
  cashValue: number;
  numHoldings: number;
  numAccounts: number;
  numPlatforms: number;
  todaysChange: number;
  todaysChangePct: number;
}

export function computePortfolioTotals(
  enriched: EnrichedHolding[],
  accounts: InvestmentAccount[],
  scope: PortfolioScope | undefined,
  todaysChange: number
): PortfolioTotals {
  const filter = scopeFilter(scope);
  const scopedAccounts = accounts.filter((a) => filter(a.id, a.platformId));
  const scopedPlatformIds = new Set(scopedAccounts.map((a) => a.platformId));

  const totalValue = enriched.reduce((s, h) => s + h.marketValue, 0);
  const costBasis = enriched.reduce((s, h) => s + h.costValue, 0);
  const cashValue = enriched
    .filter((h) => h.asset.assetClass === "Cash")
    .reduce((s, h) => s + h.marketValue, 0);

  return {
    totalValue,
    costBasis,
    pnl: totalValue - costBasis,
    returnPct: costBasis !== 0 ? ((totalValue - costBasis) / costBasis) * 100 : 0,
    cashValue,
    numHoldings: enriched.filter((h) => h.asset.assetClass !== "Cash").length,
    numAccounts: scopedAccounts.length,
    numPlatforms: scopedPlatformIds.size,
    todaysChange,
    todaysChangePct: totalValue - todaysChange !== 0 ? (todaysChange / (totalValue - todaysChange)) * 100 : 0,
  };
}

export interface AccountSummaryRow {
  account: InvestmentAccount;
  platform: InvestmentPlatform;
  valueBase: number;
  costBasisBase: number;
  pnl: number;
  returnPct: number;
  allocationPct: number;
}

export function computeAccountSummaries(
  accounts: InvestmentAccount[],
  platforms: InvestmentPlatform[],
  baseCurrency: Currency
): AccountSummaryRow[] {
  const platformMap = new Map(platforms.map((p) => [p.id, p]));
  const rows = accounts.map((account) => {
    const valueBase = convertCurrency(account.totalValue, account.currency, baseCurrency);
    const costBasisBase = convertCurrency(account.costBasis, account.currency, baseCurrency);
    return {
      account,
      platform: platformMap.get(account.platformId)!,
      valueBase,
      costBasisBase,
      pnl: valueBase - costBasisBase,
      returnPct: costBasisBase !== 0 ? ((valueBase - costBasisBase) / costBasisBase) * 100 : 0,
      allocationPct: 0,
    };
  });
  const total = rows.reduce((s, r) => s + r.valueBase, 0);
  return rows.map((r) => ({ ...r, allocationPct: total !== 0 ? (r.valueBase / total) * 100 : 0 }));
}
