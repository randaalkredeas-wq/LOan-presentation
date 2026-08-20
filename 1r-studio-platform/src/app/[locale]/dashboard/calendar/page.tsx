import { getTranslations, getLocale } from "next-intl/server";
import { clsx } from "clsx";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { formatCurrency, type Locale } from "@/lib/format";
import { Card, StatusBadge } from "@/components/ui/primitives";

const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const WEEKDAYS_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const WEEKDAYS_AR = ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];

const STATUS_DOT: Record<string, string> = {
  NEW: "bg-navy-400", PENDING: "bg-risk-yellow", CONFIRMED: "bg-risk-green",
  IN_PROGRESS: "bg-accent-500", COMPLETED: "bg-navy-800", CANCELLED: "bg-risk-red",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year) || now.getFullYear();
  const month = sp.month ? Number(sp.month) : now.getMonth(); // 0-indexed
  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("dashboard.calendar");
  const tc = await getTranslations("common");

  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));

  const orders = await prisma.order.findMany({
    where: { eventDate: { gte: firstDay, lte: lastDay } },
    include: { customer: true, service: true, package: true },
    orderBy: { eventTime: "asc" },
  });

  const byDate = new Map<string, typeof orders>();
  for (const o of orders) {
    const key = o.eventDate.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(o);
  }

  const firstWeekday = (firstDay.getUTCDay() + 1) % 7;
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: lastDay.getUTCDate() }, (_, i) => i + 1)];

  const selectedDate = sp.date ?? null;
  const selectedOrders = selectedDate ? byDate.get(selectedDate) ?? [] : [];

  function monthUrl(delta: number) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; } if (m > 11) { m = 0; y += 1; }
    return `/dashboard/calendar?year=${y}&month=${m}`;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-navy-900">{t("title")}</h1>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <Link href={monthUrl(-1)} className="rounded-full p-2 text-navy-600 hover:bg-navy-50">{isAr ? "›" : "‹"}</Link>
          <p className="font-display text-lg text-navy-900">{(isAr ? MONTH_NAMES_AR : MONTH_NAMES_EN)[month]} {year}</p>
          <Link href={monthUrl(1)} className="rounded-full p-2 text-navy-600 hover:bg-navy-50">{isAr ? "‹" : "›"}</Link>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-navy-400">
          {(isAr ? WEEKDAYS_AR : WEEKDAYS_EN).map((w) => <div key={w}>{w}</div>)}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayOrders = byDate.get(dateStr) ?? [];
            return (
              <Link
                key={dateStr}
                href={`/dashboard/calendar?year=${year}&month=${month}&date=${dateStr}`}
                className={clsx(
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-sm transition-colors",
                  selectedDate === dateStr ? "bg-navy-800 text-cream-50" : "hover:bg-cream-100 text-navy-700"
                )}
              >
                <span className="tabular-nums-ltr">{day}</span>
                {dayOrders.length > 0 && (
                  <span className="flex gap-0.5">
                    {dayOrders.slice(0, 3).map((o) => <span key={o.id} className={clsx("h-1.5 w-1.5 rounded-full", STATUS_DOT[o.status])} />)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </Card>

      {selectedDate && (
        <Card className="p-6">
          <p className="text-sm font-semibold text-navy-800 tabular-nums-ltr">{selectedDate}</p>
          <div className="mt-4 space-y-3">
            {selectedOrders.length === 0 && <p className="text-sm text-navy-400">—</p>}
            {selectedOrders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 p-3">
                <div>
                  <p className="text-sm font-medium text-navy-800">{o.customer.fullName} · <span dir="ltr">{o.eventTime}</span></p>
                  <p className="text-xs text-navy-500">{isAr ? o.service.nameAr : o.service.nameEn} — {isAr ? o.package.nameAr : o.package.nameEn}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums-ltr text-sm font-semibold text-navy-900">{formatCurrency(o.total.toString(), locale, { decimals: 0 })}</span>
                  <StatusBadge status={o.status} label={tc(`status.${o.status}`)} />
                  <StatusBadge status={o.paymentStatus} label={tc(`status.${o.paymentStatus}`)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
