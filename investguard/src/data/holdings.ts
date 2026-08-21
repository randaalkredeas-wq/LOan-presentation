import { Holding } from "@/types";

const ASOF = "2026-08-21";

/**
 * Holdings reconcile exactly to each account's totalValue / costBasis in
 * accounts.ts (quantity * currentPrice = market value contribution,
 * quantity * averageCost = cost contribution).
 */
export const HOLDINGS: Holding[] = [
  // --- Alpha Invest (SAR) ---------------------------------------------
  { id: "h-alpha-aramco", accountId: "acc-alpha", platformId: "plat-alpha", symbol: "2222.SR", quantity: 800, averageCost: 25.0, currentPrice: 30.0, asOf: ASOF },
  { id: "h-alpha-rajhi", accountId: "acc-alpha", platformId: "plat-alpha", symbol: "1120.SR", quantity: 200, averageCost: 67.5, currentPrice: 80.0, asOf: ASOF },
  { id: "h-alpha-stc", accountId: "acc-alpha", platformId: "plat-alpha", symbol: "7010.SR", quantity: 250, averageCost: 36.0, currentPrice: 40.0, asOf: ASOF },
  { id: "h-alpha-sabic", accountId: "acc-alpha", platformId: "plat-alpha", symbol: "2010.SR", quantity: 100, averageCost: 75.0, currentPrice: 74.0, asOf: ASOF },
  { id: "h-alpha-cash", accountId: "acc-alpha", platformId: "plat-alpha", symbol: "CASH-SAR", quantity: 5000, averageCost: 1, currentPrice: 1, asOf: ASOF },

  // --- Global Broker (USD) ---------------------------------------------
  { id: "h-global-aapl", accountId: "acc-global", platformId: "plat-global", symbol: "AAPL", quantity: 30, averageCost: 206.6667, currentPrice: 250.0, asOf: ASOF },
  { id: "h-global-msft", accountId: "acc-global", platformId: "plat-global", symbol: "MSFT", quantity: 16, averageCost: 368.75, currentPrice: 425.0, asOf: ASOF },
  { id: "h-global-nvda", accountId: "acc-global", platformId: "plat-global", symbol: "NVDA", quantity: 40, averageCost: 95.0, currentPrice: 130.0, asOf: ASOF },
  { id: "h-global-amzn", accountId: "acc-global", platformId: "plat-global", symbol: "AMZN", quantity: 16, averageCost: 181.25, currentPrice: 200.0, asOf: ASOF },
  { id: "h-global-googl", accountId: "acc-global", platformId: "plat-global", symbol: "GOOGL", quantity: 13, averageCost: 156.4103, currentPrice: 160.0, asOf: ASOF },
  { id: "h-global-cash", accountId: "acc-global", platformId: "plat-global", symbol: "CASH-USD", quantity: 500, averageCost: 1, currentPrice: 1, asOf: ASOF },

  // --- Saudi Funds (SAR) -------------------------------------------------
  { id: "h-saudifunds-horizon", accountId: "acc-saudifunds", platformId: "plat-saudifunds", symbol: "HORIZON-EQ", quantity: 1000, averageCost: 19.5, currentPrice: 22.0, asOf: ASOF },
  { id: "h-saudifunds-waha", accountId: "acc-saudifunds", platformId: "plat-saudifunds", symbol: "WAHA-SUKUK", quantity: 1000, averageCost: 15.8, currentPrice: 16.2, asOf: ASOF },
  { id: "h-saudifunds-najm", accountId: "acc-saudifunds", platformId: "plat-saudifunds", symbol: "NAJM-BAL", quantity: 500, averageCost: 14.4, currentPrice: 16.0, asOf: ASOF },
  { id: "h-saudifunds-cash", accountId: "acc-saudifunds", platformId: "plat-saudifunds", symbol: "CASH-SAR", quantity: 2000, averageCost: 1, currentPrice: 1, asOf: ASOF },

  // --- ETF Account (USD) --------------------------------------------------
  { id: "h-etf-voo", accountId: "acc-etf", platformId: "plat-etf", symbol: "VOO", quantity: 10, averageCost: 460.0, currentPrice: 520.0, asOf: ASOF },
  { id: "h-etf-vwra", accountId: "acc-etf", platformId: "plat-etf", symbol: "VWRA", quantity: 30, averageCost: 116.6667, currentPrice: 126.6667, asOf: ASOF },
  { id: "h-etf-qqq", accountId: "acc-etf", platformId: "plat-etf", symbol: "QQQ", quantity: 5, averageCost: 458.4, currentPrice: 520.0, asOf: ASOF },
  { id: "h-etf-cash", accountId: "acc-etf", platformId: "plat-etf", symbol: "CASH-USD", quantity: 408, averageCost: 1, currentPrice: 1, asOf: ASOF },
];
