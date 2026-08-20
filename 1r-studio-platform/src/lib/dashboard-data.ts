// Orchestrates the library functions into ready-to-render bundles for dashboard pages.
import { prisma } from "./prisma";
import type { ResolvedPeriod } from "./periods";
import { differenceInCalendarMonths } from "date-fns";
import { lastNMonths, monthLabel } from "./periods";
import {
  getFinancialSummary, compareFinancials, calculateBreakEven,
  getPackageProfitability, getExpenseBreakdown,
} from "./finance";
import { computeRawKriValues, evaluateKris, calculateHealthScore } from "./kri";
import { generateInsights } from "./insights";

export async function getOverviewBundle(period: ResolvedPeriod, now: Date) {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const fixedCostsMonthly = Number(settings?.fixedCostsMonthly ?? 900);
  const periodMonths = Math.max(1, differenceInCalendarMonths(period.current.end, period.current.start) + 1);

  const [current, previous, breakEven, packages, expenseBreakdown, kriDefs, rawKris] = await Promise.all([
    getFinancialSummary(prisma, period.current),
    getFinancialSummary(prisma, period.previous),
    (async () => calculateBreakEven(await getFinancialSummary(prisma, period.current), fixedCostsMonthly, periodMonths))(),
    getPackageProfitability(prisma, period.current),
    getExpenseBreakdown(prisma, period.current),
    prisma.kriDefinition.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    computeRawKriValues(prisma, period.current, period.previous, fixedCostsMonthly, periodMonths, now),
  ]);

  const comparison = compareFinancials(current, previous);
  const kris = evaluateKris(kriDefs, rawKris);
  const healthScore = calculateHealthScore(
    kris,
    { revenueGrowth: comparison.revenue.changePercent, orderGrowth: comparison.orders.changePercent },
    (settings?.healthScoreWeights as Record<string, number>) ?? {}
  );
  const insights = generateInsights(comparison, current, breakEven, packages, expenseBreakdown);

  return { current, previous, comparison, breakEven, packages, expenseBreakdown, kris, healthScore, insights, settings };
}

export interface MonthlyPoint {
  label: string; monthLabel: string;
  revenue: number; orders: number; expenses: number; netProfit: number;
}

const MONTH_SHORT_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_SHORT_AR = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"];

export async function getMonthlySeries(now: Date, months: number, locale: "ar" | "en"): Promise<MonthlyPoint[]> {
  const ranges = lastNMonths(now, months);
  const points: MonthlyPoint[] = [];
  for (const range of ranges) {
    const s = await getFinancialSummary(prisma, range);
    const names = locale === "ar" ? MONTH_SHORT_AR : MONTH_SHORT_EN;
    points.push({
      label: names[range.start.getMonth()],
      monthLabel: monthLabel(range.start),
      revenue: s.revenue, orders: s.ordersCount, expenses: s.totalExpenses, netProfit: s.netProfit,
    });
  }
  return points;
}
