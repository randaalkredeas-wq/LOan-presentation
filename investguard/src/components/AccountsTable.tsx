"use client";

import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { AccountSummaryRow } from "@/calculations/portfolioCalculations";
import { Currency } from "@/types";
import { Badge, riskLevelTone } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import { cn } from "@/utils/cn";

export function AccountsTable({
  rows,
  baseCurrency,
  onView,
  onEdit,
  onDelete,
}: {
  rows: AccountSummaryRow[];
  baseCurrency: Currency;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { t, language } = useLanguage();

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[880px] text-start text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-xs text-muted-foreground">
            <th className="px-3 py-2.5 text-start font-medium">{t("accounts.platformName")}</th>
            <th className="px-3 py-2.5 text-start font-medium">{t("accounts.accountName")}</th>
            <th className="px-3 py-2.5 text-start font-medium">{t("accounts.currency")}</th>
            <th className="px-3 py-2.5 text-end font-medium">{t("accounts.totalValue")}</th>
            <th className="px-3 py-2.5 text-end font-medium">{t("accounts.return")}</th>
            <th className="px-3 py-2.5 text-end font-medium">{t("accounts.allocation")}</th>
            <th className="px-3 py-2.5 text-start font-medium">{t("accounts.riskScore")}</th>
            <th className="px-3 py-2.5 text-end font-medium">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.account.id} className="border-b border-border last:border-0 hover:bg-surface-2/60 transition-colors">
              <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                    style={{ backgroundColor: r.platform.logoColor }}
                  >
                    {r.platform.name.slice(0, 1)}
                  </span>
                  <span className="font-medium text-foreground">{r.platform.name}</span>
                </div>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{r.account.name}</td>
              <td className="px-3 py-3 text-muted-foreground">{r.account.currency}</td>
              <td className="px-3 py-3 text-end tabular-nums font-semibold text-foreground">
                {formatCurrency(r.valueBase, baseCurrency, language)}
              </td>
              <td className={cn("px-3 py-3 text-end tabular-nums font-medium", r.returnPct >= 0 ? "text-positive" : "text-negative")}>
                {formatPercent(r.returnPct, language)}
              </td>
              <td className="px-3 py-3 text-end tabular-nums text-muted-foreground">{formatPercent(r.allocationPct, language, { signed: false })}</td>
              <td className="px-3 py-3">
                <Badge tone={riskLevelTone(r.account.riskLevel)}>{t(`riskLevel.${r.account.riskLevel}`)}</Badge>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-1">
                  {onView && (
                    <button onClick={() => onView(r.account.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground" aria-label="view">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onEdit && (
                    <button onClick={() => onEdit(r.account.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground" aria-label="edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(r.account.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-negative-bg hover:text-negative" aria-label="delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
