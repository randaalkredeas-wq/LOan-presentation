import {
  AppSettings,
  Benchmark,
  Holding,
  InvestmentAccount,
  InvestmentPlatform,
  PortfolioSnapshot,
  Transaction,
} from "@/types";
import { PLATFORMS } from "@/data/platforms";
import { ACCOUNTS } from "@/data/accounts";
import { HOLDINGS } from "@/data/holdings";
import { TRANSACTIONS } from "@/data/transactions";
import { PORTFOLIO_SNAPSHOTS, BENCHMARKS } from "@/data/snapshots";
import { DEFAULT_SETTINGS } from "@/data/settings";
import { IPortfolioService } from "./portfolioService.interface";

// Simulated network latency so loading states are exercised even with
// static mock data — swapping in a real API later changes nothing here.
const LATENCY_MS = 120;
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

let platforms: InvestmentPlatform[] = PLATFORMS.map((p) => ({ ...p }));
let accounts: InvestmentAccount[] = ACCOUNTS.map((a) => ({ ...a }));
let settings: AppSettings = { ...DEFAULT_SETTINGS };

let accountCounter = accounts.length;

export class MockPortfolioService implements IPortfolioService {
  async getPlatforms(): Promise<InvestmentPlatform[]> {
    return delay(platforms.map((p) => ({ ...p })));
  }

  async getAccounts(): Promise<InvestmentAccount[]> {
    return delay(accounts.map((a) => ({ ...a })));
  }

  async getAccount(id: string): Promise<InvestmentAccount | undefined> {
    return delay(accounts.find((a) => a.id === id));
  }

  async addAccount(
    input: Omit<InvestmentAccount, "id">,
    platform: { name: string; type: InvestmentPlatform["type"]; country: InvestmentPlatform["country"] }
  ): Promise<InvestmentAccount> {
    accountCounter += 1;
    const accountId = `acc-custom-${accountCounter}`;
    const platformId = `plat-custom-${accountCounter}`;

    const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];
    platforms = [
      ...platforms,
      {
        id: platformId,
        name: platform.name,
        type: platform.type,
        logoColor: colors[accountCounter % colors.length],
        country: platform.country,
        accountIds: [accountId],
      },
    ];

    const newAccount: InvestmentAccount = { ...input, id: accountId, platformId };
    accounts = [...accounts, newAccount];
    return delay(newAccount);
  }

  async updateAccount(id: string, patch: Partial<InvestmentAccount>): Promise<InvestmentAccount | undefined> {
    let updated: InvestmentAccount | undefined;
    accounts = accounts.map((a) => {
      if (a.id === id) {
        updated = { ...a, ...patch, id: a.id };
        return updated;
      }
      return a;
    });
    return delay(updated);
  }

  async deleteAccount(id: string): Promise<boolean> {
    const before = accounts.length;
    const account = accounts.find((a) => a.id === id);
    accounts = accounts.filter((a) => a.id !== id);
    if (account) {
      platforms = platforms
        .map((p) => (p.id === account.platformId ? { ...p, accountIds: p.accountIds.filter((aid) => aid !== id) } : p))
        .filter((p) => p.accountIds.length > 0 || !p.id.startsWith("plat-custom"));
    }
    return delay(accounts.length < before);
  }

  async getHoldings(): Promise<Holding[]> {
    const activeAccountIds = new Set(accounts.map((a) => a.id));
    return delay(HOLDINGS.filter((h) => activeAccountIds.has(h.accountId)));
  }

  async getTransactions(): Promise<Transaction[]> {
    return delay(TRANSACTIONS);
  }

  async getSnapshots(): Promise<PortfolioSnapshot[]> {
    return delay(PORTFOLIO_SNAPSHOTS);
  }

  async getBenchmarks(): Promise<Benchmark[]> {
    return delay(BENCHMARKS);
  }

  async getBenchmark(id: string): Promise<Benchmark | undefined> {
    return delay(BENCHMARKS.find((b) => b.id === id));
  }

  async getSettings(): Promise<AppSettings> {
    return delay({ ...settings });
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    settings = { ...settings, ...patch };
    return delay({ ...settings });
  }
}
