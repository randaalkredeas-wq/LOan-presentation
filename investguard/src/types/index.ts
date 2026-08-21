/**
 * InvestGuard — Core Domain Types
 * ---------------------------------------------------------------------------
 * This is the single source of truth for the shape of data flowing through
 * the application. Every service (mock, API, database, brokerage) must
 * produce data conforming to these interfaces so the UI layer never has to
 * change when the underlying data source changes.
 *
 * Relationship graph:
 *   InvestmentPlatform -> InvestmentAccount -> Holding -> Asset
 *                                            -> Transaction
 *   PortfolioSnapshot   (time series of aggregated portfolio state)
 *   RiskMetric / KRI / KPI / RiskAlert  (derived analytics)
 */

export type Currency = "SAR" | "USD" | "EUR" | "GBP" | "Other";

export type AssetClass =
  | "Stock"
  | "ETF"
  | "Fund"
  | "Cash"
  | "Bond"
  | "REIT"
  | "Other";

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export type Sector =
  | "Technology"
  | "Financials"
  | "Energy"
  | "Healthcare"
  | "Consumer Discretionary"
  | "Consumer Staples"
  | "Communication Services"
  | "Industrials"
  | "Materials"
  | "Utilities"
  | "Real Estate"
  | "Fixed Income"
  | "Cash";

export type Country =
  | "Saudi Arabia"
  | "United States"
  | "United Kingdom"
  | "Germany"
  | "France"
  | "China"
  | "Japan"
  | "Global"
  | "Other";

export type Region = "Saudi Arabia" | "USA" | "Europe" | "Asia" | "Global" | "Other";

export type TransactionType = "Buy" | "Sell" | "Dividend" | "Fee" | "Deposit" | "Withdrawal";

export type AlertSeverity = "critical" | "high" | "warning" | "positive" | "info";

export type AlertCategory =
  | "Concentration"
  | "Drawdown"
  | "Volatility"
  | "Platform"
  | "Sector"
  | "Currency"
  | "Performance"
  | "Liquidity"
  | "Diversification";

export type TrendDirection = "up" | "down" | "flat";

export type KpiStatus = "excellent" | "good" | "neutral" | "watch" | "poor";

export type DateRangeKey = "1D" | "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "3Y" | "CUSTOM";

/* ---------------------------------------------------------------------- */
/* Platform / Account                                                     */
/* ---------------------------------------------------------------------- */

export interface InvestmentPlatform {
  id: string;
  name: string;
  nameAr?: string; // Arabic display name; falls back to `name` when absent
  type: "Brokerage" | "Fund Platform" | "ETF Platform" | "Robo-Advisor" | "Bank";
  logoColor: string; // hex accent used for avatar/badges
  country: Country;
  accountIds: string[];
}

export interface InvestmentAccount {
  id: string;
  platformId: string;
  name: string;
  nameAr?: string; // Arabic display name; falls back to `name` when absent
  currency: Currency;
  totalValue: number; // in account currency
  costBasis: number; // in account currency
  cashBalance: number;
  openedDate: string; // ISO date
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
}

/* ---------------------------------------------------------------------- */
/* Asset / Holding                                                        */
/* ---------------------------------------------------------------------- */

export interface Asset {
  symbol: string;
  name: string;
  nameAr?: string;
  assetClass: AssetClass;
  sector: Sector;
  country: Country;
  region: Region;
  currency: Currency;
  riskLevel: RiskLevel;
  /**
   * For ETFs / Funds only: the look-through composition of underlying
   * holdings, expressed as a % weight of the ETF/Fund's own value.
   * Used to power hidden-exposure / overlap analysis.
   */
  underlying?: UnderlyingComponent[];
}

export interface UnderlyingComponent {
  symbol: string;
  name: string;
  weightPct: number; // % of the ETF/Fund's value
  sector: Sector;
  country: Country;
}

export interface Holding {
  id: string;
  accountId: string;
  platformId: string;
  symbol: string;
  quantity: number;
  averageCost: number; // per unit, account currency
  currentPrice: number; // per unit, account currency
  asOf: string; // ISO date
}

/* ---------------------------------------------------------------------- */
/* Transactions                                                           */
/* ---------------------------------------------------------------------- */

