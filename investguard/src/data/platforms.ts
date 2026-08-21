import { InvestmentPlatform } from "@/types";

/**
 * These are the brokers/apps ONE individual investor personally holds
 * accounts with — not separate clients or entities. InvestGuard exists to
 * pull all of them into a single consolidated view for that one person.
 */
export const PLATFORMS: InvestmentPlatform[] = [
  {
    id: "plat-alpha",
    name: "Al Rajhi Capital",
    nameAr: "الراجحي المالية",
    type: "Brokerage",
    logoColor: "#3b82f6",
    country: "Saudi Arabia",
    accountIds: ["acc-alpha"],
  },
  {
    id: "plat-global",
    name: "Abyan",
    nameAr: "أبيان",
    type: "Brokerage",
    logoColor: "#8b5cf6",
    country: "Saudi Arabia",
    accountIds: ["acc-global"],
  },
  {
    id: "plat-saudifunds",
    name: "Funds Portfolio",
    nameAr: "محفظة صناديق",
    type: "Fund Platform",
    logoColor: "#10b981",
    country: "Saudi Arabia",
    accountIds: ["acc-saudifunds"],
  },
  {
    id: "plat-etf",
    name: "Derayah",
    nameAr: "دراية المالية",
    type: "ETF Platform",
    logoColor: "#f59e0b",
    country: "Saudi Arabia",
    accountIds: ["acc-etf"],
  },
];
