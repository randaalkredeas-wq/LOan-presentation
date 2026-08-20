import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { resolvePeriodFromParams } from "@/lib/period-params";
import { getFinancialSummary, getExpenseBreakdown } from "@/lib/finance";
import { getMonthlySeries } from "@/lib/dashboard-data";
import { formatCurrency, formatDateShort, type Locale } from "@/lib/format";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { BreakdownBars } from "@/components/dashboard/charts/breakdown-bars";
import { MonthlyTrendChart } from "@/components/dashboard/charts/monthly-trend-chart";
import { AddExpenseForm } from "@/components/dashboard/add-expense-form";
import { Card } from "@/components/ui/primitives";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const { key, resolved } = resolvePeriodFromParams(sp, now);
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dashboard.expenses");
  const td = await getTranslations("dashboard.kpi");

  const [current, breakdown, series, categories, recentExpenses] = await Promise.all([
    getFinancialSummary(prisma, resolved.current),
    getExpenseBreakdown(prisma, resolved.current),
    getMonthlySeries(now, 6, locale),
    prisma.expenseCategory.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.expense.findMany({
      where: { date: { gte: resolved.current.start, lte: resolved.current.end } },
      include: { category: true }, orderBy: { date: "desc" }, take: 20,
    }),
  ]);

  const expenseVsRevenue = series.map((p) => ({ label: p.label, bar: p.expenses, line: p.revenue }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl text-navy-900">{t("title")}</h1>
        <div className="flex items-center gap-3">
          <PeriodFilter current={key} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-5"><p className="text-xs text-navy-500">{td("expenses")}</p><p className="font-display mt-1 text-xl text-navy-900 tabular-nums-ltr">{formatCurrency(current.totalExpenses, locale, { decimals: 0 })}</p></Card>
        <Card className="p-5"><p className="text-xs text-navy-500">{t("expenseRatio")}</p><p className="font-display mt-1 text-xl text-navy-900 tabular-nums-ltr">{current.expenseRatio.toFixed(1)}%</p></Card>
        <Card className="p-5"><p className="text-xs text-navy-500">{t("costPerOrder")}</p><p className="font-display mt-1 text-xl text-navy-900 tabular-nums-ltr">{current.ordersCount > 0 ? formatCurrency(current.totalExpenses / current.ordersCount, locale, { decimals: 0 }) : "—"}</p></Card>
        <Card className="p-5"><p className="text-xs text-navy-500">{t("direct")}</p><p className="font-display mt-1 text-xl text-navy-900 tabular-nums-ltr">{formatCurrency(current.directCosts, locale, { decimals: 0 })}</p></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm font-semibold text-navy-800">{t("breakdown")}</p>
          <div className="mt-4">{breakdown.length > 0 ? <BreakdownBars items={breakdown} locale={locale} /> : <p className="text-sm text-navy-400">—</p>}</div>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-semibold text-navy-800">{t("revenueVsExpenses")}</p>
          <div className="mt-4"><MonthlyTrendChart data={expenseVsRevenue} barLabel={t("title")} lineLabel={td("revenue")} /></div>
        </Card>
      </div>

      <AddExpenseForm categories={categories} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-4 py-3 text-start">{t("name")}</th>
                <th className="px-4 py-3 text-start">{t("category")}</th>
                <th className="px-4 py-3 text-start">{t("date")}</th>
                <th className="px-4 py-3 text-start">{t("type")}</th>
                <th className="px-4 py-3 text-start">{t("amount")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {recentExpenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-medium text-navy-800">{e.name}</td>
                  <td className="px-4 py-3 text-navy-600">{locale === "ar" ? e.category.nameAr : e.category.nameEn}</td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-500">{formatDateShort(e.date, locale)}</td>
                  <td className="px-4 py-3 text-navy-600">{e.expenseType === "DIRECT" ? t("direct") : t("operating")}</td>
                  <td className="px-4 py-3 tabular-nums-ltr font-semibold text-navy-900">{formatCurrency(e.amount.toString(), locale, { decimals: 0 })}</td>
                </tr>
              ))}
              {recentExpenses.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-navy-400">—</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
