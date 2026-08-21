"use client";

import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { PerformanceChart } from "@/components/PerformanceChart";
import { KPICard } from "@/components/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { CardSkeleton, ErrorState, Skeleton } from "@/components/ui/States";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";
import { useSettings } from "@/contexts/SettingsContext";
import { computeRealizedUnrealizedPnl } from "@/calculations/kpiCalculations";
import { convertCurrency } from "@/data/fx";
import { formatCurrency } from "@/utils/formatters";

export default function PerformancePage() {
  const { t, language } = useLanguage();
  const data = usePortfolioAnalytics();
  const { updateSettings } = useSettings();

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  const baseCurrency = data.settings.baseCurrency;

  const pnlBreakdown = data.loading
    ? { realized: 0, unrealized: 0 }
    : computeRealizedUnrealizedPnl(data.transactions, data.totals.pnl, (c) => convertCurrency(1, c, baseCurrency));

  return (
    <div>
      <PageHeader
        title={t("performance.title")}
        subtitle={t("performance.subtitle")}
        actions={
          <select
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
            value={data.settings.benchmarkId}
            onChange={(e) => updateSettings({ benchmarkId: e.target.value })}
          >
            {data.benchmarks.map((b) => (
              <option key={b.id} value={b.id}>{language === "ar" ? b.nameAr : b.name}</option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t("performance.benchmarkComparison")}</CardTitle>
              <CardDescription>{t("performance.myPortfolio")} {t("common.of")} {data.benchmark ? (language === "ar" ? data.benchmark.nameAr : data.benchmark.name) : ""}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.loading || !data.benchmark ? (
              <Skeleton className="h-[320px] w-full" />
            ) : (
              <PerformanceChart
                snapshots={data.filteredSnapshots}
                benchmarkSeries={data.benchmark.series}
                benchmarkName={language === "ar" ? data.benchmark.nameAr : data.benchmark.name}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("performance.pnlBreakdown")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {data.loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              <>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs text-muted-foreground">{t("performance.realized")}</p>
                  <p className={`mt-1 text-xl font-bold tabular-nums ${pnlBreakdown.realized >= 0 ? "text-positive" : "text-negative"}`}>
                    {formatCurrency(pnlBreakdown.realized, baseCurrency, language, { signed: true })}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                  <p className="text-xs text-muted-foreground">{t("performance.unrealized")}</p>
                  <p className={`mt-1 text-xl font-bold tabular-nums ${pnlBreakdown.unrealized >= 0 ? "text-positive" : "text-negative"}`}>
                    {formatCurrency(pnlBreakdown.unrealized, baseCurrency, language, { signed: true })}
                  </p>
                </div>
                <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
                  <p className="text-xs text-muted-foreground">{t("overview.totalPnl")}</p>
                  <p className={`mt-1 text-xl font-bold tabular-nums ${data.totals.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                    {formatCurrency(data.totals.pnl, baseCurrency, language, { signed: true })}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("performance.kpiCenter")}</h2>
        {data.loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {data.kpis.map((kpi) => (
              <KPICard key={kpi.id} kpi={kpi} baseCurrency={baseCurrency} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
