"use client";

import { useCallback, useEffect, useState } from "react";
import { Benchmark, Holding, InvestmentAccount, InvestmentPlatform, PortfolioSnapshot, Transaction } from "@/types";
import { portfolioService } from "@/services";

export interface PortfolioRawData {
  platforms: InvestmentPlatform[];
  accounts: InvestmentAccount[];
  holdings: Holding[];
  transactions: Transaction[];
  snapshots: PortfolioSnapshot[];
  benchmarks: Benchmark[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Central data-fetching hook. Every page reads through this hook (backed by
 * `portfolioService`) rather than importing mock data directly, so swapping
 * the service implementation later requires no page changes.
 */
export function usePortfolioRawData(): PortfolioRawData {
  const [platforms, setPlatforms] = useState<InvestmentPlatform[]>([]);
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      portfolioService.getPlatforms(),
      portfolioService.getAccounts(),
      portfolioService.getHoldings(),
      portfolioService.getTransactions(),
      portfolioService.getSnapshots(),
      portfolioService.getBenchmarks(),
    ])
      .then(([p, a, h, t, s, b]) => {
        if (!mounted) return;
        setPlatforms(p);
        setAccounts(a);
        setHoldings(h);
        setTransactions(t);
        setSnapshots(s);
        setBenchmarks(b);
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load portfolio data");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [reloadToken]);

  return { platforms, accounts, holdings, transactions, snapshots, benchmarks, loading, error, reload };
}
