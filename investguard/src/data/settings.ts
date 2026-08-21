import { AppSettings } from "@/types";

export const DEFAULT_SETTINGS: AppSettings = {
  profile: {
    displayName: "",
    email: "",
  },
  baseCurrency: "SAR",
  benchmarkId: "tasi",
  riskLimits: {
    maxPlatformExposurePct: 40,
    maxSingleAssetExposurePct: 25,
    maxSectorExposurePct: 30,
    maxDrawdownPct: 10,
    maxCurrencyExposurePct: 60,
  },
  targetAllocations: [
    { sector: "Technology", targetPct: 25 },
    { sector: "Financials", targetPct: 20 },
    { sector: "Energy", targetPct: 15 },
    { sector: "Healthcare", targetPct: 15 },
    { sector: "Cash", targetPct: 25 },
  ],
  alertPreferences: {
    emailNotifications: true,
    criticalOnly: false,
    concentrationAlerts: true,
    drawdownAlerts: true,
    performanceAlerts: true,
  },
  language: "en",
  theme: "dark",
};