export interface Transaction {
  id: string;
  date: string; // ISO date
  platformId: string;
  accountId: string;
  symbol?: string;
  type: TransactionType;
  quantity?: number;
  price?: number;
  fees: number;
  totalValue: number; // signed: negative for outflows (buys, withdrawals, fees)
  currency: Currency;
}

/* ---------------------------------------------------------------------- */
/* Time series / snapshots                                                */
/* ---------------------------------------------------------------------- */

export interface PortfolioSnapshot {
  date: string; // ISO date
  totalValue: number; // base currency
  costBasis: number;
  cashValue: number;
  benchmarkIndexValue?: number; // normalized benchmark value for comparison
}

export interface Benchmark {
  id: string;
  name: string;
  nameAr: string;
  region: Region;
  series: { date: string; value: number }[]; // normalized index series
}

/* ---------------------------------------------------------------------- */
/* Risk & performance analytics                                           */
/* ---------------------------------------------------------------------- */

export interface RiskMetric {
  id: string;
  category:
    | "Market Risk"
    | "Concentration Risk"
    | "Volatility"
    | "Drawdown"
    | "Liquidity"
    | "Diversification"
    | "Platform Exposure";
  score: number; // 0-100 contribution
  weight: number; // 0-1
}

export interface KPI {
  id: string;
  labelKey: string;
  currentValue: number;
  previousValue: number;
  unit: "currency" | "percent" | "ratio" | "number";
  trend: TrendDirection;
  status: KpiStatus;
}

export interface KRI {
  id: string;
  labelKey: string;
  currentValue: number;
  limit: number;
  unit: "percent" | "ratio" | "score" | "number";
  status: "low" | "moderate" | "high" | "critical";
  trend: TrendDirection;
  description?: string;
}

export interface RiskAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  date: string;
  metricLabelKey: string;
  currentValue: number;
  threshold: number;
  unit: "percent" | "currency" | "score";
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
  status: "active" | "acknowledged" | "resolved";
}

export interface StressScenario {
  id: string;
  nameKey: string;
  kind: "market" | "sector" | "custom";
  shockPct: number; // negative for a drop
  sector?: Sector;
  symbol?: string;
}

export interface StressTestResult {
  scenario: StressScenario;
  estimatedLoss: number; // base currency, negative
  estimatedPortfolioValue: number;
  impactPct: number; // negative
  topContributors: { symbol: string; name: string; loss: number }[];
}

export interface RiskLimit {
  maxPlatformExposurePct: number;
  maxSingleAssetExposurePct: number;
  maxSectorExposurePct: number;
  maxDrawdownPct: number;
  maxCurrencyExposurePct: number;
}

export interface TargetAllocation {
  sector: Sector;
  targetPct: number;
}

/* ---------------------------------------------------------------------- */
/* Settings                                                                */
/* ---------------------------------------------------------------------- */

export interface AlertPreferences {
  emailNotifications: boolean;
  criticalOnly: boolean;
  concentrationAlerts: boolean;
  drawdownAlerts: boolean;
  performanceAlerts: boolean;
}

export interface UserProfile {
  displayName: string;
  email: string;
}

export interface AppSettings {
  profile: UserProfile;
  baseCurrency: Currency;
  benchmarkId: string;
  riskLimits: RiskLimit;
  targetAllocations: TargetAllocation[];
  alertPreferences: AlertPreferences;
  language: "en" | "ar";
  theme: "dark" | "light";
}

/* ---------------------------------------------------------------------- */
/* Composite / derived view models (produced by the calculations layer)   */
/* ---------------------------------------------------------------------- */

export interface EnrichedHolding extends Holding {
  asset: Asset;
  platformName: string;
  accountName: string;
  marketValue: number; // base currency
  costValue: number; // base currency
  pnl: number;
  returnPct: number;
  weightPct: number; // % of total portfolio
}

export interface ExposureSlice {
  key: string;
  labelKey?: string;
  label: string;
  value: number;
  pct: number;
}

export interface OverlapExposure {
  symbol: string;
  name: string;
  totalWeightPct: number;
  sources: { accountName: string; platformName: string; weightPct: number; direct: boolean }[];
}

export interface FxRate {
  currency: Currency;
  rateToBase: number; // multiply amount in `currency` by this to get base currency
}
