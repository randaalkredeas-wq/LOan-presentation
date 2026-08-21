import { InvestmentAccount } from "@/types";

/**
 * Account totals/costs are expressed in the account's own currency.
 * Values reconcile exactly with the holdings defined in holdings.ts and
 * with the flagship demo numbers used throughout the product spec:
 *   Alpha Invest 62,400 + Global Broker 94,800 (USD 25,280 @ 3.75)
 *   + Saudi Funds 48,200 + ETF Account 45,030 (USD 12,008 @ 3.75)
 *   = SAR 250,430 total portfolio value, SAR 220,000 invested,
 *   +SAR 30,430 P&L (+13.83%).
 */
export const ACCOUNTS: InvestmentAccount[] = [
  {
    id: "acc-alpha",
    platformId: "plat-alpha",
    name: "Alpha Invest",
    currency: "SAR",
    totalValue: 62400,
    costBasis: 55000,
    cashBalance: 5000,
    openedDate: "2022-03-14",
    riskScore: 52,
    riskLevel: "Medium",
  },
  {
    id: "acc-global",
    platformId: "plat-global",
    name: "Global Broker",
    currency: "USD",
    totalValue: 25280,
    costBasis: 21333.33,
    cashBalance: 500,
    openedDate: "2021-11-02",
    riskScore: 78,
    riskLevel: "High",
  },
  {
    id: "acc-saudifunds",
    platformId: "plat-saudifunds",
    name: "Saudi Funds",
    currency: "SAR",
    totalValue: 48200,
    costBasis: 44500,
    cashBalance: 2000,
    openedDate: "2023-01-20",
    riskScore: 28,
    riskLevel: "Low",
  },
  {
    id: "acc-etf",
    platformId: "plat-etf",
    name: "ETF Account",
    currency: "USD",
    totalValue: 12008,
    costBasis: 10800,
    cashBalance: 408,
    openedDate: "2022-07-08",
    riskScore: 38,
    riskLevel: "Medium",
  },
];
