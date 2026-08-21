"use client";

import React from "react";
import { RebalancingRow } from "@/calculations/rebalancingCalculations";
import { Badge, BadgeTone } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatPercent } from "@/utils/formatters";
import { cn } from "@/utils/cn";

const statusTone: Record<RebalancingRow["status"], BadgeTone> = {
  onTarget: "positive",
  overweight: "warning",
  underweight: "info",
};

export function RebalancingTable({ rows }: { rows: RebalancingRow[] }) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.sector} className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">{t(`sector.${row.sector}`) !== `sector.${row.sector}` ? t(`sector.${row.sector}`) : row.sector}</span>
            <Badge tone={statusTone[row.status]}>{t(`rebalancing.${row.status}`)}</Badge>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-muted-foreground">{t("common.target")}</p>
              <p className="mt-0.5 tabular-nums font-semibold text-foreground">{formatPercent(row.targetPct, language, { signed: false })}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("common.actual")}</p>
              <p className="mt-0.5 tabular-nums font-semibold text-foreground">{formatPercent(row.actualPct, language, { signed: false })}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("common.drift")}</p>
              <p className={cn("mt-0.5 tabular-nums font-semibold", row.driftPct > 0 ? "text-warning" : row.driftPct < 0 ? "text-info" : "text-positive")}>
                {formatPercent(row.driftPct, language)}
              </p>
            </div>
          </div>
          <div className="relative mt-3 h-2 rounded-full bg-surface-2">
            <div className="absolute h-full rounded-full bg-muted-foreground/40" style={{ width: `${Math.min(100, row.targetPct)}%` }} />
            <div
              className={cn("absolute top-0 h-2 w-0.5", "bg-foreground")}
              style={{ left: `${Math.min(100, row.targetPct)}%` }}
            />
            <div
              className={cn("absolute h-full rounded-full opacity-70", row.status === "overweight" ? "bg-warning" : row.status === "underweight" ? "bg-info" : "bg-positive")}
              style={{ width: `${Math.min(100, row.actualPct)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
