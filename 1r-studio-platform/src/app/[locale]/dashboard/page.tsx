import { getTranslations, getLocale } from "next-intl/server";
import { resolvePeriodFromParams } from "@/lib/period-params";
import { getOverviewBundle } from "@/lib/dashboard-data";
import { formatCurrency, type Locale } from "@/lib/format";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { HealthScoreCard } from "@/components/dashboard/health-score-card";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { Card } from "@/components/ui/primitives";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const { key, resolved } = resolvePeriodFromParams(sp, now);
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dashboard");
  const tk = await getTranslations("dashboard.kpi");

  const bundle = await getOverviewBundle(resolved, now);
  const { current, comparison, healthScore, insights } = bundle;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl text-navy-900">{t("welcomeBack")}, 1R. Studio</h1>
        <PeriodFilter current={key} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={tk("revenue")} value={formatCurrency(current.revenue, locale)} comparison={comparison.revenue} locale={locale} prominent />
        <KpiCard label={tk("orders")} value={String(current.ordersCount)} comparison={comparison.orders} locale={locale} />
        <KpiCard label={tk("aov")} value={formatCurrency(current.aov, locale)} comparison={comparison.aov} locale={locale} />
        <KpiCard label={tk("expenses")} value={formatCurrency(current.totalExpenses, locale)} comparison={comparison.expenses} locale={locale} invertTrendColor />
        <KpiCard label={tk("grossProfit")} value={formatCurrency(current.grossProfit, locale)} comparison={comparison.grossProfit} locale={locale} />
        <KpiCard label={tk("netProfit")} value={formatCurrency(current.netProfit, locale)} comparison={comparison.netProfit} locale={locale} prominent />
        <KpiCard label={tk("netMargin")} value={`${current.netMargin.toFixed(1)}%`} comparison={comparison.netMargin} locale={locale} />
        <KpiCard label={tk("cancelledOrders")} value={String(current.cancelledCount)} comparison={comparison.cancelledOrders} locale={locale} invertTrendColor />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <HealthScoreCard score={healthScore} locale={locale} />
        </div>
        <div className="lg:col-span-2">
          <InsightsPanel insights={insights} />
        </div>
      </div>

      <OutstandingCard current={current} locale={locale} />
    </div>
  );
}

async function OutstandingCard({ current, locale }: { current: Awaited<ReturnType<typeof getOverviewBundle>>["current"]; locale: Locale }) {
  const t = await getTranslations("dashboard.expenses");
  return (
    <Card className="grid gap-4 p-6 sm:grid-cols-3">
      <div>
        <p className="text-xs font-medium text-navy-500">{t("expenseRatio")}</p>
        <p className="font-display mt-1 text-xl text-navy-900 tabular-nums-ltr">{current.expenseRatio.toFixed(1)}%</p>
      </div>
      <div>
        <p className="text-xs font-medium text-navy-500">{t("costPerOrder")}</p>
        <p className="font-display mt-1 text-xl text-navy-900 tabular-nums-ltr">
          {current.ordersCount > 0 ? formatCurrency(current.totalExpenses / current.ordersCount, locale) : "—"}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium text-navy-500">{locale === "ar" ? "المبلغ المستحق" : "Outstanding Amount"}</p>
        <p className="font-display mt-1 text-xl text-navy-900 tabular-nums-ltr">{formatCurrency(current.outstandingAmount, locale)}</p>
      </div>
    </Card>
  );
}
