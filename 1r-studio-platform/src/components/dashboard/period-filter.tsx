"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import type { PeriodKey } from "@/lib/periods";

const KEYS: PeriodKey[] = [
  "today", "this_week", "this_month", "last_month",
  "this_quarter", "last_quarter", "this_year", "last_year", "custom",
];

export function PeriodFilter({ current }: { current: PeriodKey }) {
  const t = useTranslations("common.periods");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCustom, setShowCustom] = useState(current === "custom");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  function setPeriod(key: PeriodKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", key);
    if (key !== "custom") { params.delete("from"); params.delete("to"); }
    router.push(`${pathname}?${params.toString()}`);
    setShowCustom(key === "custom");
  }

  function applyCustom() {
    if (!from || !to) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set("from", from);
    params.set("to", to);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          onClick={() => setPeriod(key)}
          className={clsx(
            "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
            current === key ? "bg-navy-800 text-cream-50" : "bg-cream-200 text-navy-600 hover:bg-cream-300"
          )}
        >
          {t(key)}
        </button>
      ))}
      {showCustom && (
        <div className="flex items-center gap-2 rounded-full bg-cream-200 px-3 py-1.5">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent text-xs outline-none" />
          <span className="text-navy-400">–</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent text-xs outline-none" />
          <button onClick={applyCustom} className="text-xs font-semibold text-accent-600">✓</button>
        </div>
      )}
    </div>
  );
}
