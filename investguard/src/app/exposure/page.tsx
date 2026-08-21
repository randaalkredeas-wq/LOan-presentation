"use client";

import React from "react";
import { AlertTriangle, Layers2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ExposureChart } from "@/components/ExposureChart";
import { AllocationChart } from "@/components/AllocationChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";
import { formatCurrency, formatPercent } from "@/utils/formatters";

export default function ExposurePage() {
  const { t, language } = useLanguage();
  const data = usePortfolioAnalytics();

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  const baseCurrency = data.settings.baseCurrency;
  const limits = data.settings.riskLimits;

  const significantOverlaps = data.overlaps.filter((o) => o.totalWeightPct >= 1.5).slice(0, 8);
  const breachedOverlap = data.overlaps.find((o) => o.totalWeightPct > limits.maxSingleAssetExposurePct);
  const breachedPlatform = data.platformConcentration.find((p) => p.breach);

  return (
    <div>
      <PageHeader title={t("exposure.title")} subtitle={t("exposure.subtitle")} />

      <Card className="mb-5">
        <CardHeader>
          <div>
            <CardTitle>{t("exposure.hiddenExposure")}</CardTitle>
            <CardDescription>{t("exposure.hiddenExposureIntro")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {breachedOverlap && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-critical/30 bg-critical-bg/40 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-critical" />
              <div>
                <p className="text-sm font-semibold text-critical">{t("exposure.hiddenConcentrationRisk")}</p>
                <p className="mt-1 text-sm text-foreground">
                  {t("exposure.hiddenConcentrationDescription", { value: breachedOverlap.totalWeightPct.toFixed(1), symbol: breachedOverlap.symbol })}
                </p>
              </div>
            </div>
          )}

          {data.loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : significantOverlaps.length === 0 ? (
            <EmptyState title={t("common.noData")} icon={<Layers2 className="h-5 w-5" />} />
          ) : (
            <div className="space-y-3">
              {significantOverlaps.map((o) => (
                <details key={o.symbol} className="group rounded-xl border border-border p-4 open:bg-surface-2/40">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-foreground">{o.symbol.slice(0, 4)}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t("exposure.trueExposureTo", { symbol: o.symbol })}</p>
                        <p className="text-xs text-muted-foreground">{o.name} · {o.sources.length} {t("exposure.sources").toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {o.totalWeightPct > limits.maxSingleAssetExposurePct && <Badge tone="critical">{t("riskScoreLevel.Critical")}</Badge>}
                      <span className="tabular-nums text-lg font-bold text-foreground">{formatPercent(o.totalWeightPct, language, { signed: false })}</span>
                    </div>
                  </summary>
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {o.sources.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {s.platformName} — {s.accountName} · {s.direct ? t("exposure.directHolding") : t("exposure.viaLookThrough", { platform: s.platformName })}
                        </span>
                        <span className="tabular-nums font-medium text-foreground">{formatPercent(s.weightPct, language, { signed: false })}</span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("exposure.platformConcentration")}</CardTitle>
              <CardDescription>{t("exposure.maxPlatformExposure")}: {limits.maxPlatformExposurePct}%</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {breachedPlatform && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-negative/30 bg-negative-bg/40 p-3.5">
                <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-negative" />
                <div>
                  <p className="text-xs font-semibold text-negative">{t("exposure.platformConcentrationAlert")}</p>
                  <p className="mt-0.5 text-xs text-foreground">
                    {t("exposure.platformConcentrationDescription", { platform: breachedPlatform.platform, value: breachedPlatform.pct.toFixed(1), limit: limits.maxPlatformExposurePct })}
                  </p>
                </div>
              </div>
            )}
            {data.loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ExposureChart slices={data.platformConcentration.map((p) => ({ key: p.platform, label: p.platform, value: 0, pct: p.pct }))} limit={limits.maxPlatformExposurePct} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("exposure.consolidatedSectorExposure")}</CardTitle>
              <CardDescription>{t("settings.maxSectorExposure")}: {limits.maxSectorExposurePct}%</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-[260px] w-full" /> : <ExposureChart slices={data.trueSectorExp} limit={limits.maxSectorExposurePct} labelFormatter={(k) => t(`sector.${k}`)} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("exposure.assetClassExposure")}</CardTitle></CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-[220px] w-full" /> : <AllocationChart slices={data.assetClassExp} baseCurrency={baseCurrency} labelFormatter={(k) => t(`assetClass.${k}`)} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("exposure.geographicalExposure")}</CardTitle></CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-[220px] w-full" /> : <ExposureChart slices={data.regionExp} labelFormatter={(k) => t(`region.${k}`)} />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t("exposure.currencyExposure")}</CardTitle>
              <CardDescription>{t("exposure.baseCurrencyValue")}: {formatCurrency(data.totals.totalValue, baseCurrency, language)}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {data.loading ? <Skeleton className="h-[160px] w-full" /> : <ExposureChart slices={data.currencyExp} limit={limits.maxCurrencyExposurePct} height={data.currencyExp.length * 44} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
