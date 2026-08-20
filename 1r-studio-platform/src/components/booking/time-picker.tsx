"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { clsx } from "clsx";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/lib/format";

interface Slot { label: string; available: boolean }

export function TimePicker({
  date,
  selectedTime,
  onSelect,
}: {
  date: string;
  selectedTime: string | null;
  onSelect: (time: string) => void;
}) {
  const t = useTranslations("booking.step4");
  const locale = useLocale() as Locale;
  const [loaded, setLoaded] = useState<{ date: string; slots: Slot[] } | null>(null);
  const loading = loaded?.date !== date;
  const slots = loading ? [] : loaded!.slots;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/availability/day?date=${date}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setLoaded({ date, slots: data.slots ?? [] }); });
    return () => { cancelled = true; };
  }, [date]);

  return (
    <div>
      <p className="text-sm text-navy-500">{t("subtitle", { date: formatDate(date, locale) })}</p>
      {loading ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-navy-100/60" />)}
        </div>
      ) : slots.every((s) => !s.available) ? (
        <p className="mt-6 rounded-xl bg-risk-red/5 p-4 text-sm text-risk-red">{t("noSlots")}</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {slots.map((s) => (
            <button
              key={s.label}
              type="button"
              disabled={!s.available}
              onClick={() => onSelect(s.label)}
              className={clsx(
                "flex flex-col items-center justify-center gap-1 rounded-xl border py-4 text-sm font-semibold tabular-nums-ltr transition-colors",
                !s.available && "cursor-not-allowed border-navy-100 bg-cream-100 text-navy-300 line-through",
                s.available && selectedTime !== s.label && "border-risk-green/40 bg-risk-green/5 text-navy-800 hover:bg-risk-green/15",
                s.available && selectedTime === s.label && "border-navy-800 bg-navy-800 text-cream-50"
              )}
            >
              {s.label}
              {!s.available && <span className="text-[10px] font-normal">{t("unavailable")}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
