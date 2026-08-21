"use client";

import React from "react";
import { Menu, Sparkles } from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { useDateRange } from "@/contexts/DateRangeContext";
import { useLanguage } from "@/i18n/LanguageContext";

export function Topbar({ onMenuClick, showDateRange = true }: { onMenuClick: () => void; showDateRange?: boolean }) {
  const { range, setRange, customRange, setCustomRange } = useDateRange();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/70 sm:px-6">
      <button className="text-muted-foreground lg:hidden" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-1.5 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand sm:flex">
        <Sparkles className="h-3 w-3" />
        {t("app.demoMode")}
      </div>

      <div className="ms-auto flex items-center gap-2.5">
        {showDateRange && (
          <DateRangeSelector
            value={range}
            onChange={setRange}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            className="hidden md:flex"
          />
        )}
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
