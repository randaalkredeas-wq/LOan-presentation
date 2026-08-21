"use client";

import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/utils/cn";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center rounded-lg border border-border bg-surface-2 p-0.5 text-xs font-semibold">
      <button
        onClick={() => setLanguage("en")}
        className={cn(
          "rounded-md px-2.5 py-1.5 transition-colors",
          language === "en" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        aria-pressed={language === "en"}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("ar")}
        className={cn(
          "rounded-md px-2.5 py-1.5 transition-colors",
          language === "ar" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        aria-pressed={language === "ar"}
      >
        عربي
      </button>
    </div>
  );
}
