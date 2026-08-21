"use client";

import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { DateRangeKey } from "@/types";
import { DATE_RANGE_KEYS } from "@/utils/dateRange";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/utils/cn";

export function DateRangeSelector({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
  className,
}: {
  value: DateRangeKey;
  onChange: (v: DateRangeKey) => void;
  customRange?: { from: string; to: string };
  onCustomRangeChange?: (r: { from: string; to: string }) => void;
  className?: string;
}) {
  const { t } = useLanguage();
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className={cn("relative flex items-center gap-1 rounded-lg border border-border bg-surface-2 p-1 flex-wrap", className)}>
      {DATE_RANGE_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => {
            if (key === "CUSTOM") {
              setShowCustom((s) => !s);
            } else {
              setShowCustom(false);
            }
            onChange(key);
          }}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
            value === key ? "bg-surface text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {key === "CUSTOM" ? <Calendar className="h-3.5 w-3.5" /> : t(`dateRange.${key}`)}
        </button>
      ))}
      {showCustom && onCustomRangeChange && customRange && (
        <div className="absolute top-full mt-2 start-0 z-20 flex items-center gap-2 rounded-lg border border-border bg-surface p-3 shadow-lg">
          <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
            {t("common.from")}
            <input
              type="date"
              value={customRange.from}
              onChange={(e) => onCustomRangeChange({ ...customRange, from: e.target.value })}
              className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
            {t("common.to")}
            <input
              type="date"
              value={customRange.to}
              onChange={(e) => onCustomRangeChange({ ...customRange, to: e.target.value })}
              className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-foreground"
            />
          </label>
        </div>
      )}
    </div>
  );
}
