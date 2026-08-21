"use client";

import React, { useMemo, useState } from "react";
import { Layers, Wallet, Landmark, Building2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { AllocationChart } from "@/components/AllocationChart";
import { RebalancingTable } from "@/components/RebalancingTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CardSkeleton, ErrorState, Skeleton } from "@/components/ui/States";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";
import { PortfolioScope } from "@/calculations/portfolioCalculations";
import { computeRebalancing } from "@/calculations/rebalancingCalculations";
import { formatCurrency, localizedName } from "@/utils/formatters";

export default function PortfolioPage() {
  const { t, language } = useLanguage();
  const [scope, setScope] = useState<PortfolioScope | undefined>(undefined);
  const data = usePortfolioAnalytics(scope);

  const scopeOptions = useMemo(() => {
    const opts: { label: string; scope: PortfolioScope | undefined }[] = [{ label: t("common.allAccounts"), scope: undefined }];
    for (const p of data.platforms) {
      opts.push({ label: localizedName(p, language), scope: { platformId: p.id } });
    }
    return opts;
  }, [data.platforms, t, language]);

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  const baseCurrency = data.settings.baseCurrency;

  return (
    <div>
      <PageHeader
        title={t("portfolio.title")}
        subtitle={t("portfolio.subtitle")}
        actions={
          <select
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
            onChange={(e) => {
              const idx = Number(e.target.value);
              setScope(scopeOptions[idx].scope);
            }}
          >
            {scopeOptions.map((opt, i) => (
              <option key={i} value={i}>{opt.label}</option>
            ))}
          </select>
        }
      />

      {data.loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-in-up">
          <StatCard label={t("portfolio.totalPortfolioValue")} value={formatCurrency(data.totals.totalValue, baseCurrency, language)} icon={Wallet} tone="brand" />
          <StatCard label={t("portfolio.totalCostBasis")} value={formatCurrency(data.totals.costBasis, baseCurrency, language)} icon={Landmark} />
          <StatCard label={t("portfolio.totalPnl")} value={formatCurrency(data.totals.pnl, baseCurrency, language, { signed: true })} tone={data.totals.pnl >= 0 ? "positive" : "negative"} />
          <StatCard label={t("portfolio.totalReturn")} value={`${data.totals.returnPct >= 0 ? "+" : ""}${data.totals.returnPct.toFixed(2)}%`} tone={data.totals.returnPct >= 0 ? "positive" : "negative"} />
          <StatCard label={t("portfolio.cash")} value={formatCurrency(data.totals.cashValue, baseCurrency, language)} icon={Building2} />
          <StatCard label={t("portfolio.numHoldings")} value={String(data.totals.numHoldings)} icon={Layers} />
          <StatCard label={t("portfolio.numAccounts")} value={String(data.totals.numAccounts)} />
          <StatCard label={t("portfolio.numPlatforms")} value={String(data.totals.numPlatforms)} />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>{t("portfolio.allocationByAssetClass")}</CardTitle></CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-[220px] w-full" /> : <AllocationChart slices={data.assetClassExp} baseCurrency={baseCurrency} labelFormatter={(k) => t(`assetClass.${k}`)} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("portfolio.allocationByPlatform")}</CardTitle></CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-[220px] w-full" /> : <AllocationChart slices={data.platformExp} baseCurrency={baseCurrency} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("portfolio.allocationBySector")}</CardTitle></CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-[220px] w-full" /> : <AllocationChart slices={data.sectorExp} baseCurrency={baseCurrency} labelFormatter={(k) => t(`sector.${k}`)} />}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>{t("rebalancing.title")}</CardTitle>
            <CardDescription>{t("rebalancing.subtitle")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {data.loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : (
            <RebalancingTable rows={computeRebalancing(data.enrichedHoldings, data.settings.targetAllocations)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
