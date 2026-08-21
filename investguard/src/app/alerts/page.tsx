"use client";

import React, { useMemo, useState } from "react";
import { LineChart } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { RiskAlertCard } from "@/components/RiskAlertCard";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { AlertSeverity } from "@/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";
import { cn } from "@/utils/cn";

const FILTERS: { key: "all" | AlertSeverity; labelKey: string }[] = [
  { key: "all", labelKey: "alerts.all" },
  { key: "critical", labelKey: "alerts.critical" },
  { key: "high", labelKey: "alerts.high" },
  { key: "warning", labelKey: "alerts.warning" },
  { key: "positive", labelKey: "alerts.positive" },
];

export default function AlertsPage() {
  const { t } = useLanguage();
  const data = usePortfolioAnalytics();
  const [filter, setFilter] = useState<"all" | AlertSeverity>("all");

  const filtered = useMemo(() => (filter === "all" ? data.alerts : data.alerts.filter((a) => a.severity === filter)), [data.alerts, filter]);

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;

  return (
    <div>
      <PageHeader title={t("alerts.title")} subtitle={t("alerts.subtitle")} />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filter === f.key ? "border-brand bg-brand/10 text-brand" : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
            )}
          >
            {t(f.labelKey)}
            {f.key !== "all" && (
              <span className="ms-1.5 opacity-70">{data.alerts.filter((a) => a.severity === f.key).length}</span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3">
          {data.loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : filtered.length === 0 ? (
            <EmptyState title={t("alerts.noAlerts")} description={t("alerts.noAlertsDescription")} icon={<LineChart className="h-5 w-5" />} />
          ) : (
            filtered.map((a) => <RiskAlertCard key={a.id} alert={a} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
