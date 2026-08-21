"use client";

import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { HoldingsTable } from "@/components/HoldingsTable";
import { Card, CardContent } from "@/components/ui/Card";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";

export default function HoldingsPage() {
  const { t } = useLanguage();
  const data = usePortfolioAnalytics();

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;

  return (
    <div>
      <PageHeader title={t("holdings.title")} subtitle={t("holdings.subtitle")} />
      <Card>
        <CardContent>
          {data.loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <HoldingsTable holdings={data.enrichedHoldings} baseCurrency={data.settings.baseCurrency} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
