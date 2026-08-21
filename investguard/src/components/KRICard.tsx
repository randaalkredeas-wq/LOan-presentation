"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { KRI } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge, BadgeTone } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatNumber } from "@/utils/formatters";
import { cn } from "@/utils/cn";

const statusTone: Record<KRI["status"], BadgeTone> = {
  low: "positive",
  moderate: "warning",
  high: "negative",
  critical: "critical",
};

const barColor: Record<KRI["status"], string> = {
  low: "bg-positive",
  moderate: "bg-warning",
  high: "bg-negative",
  critical: "bg-critical",
};

function unitSuffix(unit: KRI["unit"]) {
  if (unit === "percent") return "%";
  if (unit === "ratio") return "×";
  return "";
}

export function KRICard({ kri }: { kri: KRI }) {
  const { t, language } = useLanguage();
  const TrendIcon = kri.trend === "up" ? ArrowUpRight : kri.trend === "down" ? ArrowDownRight : Minus;
  const progress = kri.limit !== 0 ? Math.min(100, (kri.currentValue / kri.limit) * 100) : 0;

  return (
    <Card className="p-5 animate-fade-in-up">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{t(kri.labelKey)}</p>
        <Badge tone={statusTone[kri.status]} dot>
          {t(`kriStatus.${kri.status}`)}
        </Badge>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {formatNumber(kri.currentValue, language, kri.unit === "ratio" ? 2 : 1)}
          {unitSuffix(kri.unit)}
        </span>
        <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
          <TrendIcon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("common.limit")}: {formatNumber(kri.limit, language, kri.unit === "ratio" ? 2 : 1)}
        {unitSuffix(kri.unit)}
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full transition-all", barColor[kri.status])} style={{ width: `${progress}%` }} />
      </div>
      {kri.description && <p className="mt-2 text-[11px] text-muted-foreground">{kri.description}</p>}
    </Card>
  );
}
