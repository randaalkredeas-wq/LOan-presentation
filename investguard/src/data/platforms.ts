import { InvestmentPlatform } from "@/types";

export const PLATFORMS: InvestmentPlatform[] = [
  {
    id: "plat-alpha",
    name: "Alpha Invest",
    type: "Brokerage",
    logoColor: "#3b82f6",
    country: "Saudi Arabia",
    accountIds: ["acc-alpha"],
  },
  {
    id: "plat-global",
    name: "Global Broker",
    type: "Brokerage",
    logoColor: "#8b5cf6",
    country: "United States",
    accountIds: ["acc-global"],
  },
  {
    id: "plat-saudifunds",
    name: "Saudi Funds",
    type: "Fund Platform",
    logoColor: "#10b981",
    country: "Saudi Arabia",
    accountIds: ["acc-saudifunds"],
  },
  {
    id: "plat-etf",
    name: "Global ETF Partners",
    type: "ETF Platform",
    logoColor: "#f59e0b",
    country: "United States",
    accountIds: ["acc-etf"],
  },
];
