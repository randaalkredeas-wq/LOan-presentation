"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { KPI, Currency } from "@/types";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import { cn } from "@/utils/cn";

const statusColor: Record<KPI["status"], string> = {
  excellent: "text-positive",
  good: "text-positive",
  neutral: "text-muted-foreground",
  watch: "text-warning",
  poor: "text-negative",
};

export function KPICard({ kpi, baseCurrency }: { kpi: KPI; baseCurrency: Currency }) {
  const { t, language } = useLanguage();

  const formatValue = (v: number) => (kpi.unit === "currency" ? formatCurrency(v, baseCurrency, language, { signed: true, compact: true }) : formatPercent(v, language));

  const changeAbs = kpi.currentValue - kpi.previousValue;
  const TrendIcon = kpi.trend === "up" ? ArrowUpRight : kpi.trend === "down" ? ArrowDownRight : Minus;

  return (
    <Card className="p-5 animate-fade-in-up">
      <p className="text-xs font-medium text-muted-foreground">{t(kpi.labelKey)}</p>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums tracking-tight", statusColor[kpi.status])}>
        {formatValue(kpi.currentValue)}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {t("common.previous")}: <span className="tabular-nums">{formatValue(kpi.previousValue)}</span>
        </span>
        <span className={cn("flex items-center gap-0.5 font-semibold tabular-nums", statusColor[kpi.status])}>
          <TrendIcon className="h-3.5 w-3.5" />
          {kpi.unit === "currency" ? formatCurrency(Math.abs(changeAbs), baseCurrency, language, { compact: true }) : formatPercent(Math.abs(changeAbs), language, { signed: false })}
        </span>
      </div>
    </Card>
  );
}
