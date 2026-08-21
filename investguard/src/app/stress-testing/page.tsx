"use client";

import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { StressTestPanel } from "@/components/StressTestPanel";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";

export default function StressTestingPage() {
  const { t } = useLanguage();
  const data = usePortfolioAnalytics();

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;

  return (
    <div>
      <PageHeader title={t("stressTesting.title")} subtitle={t("stressTesting.subtitle")} />
      {data.loading ? (
        <Skeleton className="h-[420px] w-full" />
      ) : (
        <StressTestPanel holdings={data.enrichedHoldings} baseCurrency={data.settings.baseCurrency} />
      )}
    </div>
  );
}
