import { Transaction, TransactionType } from "@/types";
import { HOLDINGS } from "./holdings";
import { ACCOUNTS } from "./accounts";
import { getAsset } from "./assets";

/**
 * Transaction history is generated deterministically from the current
 * holdings so it stays internally consistent (two buy tranches per
 * position, staggered in time), then augmented with realistic dividends,
 * account funding deposits, fees and a couple of rebalancing sells.
 */
function daysAfter(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildBuyTranches(): Transaction[] {
  const txns: Transaction[] = [];
  for (const h of HOLDINGS) {
    const asset = getAsset(h.symbol);
    if (asset.assetClass === "Cash") continue;
    const account = ACCOUNTS.find((a) => a.id === h.accountId)!;
    // Split the position into an early 60% tranche and a later 40% tranche,
    // choosing tranche prices so the blended average matches averageCost.
    const q1 = Math.round(h.quantity * 0.6 * 100) / 100;
    const q2 = Math.round((h.quantity - q1) * 100) / 100;
    const p1 = Math.round(h.averageCost * 0.9 * 100) / 100;
    const p2 = q2 !== 0 ? Math.round(((h.averageCost * h.quantity - p1 * q1) / q2) * 100) / 100 : p1;
    const fee1 = Math.round(q1 * p1 * 0.001 * 100) / 100;
    const fee2 = Math.round(q2 * p2 * 0.001 * 100) / 100;
    const startOffset = 40 + Math.abs(h.symbol.charCodeAt(0) * 3) % 200;
    txns.push({
      id: `txn-${h.id}-1`,
      date: daysAfter(account.openedDate, startOffset),
      platformId: h.platformId,
      accountId: h.accountId,
      symbol: h.symbol,
      type: "Buy",
      quantity: q1,
      price: p1,
      fees: fee1,
      totalValue: -(q1 * p1 + fee1),
      currency: account.currency,
    });
    if (q2 > 0) {
      txns.push({
        id: `txn-${h.id}-2`,
        date: daysAfter(account.openedDate, startOffset + 140),
        platformId: h.platformId,
        accountId: h.accountId,
        symbol: h.symbol,
        type: "Buy",
        quantity: q2,
        price: p2,
        fees: fee2,
        totalValue: -(q2 * p2 + fee2),
        currency: account.currency,
      });
    }
  }
  return txns;
}

// Each account's cost basis is funded via an opening deposit plus one
// later top-up, so the sum of deposits reconciles exactly with the
// account's costBasis (and therefore with the portfolio's Total Invested).
const TOPUP_OFFSET_DAYS = 260;
const TOPUP_SHARE = 0.22;

const deposits: Transaction[] = ACCOUNTS.flatMap((a) => {
  const topup = Math.round(a.costBasis * TOPUP_SHARE * 100) / 100;
  const opening = Math.round((a.costBasis - topup) * 100) / 100;
  return [
    {
      id: `txn-deposit-${a.id}-1`,
      date: a.openedDate,
      platformId: a.platformId,
      accountId: a.id,
      type: "Deposit" as TransactionType,
      fees: 0,
      totalValue: opening,
      currency: a.currency,
    },
    {
      id: `txn-deposit-${a.id}-2`,
      date: daysAfter(a.openedDate, TOPUP_OFFSET_DAYS),
      platformId: a.platformId,
      accountId: a.id,
      type: "Deposit" as TransactionType,
      fees: 0,
      totalValue: topup,
      currency: a.currency,
    },
  ];
});

const dividends: Transaction[] = [
  { id: "txn-div-aramco-1", date: "2025-08-12", platformId: "plat-alpha", accountId: "acc-alpha", symbol: "2222.SR", type: "Dividend", fees: 0, totalValue: 312, currency: "SAR" },
  { id: "txn-div-aramco-2", date: "2026-02-10", platformId: "plat-alpha", accountId: "acc-alpha", symbol: "2222.SR", type: "Dividend", fees: 0, totalValue: 336, currency: "SAR" },
  { id: "txn-div-rajhi-1", date: "2025-07-22", platformId: "plat-alpha", accountId: "acc-alpha", symbol: "1120.SR", type: "Dividend", fees: 0, totalValue: 180, currency: "SAR" },
  { id: "txn-div-aapl-1", date: "2025-11-15", platformId: "plat-global", accountId: "acc-global", symbol: "AAPL", type: "Dividend", fees: 0, totalValue: 21.6, currency: "USD" },
  { id: "txn-div-msft-1", date: "2025-12-05", platformId: "plat-global", accountId: "acc-global", symbol: "MSFT", type: "Dividend", fees: 0, totalValue: 44.8, currency: "USD" },
  { id: "txn-div-horizon-1", date: "2025-09-30", platformId: "plat-saudifunds", accountId: "acc-saudifunds", symbol: "HORIZON-EQ", type: "Dividend", fees: 0, totalValue: 264, currency: "SAR" },
  { id: "txn-div-waha-1", date: "2026-01-15", platformId: "plat-saudifunds", accountId: "acc-saudifunds", symbol: "WAHA-SUKUK", type: "Dividend", fees: 0, totalValue: 405, currency: "SAR" },
  { id: "txn-div-voo-1", date: "2025-12-20", platformId: "plat-etf", accountId: "acc-etf", symbol: "VOO", type: "Dividend", fees: 0, totalValue: 62.4, currency: "USD" },
];

const rebalancingSells: Transaction[] = [
  { id: "txn-sell-nvda-trim", date: "2026-05-18", platformId: "plat-global", accountId: "acc-global", symbol: "NVDA", type: "Sell", quantity: 6, price: 128, fees: 4.6, totalValue: 6 * 128 - 4.6, currency: "USD" },
  { id: "txn-sell-qqq-trim", date: "2026-06-02", platformId: "plat-etf", accountId: "acc-etf", symbol: "QQQ", type: "Sell", quantity: 1, price: 515, fees: 3.2, totalValue: 1 * 515 - 3.2, currency: "USD" },
];

const platformFees: Transaction[] = [
  { id: "txn-fee-alpha-1", date: "2025-12-31", platformId: "plat-alpha", accountId: "acc-alpha", type: "Fee", fees: 45, totalValue: -45, currency: "SAR" },
  { id: "txn-fee-global-1", date: "2025-12-31", platformId: "plat-global", accountId: "acc-global", type: "Fee", fees: 25, totalValue: -25, currency: "USD" },
  { id: "txn-fee-saudifunds-1", date: "2025-12-31", platformId: "plat-saudifunds", accountId: "acc-saudifunds", type: "Fee", fees: 60, totalValue: -60, currency: "SAR" },
];

export const TRANSACTIONS: Transaction[] = [
  ...deposits,
  ...buildBuyTranches(),
  ...dividends,
  ...rebalancingSells,
  ...platformFees,
].sort((a, b) => (a.date < b.date ? 1 : -1));
