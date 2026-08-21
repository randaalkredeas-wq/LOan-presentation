"use client";

import React from "react";
import Link from "next/link";
import { Wallet, TrendingUp, PiggyBank, Percent, Activity, ShieldAlert, LineChart, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { PortfolioChart } from "@/components/PortfolioChart";
import { AllocationChart } from "@/components/AllocationChart";
import { RiskAlertCard } from "@/components/RiskAlertCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { CardSkeleton, EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Badge, riskLevelTone } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import { ShieldCheck } from "lucide-react";

export default function OverviewPage() {
  const { t, language } = useLanguage();
  const data = usePortfolioAnalytics();

  if (data.error) {
    return <ErrorState message={data.error} onRetry={data.reload} />;
  }

  const baseCurrency = data.settings.baseCurrency;

  return (
    <div>
      <PageHeader title={t("overview.title")} subtitle={t("overview.subtitle")} />

      {data.loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-in-up">
          <StatCard
            label={t("overview.totalPortfolioValue")}
            value={formatCurrency(data.totals.totalValue, baseCurrency, language)}
            icon={Wallet}
            tone="brand"
          />
          <StatCard
            label={t("overview.totalInvested")}
            value={formatCurrency(data.totals.costBasis, baseCurrency, language)}
            icon={PiggyBank}
          />
          <StatCard
            label={t("overview.totalPnl")}
            value={formatCurrency(data.totals.pnl, baseCurrency, language, { signed: true })}
            icon={TrendingUp}
            tone={data.totals.pnl >= 0 ? "positive" : "negative"}
          />
          <StatCard
            label={t("overview.totalReturn")}
            value={formatPercent(data.totals.returnPct, language)}
            icon={Percent}
            tone={data.totals.returnPct >= 0 ? "positive" : "negative"}
          />
          <StatCard
            label={t("overview.todaysChange")}
            value={formatCurrency(data.totals.todaysChange, baseCurrency, language, { signed: true })}
            subValue={formatPercent(data.totals.todaysChangePct, language)}
            icon={Activity}
            tone={data.totals.todaysChange >= 0 ? "positive" : "negative"}
          />
          <StatCard
            label={t("overview.riskScore")}
            value={`${data.riskScore.overall} / 100`}
            subValue={t(`riskScoreLevel.${data.riskScore.level}`)}
            icon={ShieldAlert}
            tone={data.riskScore.overall > 60 ? "negative" : "neutral"}
          />
          <StatCard
            label={t("overview.diversificationScore")}
            value={`${data.diversification} / 100`}
            icon={ShieldCheck}
            tone={data.diversification >= 60 ? "positive" : "neutral"}
          />
          <StatCard
            label={t("overview.maxDrawdown")}
            value={formatPercent(data.maxDD, language)}
            icon={TrendingDown}
            tone="negative"
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t("overview.portfolioValueOverTime")}</CardTitle>
              <CardDescription>{t(`dateRange.${"1Y"}`)}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-[320px] w-full" /> : <PortfolioChart snapshots={data.filteredSnapshots} baseCurrency={baseCurrency} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("overview.allocationByAssetClass")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <AllocationChart slices={data.assetClassExp} baseCurrency={baseCurrency} labelFormatter={(k) => t(`assetClass.${k}`)} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t("overview.accountsSnapshot")}</CardTitle>
              <CardDescription>{data.totals.numAccounts} {t("overview.numAccounts")} · {data.totals.numPlatforms} {t("overview.numPlatforms")}</CardDescription>
            </div>
            <Link href="/accounts" className="text-xs font-semibold text-brand hover:underline shrink-0">
              {t("overview.viewAll")}
            </Link>
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-1">
                {data.accountSummaries.map((r) => (
                  <div key={r.account.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-2/60 transition-colors">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: r.platform.logoColor }}
                    >
                      {r.platform.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{r.platform.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPercent(r.allocationPct, language, { signed: false })} {t("common.of")} {t("overview.totalPortfolioValue").toLowerCase()}</p>
                    </div>
                    <Badge tone={riskLevelTone(r.account.riskLevel)} className="hidden sm:inline-flex">
                      {t(`riskLevel.${r.account.riskLevel}`)}
                    </Badge>
                    <div className="text-end">
                      <p className="tabular-nums text-sm font-semibold text-foreground">{formatCurrency(r.valueBase, baseCurrency, language)}</p>
                      <p className={`tabular-nums text-xs font-medium ${r.returnPct >= 0 ? "text-positive" : "text-negative"}`}>
                        {formatPercent(r.returnPct, language)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("overview.topAlerts")}</CardTitle>
              <CardDescription>{data.alerts.length}</CardDescription>
            </div>
            <Link href="/alerts" className="text-xs font-semibold text-brand hover:underline shrink-0">
              {t("overview.viewAll")}
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : data.alerts.length === 0 ? (
              <EmptyState title={t("alerts.noAlerts")} description={t("alerts.noAlertsDescription")} icon={<LineChart className="h-5 w-5" />} />
            ) : (
              data.alerts.slice(0, 3).map((a) => <RiskAlertCard key={a.id} alert={a} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
