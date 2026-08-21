import {
  AppSettings,
  Benchmark,
  Holding,
  InvestmentAccount,
  InvestmentPlatform,
  PortfolioSnapshot,
  Transaction,
} from "@/types";

/**
 * Data-source-agnostic contract for retrieving and mutating portfolio data.
 *
 * The dashboard components and calculations layer depend ONLY on this
 * interface. Today it is backed by `MockPortfolioService` (static/generated
 * mock data). Later it can be swapped for `PortfolioApiService` (a REST/GraphQL
 * backend), `PortfolioDatabaseService` (a real database), or a service that
 * reads uploaded Excel/CSV files or a brokerage API — without touching a
 * single component.
 *
 * All methods are async so a real network/database implementation is a
 * drop-in replacement.
 */
export interface IPortfolioService {
  getPlatforms(): Promise<InvestmentPlatform[]>;
  getAccounts(): Promise<InvestmentAccount[]>;
  getAccount(id: string): Promise<InvestmentAccount | undefined>;
  addAccount(input: Omit<InvestmentAccount, "id">, platform: { name: string; type: InvestmentPlatform["type"]; country: InvestmentPlatform["country"] }): Promise<InvestmentAccount>;
  updateAccount(id: string, patch: Partial<InvestmentAccount>): Promise<InvestmentAccount | undefined>;
  deleteAccount(id: string): Promise<boolean>;

  getHoldings(): Promise<Holding[]>;
  getTransactions(): Promise<Transaction[]>;
  getSnapshots(): Promise<PortfolioSnapshot[]>;

  getBenchmarks(): Promise<Benchmark[]>;
  getBenchmark(id: string): Promise<Benchmark | undefined>;

  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
}
