"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { clsx } from "clsx";

interface DayAvailability {
  date: string;
  status: "available" | "unavailable" | "past";
  availableSlots: number;
  totalSlots: number;
}

const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const WEEKDAYS_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKDAYS_AR = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];

export function BookingCalendar({
  selectedDate,
  onSelect,
}: {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("booking.step3");
  const now = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [loaded, setLoaded] = useState<{ key: string; days: DayAvailability[] } | null>(null);

  const monthKey = `${viewYear}-${viewMonth}`;
  const loading = loaded?.key !== monthKey;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/availability/month?year=${viewYear}&month=${viewMonth}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setLoaded({ key: `${viewYear}-${viewMonth}`, days: data.days ?? [] }); });
    return () => { cancelled = true; };
  }, [viewYear, viewMonth]);

  const days = loading ? [] : loaded!.days;
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  const firstOfMonth = new Date(Date.UTC(viewYear, viewMonth, 1));
  // Saturday-start week (0=Sun..6=Sat -> shift so Sat=0)
  const firstWeekday = (firstOfMonth.getUTCDay() + 1) % 7;
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isPastMonth = viewYear === now.getFullYear() && viewMonth <= now.getMonth();

  function go(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewYear(y); setViewMonth(m);
  }

  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={isPastMonth}
          className="rounded-full p-2 text-navy-600 hover:bg-navy-50 disabled:opacity-30"
          aria-label="Previous month"
        >
          {isAr ? "›" : "‹"}
        </button>
        <p className="font-display text-lg text-navy-900">
          {(isAr ? MONTH_NAMES_AR : MONTH_NAMES_EN)[viewMonth]} {viewYear}
        </p>
        <button type="button" onClick={() => go(1)} className="rounded-full p-2 text-navy-600 hover:bg-navy-50" aria-label="Next month">
          {isAr ? "‹" : "›"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-navy-400">
        {(isAr ? WEEKDAYS_AR : WEEKDAYS_EN).map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const info = byDate.get(dateStr);
          const isSelected = selectedDate === dateStr;
          const isAvailable = info?.status === "available";
          const isPast = info?.status === "past";

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isAvailable || loading}
              onClick={() => onSelect(dateStr)}
              className={clsx(
                "relative flex aspect-square items-center justify-center rounded-lg text-sm font-medium tabular-nums-ltr transition-colors",
                isPast && "text-navy-200",
                !isPast && !isAvailable && "text-navy-300 bg-risk-red/5 line-through decoration-risk-red/40",
                isAvailable && !isSelected && "bg-risk-green/10 text-navy-800 hover:bg-risk-green/20",
                isSelected && "bg-navy-800 text-cream-50"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-navy-100 pt-4 text-xs text-navy-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-risk-green" /> {t("legendAvailable")}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-risk-red" /> {t("legendUnavailable")}</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-navy-800" /> {t("legendSelected")}</span>
      </div>
    </div>
  );
}
