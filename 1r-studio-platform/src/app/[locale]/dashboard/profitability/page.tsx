import { getTranslations } from "next-intl/server";
import { differenceInCalendarMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { resolvePeriodFromParams } from "@/lib/period-params";
import { getFinancialSummary, calculateBreakEven, getPackageProfitability } from "@/lib/finance";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { ProfitWaterfall } from "@/components/dashboard/waterfall";
import { BreakEvenCard } from "@/components/dashboard/breakeven-card";
import { PackageProfitabilityTable } from "@/components/dashboard/package-profitability-table";
import { Card } from "@/components/ui/primitives";

export default async function ProfitabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const { key, resolved } = resolvePeriodFromParams(sp, now);
  const t = await getTranslations("dashboard.profitability");

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const fixedCostsMonthly = Number(settings?.fixedCostsMonthly ?? 900);
  const periodMonths = Math.max(1, differenceInCalendarMonths(resolved.current.end, resolved.current.start) + 1);

  const [current, packages] = await Promise.all([
    getFinancialSummary(prisma, resolved.current),
    getPackageProfitability(prisma, resolved.current),
  ]);
  const breakEven = calculateBreakEven(current, fixedCostsMonthly, periodMonths);
  const profitPerOrder = current.ordersCount > 0 ? current.netProfit / current.ordersCount : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl text-navy-900">{t("title")}</h1>
        <PeriodFilter current={key} />
      </div>

      <ProfitWaterfall
        revenue={current.revenue} directCosts={current.directCosts}
        grossProfit={current.grossProfit} operatingExpenses={current.operatingExpenses} netProfit={current.netProfit}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-xs text-navy-500">{t("grossMargin")}</p><p className="font-display mt-1 text-2xl text-navy-900 tabular-nums-ltr">{current.grossMargin.toFixed(1)}%</p></Card>
        <Card className="p-5"><p className="text-xs text-navy-500">{t("netMargin")}</p><p className="font-display mt-1 text-2xl text-navy-900 tabular-nums-ltr">{current.netMargin.toFixed(1)}%</p></Card>
        <Card className="p-5"><p className="text-xs text-navy-500">{t("profitPerOrder")}</p><p className="font-display mt-1 text-2xl text-navy-900 tabular-nums-ltr">{profitPerOrder.toFixed(0)}</p></Card>
      </div>

      <BreakEvenCard breakEven={breakEven} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-navy-800">{t("packageProfitability")}</h2>
        <PackageProfitabilityTable packages={packages} />
      </div>
    </div>
  );
}
