"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge, BadgeTone } from "@/components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";
import { convertCurrency } from "@/data/fx";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { TransactionType } from "@/types";
import { cn } from "@/utils/cn";

const typeTone: Record<TransactionType, BadgeTone> = {
  Buy: "info",
  Sell: "warning",
  Dividend: "positive",
  Fee: "negative",
  Deposit: "brand",
  Withdrawal: "critical",
};

const PAGE_SIZE = 12;

export default function TransactionsPage() {
  const { t, language } = useLanguage();
  const data = usePortfolioAnalytics();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    let totalInvested = 0;
    let totalWithdrawn = 0;
    let totalFees = 0;
    for (const tx of data.transactions) {
      const rate = convertCurrency(1, tx.currency, data.settings.baseCurrency);
      if (tx.type === "Deposit") totalInvested += tx.totalValue * rate;
      if (tx.type === "Withdrawal") totalWithdrawn += Math.abs(tx.totalValue) * rate;
      totalFees += tx.fees * rate;
    }
    return { totalInvested, totalWithdrawn, totalFees, netCashFlow: totalInvested - totalWithdrawn };
  }, [data.transactions, data.settings.baseCurrency]);

  const filtered = useMemo(() => {
    return data.transactions.filter((tx) => {
      if (search && !(tx.symbol ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && tx.type !== typeFilter) return false;
      return true;
    });
  }, [data.transactions, search, typeFilter]);

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  const baseCurrency = data.settings.baseCurrency;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const platformName = (id: string) => data.platforms.find((p) => p.id === id)?.name ?? "";
  const accountName = (id: string) => data.accounts.find((a) => a.id === id)?.name ?? "";

  return (
    <div>
      <PageHeader title={t("transactions.title")} subtitle={t("transactions.subtitle")} />

      {data.loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label={t("transactions.totalInvested")} value={formatCurrency(stats.totalInvested, baseCurrency, language)} tone="brand" />
          <StatCard label={t("transactions.totalWithdrawn")} value={formatCurrency(stats.totalWithdrawn, baseCurrency, language)} />
          <StatCard label={t("transactions.totalFees")} value={formatCurrency(stats.totalFees, baseCurrency, language)} tone="negative" />
          <StatCard label={t("transactions.netCashFlow")} value={formatCurrency(stats.netCashFlow, baseCurrency, language, { signed: true })} tone={stats.netCashFlow >= 0 ? "positive" : "negative"} />
        </div>
      )}

      <Card className="mt-5">
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={t("transactions.searchPlaceholder")}
                className="w-56 rounded-lg border border-border bg-surface-2 py-1.5 ps-8 pe-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
            </div>
            <select
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as TransactionType | ""); setPage(1); }}
            >
              <option value="">{t("common.all")}</option>
              {(["Buy", "Sell", "Dividend", "Fee", "Deposit", "Withdrawal"] as TransactionType[]).map((tType) => (
                <option key={tType} value={tType}>{t(`txnType.${tType}`)}</option>
              ))}
            </select>
          </div>

          {data.loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState title={t("common.noResults")} description={t("common.tryAdjusting")} />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[860px] text-start text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2 text-xs text-muted-foreground">
                      <th className="px-3 py-2.5 text-start font-medium">{t("common.date")}</th>
                      <th className="px-3 py-2.5 text-start font-medium">{t("common.platform")}</th>
                      <th className="px-3 py-2.5 text-start font-medium">{t("common.account")}</th>
                      <th className="px-3 py-2.5 text-start font-medium">{t("common.symbol")}</th>
                      <th className="px-3 py-2.5 text-start font-medium">{t("transactions.type")}</th>
                      <th className="px-3 py-2.5 text-end font-medium">{t("transactions.quantity")}</th>
                      <th className="px-3 py-2.5 text-end font-medium">{t("transactions.price")}</th>
                      <th className="px-3 py-2.5 text-end font-medium">{t("transactions.fees")}</th>
                      <th className="px-3 py-2.5 text-end font-medium">{t("transactions.totalValue")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((tx) => (
                      <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-surface-2/60 transition-colors">
                        <td className="px-3 py-2.5 text-muted-foreground">{formatDate(tx.date, language)}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{platformName(tx.platformId)}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{accountName(tx.accountId)}</td>
                        <td className="px-3 py-2.5 font-medium text-foreground">{tx.symbol ?? "—"}</td>
                        <td className="px-3 py-2.5"><Badge tone={typeTone[tx.type]}>{t(`txnType.${tx.type}`)}</Badge></td>
                        <td className="px-3 py-2.5 text-end tabular-nums text-foreground">{tx.quantity ?? "—"}</td>
                        <td className="px-3 py-2.5 text-end tabular-nums text-foreground">{tx.price ? formatCurrency(tx.price, tx.currency, language) : "—"}</td>
                        <td className="px-3 py-2.5 text-end tabular-nums text-muted-foreground">{formatCurrency(tx.fees, tx.currency, language)}</td>
                        <td className={cn("px-3 py-2.5 text-end tabular-nums font-medium", tx.totalValue >= 0 ? "text-positive" : "text-negative")}>
                          {formatCurrency(tx.totalValue, tx.currency, language, { signed: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("common.page")} {page} {t("common.of")} {totalPages} · {filtered.length} {t("nav.transactions")}</span>
                <div className="flex items-center gap-1.5">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-border px-2.5 py-1 disabled:opacity-40">‹</button>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg border border-border px-2.5 py-1 disabled:opacity-40">›</button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
