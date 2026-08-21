"use client";

import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { RiskGauge } from "@/components/RiskGauge";
import { KRICard } from "@/components/KRICard";
import { RiskReturnMatrix } from "@/components/RiskReturnMatrix";
import { holdingsToRiskReturnPoints } from "@/calculations/riskReturnMatrix";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { CardSkeleton, ErrorState, Skeleton } from "@/components/ui/States";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";
import { cn } from "@/utils/cn";

export default function RiskCenterPage() {
  const { t } = useLanguage();
  const data = usePortfolioAnalytics();

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;

  return (
    <div>
      <PageHeader title={t("riskCenter.title")} subtitle={t("riskCenter.subtitle")} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center py-8 lg:col-span-1">
          <CardHeader className="w-full text-center">
            <CardTitle className="w-full">{t("riskCenter.overallRiskScore")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-[140px] w-[220px]" /> : <RiskGauge score={data.riskScore.overall} />}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-risk-low" />{t("riskCenter.scaleLow")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-risk-medium" />{t("riskCenter.scaleModerate")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-risk-high" />{t("riskCenter.scaleHigh")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-risk-critical" />{t("riskCenter.scaleCritical")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("riskCenter.riskCategories")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.loading ? (
              Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : (
              data.riskScore.categories.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-xs font-medium text-foreground">{t(`riskCategory.${c.category}`)}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={cn("h-full rounded-full", c.score > 65 ? "bg-negative" : c.score > 40 ? "bg-warning" : "bg-positive")}
                      style={{ width: `${(c.score / 100) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-end text-xs font-semibold tabular-nums text-foreground">{Math.round(c.score)}</span>
                </div>
              ))
            )}
            <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs font-semibold text-foreground">{t("riskCenter.methodology")}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t("riskCenter.methodologyText")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("riskCenter.kriTable")}</h2>
        {data.loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.kris.map((k) => <KRICard key={k.id} kri={k} />)}
          </div>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>{t("riskReturn.title")}</CardTitle>
            <CardDescription>{t("riskReturn.subtitle")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {data.loading ? <Skeleton className="h-[380px] w-full" /> : <RiskReturnMatrix points={holdingsToRiskReturnPoints(data.enrichedHoldings)} />}
        </CardContent>
      </Card>
    </div>
  );
}
