import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { resolvePeriodFromParams } from "@/lib/period-params";
import { getFinancialSummary, compareFinancials } from "@/lib/finance";
import { getMonthlySeries } from "@/lib/dashboard-data";
import { formatCurrency, formatPercent, type Locale } from "@/lib/format";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { MonthlyTrendChart } from "@/components/dashboard/charts/monthly-trend-chart";
import { Card, TrendArrow } from "@/components/ui/primitives";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const { key, resolved } = resolvePeriodFromParams(sp, now);
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dashboard.sales");
  const tc = await getTranslations("common");
  const td = await getTranslations("dashboard.kpi");

  const [current, previous, series] = await Promise.all([
    getFinancialSummary(prisma, resolved.current),
    getFinancialSummary(prisma, resolved.previous),
    getMonthlySeries(now, 6, locale),
  ]);
  const comparison = compareFinancials(current, previous);

  const revenueData = series.map((p) => ({ label: p.label, bar: p.revenue, line: p.netProfit }));
  const ordersData = series.map((p) => ({ label: p.label, bar: p.orders, line: p.expenses }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl text-navy-900">{t("title")}</h1>
        <PeriodFilter current={key} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <GrowthCard label={t("revenueGrowth")} comparison={comparison.revenue} locale={locale} isCurrency />
        <GrowthCard label={t("orderGrowth")} comparison={comparison.orders} locale={locale} />
        <GrowthCard label={t("profitGrowth")} comparison={comparison.netProfit} locale={locale} isCurrency />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm font-semibold text-navy-800">{t("monthlyRevenue")}</p>
          <p className="text-xs text-navy-400">{tc("brand")} · {locale === "ar" ? "آخر 6 أشهر" : "last 6 months"}</p>
          <div className="mt-4"><MonthlyTrendChart data={revenueData} barLabel={t("monthlyRevenue")} lineLabel={td("netProfit")} /></div>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-semibold text-navy-800">{t("monthlyOrders")}</p>
          <p className="text-xs text-navy-400">{locale === "ar" ? "آخر 6 أشهر" : "last 6 months"}</p>
          <div className="mt-4"><MonthlyTrendChart data={ordersData} barLabel={t("monthlyOrders")} lineLabel={td("expenses")} /></div>
        </Card>
      </div>
    </div>
  );
}

async function GrowthCard({
  label, comparison, locale, isCurrency,
}: { label: string; comparison: ReturnType<typeof compareFinancials>["revenue"]; locale: Locale; isCurrency?: boolean }) {
  const t = await getTranslations("dashboard.sales");
  const fmt = (v: number) => (isCurrency ? formatCurrency(v, locale, { decimals: 0 }) : v.toString());
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-navy-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <TrendArrow trend={comparison.trend} className="text-xl" />
        <span className="font-display text-2xl text-navy-900 tabular-nums-ltr">{formatPercent(comparison.changePercent, locale, { signed: true })}</span>
      </div>
      <div className="mt-3 flex justify-between text-xs text-navy-500">
        <span>{t("current")}: <span className="tabular-nums-ltr font-medium text-navy-700">{fmt(comparison.current)}</span></span>
        <span>{t("previous")}: <span className="tabular-nums-ltr font-medium text-navy-700">{fmt(comparison.previous)}</span></span>
      </div>
    </Card>
  );
}
