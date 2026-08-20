// Core financial calculation engine — every number is derived from the database, never hardcoded.
import type { PrismaClient } from "@prisma/client";
import type { DateRange } from "./periods";
import { growthPercent, trendOf, type Trend } from "./periods";

export interface FinancialSummary {
  revenue: number;
  ordersCount: number;
  cancelledCount: number;
  aov: number;
  directCosts: number; // from order package cost snapshots + recorded DIRECT expenses
  operatingExpenses: number; // recorded OPERATING expenses
  totalExpenses: number; // directCosts + operatingExpenses
  grossProfit: number; // revenue - directCosts
  netProfit: number; // revenue - totalExpenses
  grossMargin: number; // %
  netMargin: number; // %
  expenseRatio: number; // totalExpenses / revenue * 100
  outstandingAmount: number;
  outstandingOrdersCount: number;
}

export interface MetricComparison<T = number> {
  current: T;
  previous: T;
  changePercent: number;
  trend: Trend;
}

const ACTIVE_STATUSES = ["NEW", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] as const;

export async function getFinancialSummary(
  db: PrismaClient,
  range: DateRange
): Promise<FinancialSummary> {
  const [orders, cancelledCount, expenses, payments] = await Promise.all([
    db.order.findMany({
      where: { eventDate: { gte: range.start, lte: range.end }, status: { in: [...ACTIVE_STATUSES] } },
      select: { total: true, directCostSnapshot: true, paymentStatus: true, id: true },
    }),
    db.order.count({
      where: { eventDate: { gte: range.start, lte: range.end }, status: "CANCELLED" },
    }),
    db.expense.findMany({
      where: { date: { gte: range.start, lte: range.end } },
      select: { amount: true, expenseType: true },
    }),
    db.payment.findMany({
      where: { order: { eventDate: { gte: range.start, lte: range.end }, status: { in: [...ACTIVE_STATUSES] } } },
      select: { amount: true },
    }),
  ]);

  const revenue = sum(orders.map((o) => Number(o.total)));
  const ordersCount = orders.length;
  const aov = ordersCount > 0 ? revenue / ordersCount : 0;

  const directCostsFromOrders = sum(orders.map((o) => Number(o.directCostSnapshot)));
  const recordedDirectExpenses = sum(
    expenses.filter((e) => e.expenseType === "DIRECT").map((e) => Number(e.amount))
  );
  const operatingExpenses = sum(
    expenses.filter((e) => e.expenseType === "OPERATING").map((e) => Number(e.amount))
  );
  const directCosts = directCostsFromOrders + recordedDirectExpenses;
  const totalExpenses = directCosts + operatingExpenses;

  const grossProfit = revenue - directCosts;
  const netProfit = revenue - totalExpenses;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const expenseRatio = revenue > 0 ? (totalExpenses / revenue) * 100 : 0;

  const paid = sum(payments.map((p) => Number(p.amount)));
  const outstandingAmount = Math.max(revenue - paid, 0);
  const outstandingOrdersCount = orders.filter(
    (o) => o.paymentStatus === "UNPAID" || o.paymentStatus === "PARTIALLY_PAID"
  ).length;

  return {
    revenue, ordersCount, cancelledCount, aov,
    directCosts, operatingExpenses, totalExpenses,
    grossProfit, netProfit, grossMargin, netMargin, expenseRatio,
    outstandingAmount, outstandingOrdersCount,
  };
}

export function compare(current: number, previous: number): MetricComparison {
  return { current, previous, changePercent: growthPercent(current, previous), trend: trendOf(current, previous) };
}

export interface FinancialComparison {
  revenue: MetricComparison;
  orders: MetricComparison;
  aov: MetricComparison;
  expenses: MetricComparison;
  grossProfit: MetricComparison;
  netProfit: MetricComparison;
  netMargin: MetricComparison;
  cancelledOrders: MetricComparison;
}

export function compareFinancials(current: FinancialSummary, previous: FinancialSummary): FinancialComparison {
  return {
    revenue: compare(current.revenue, previous.revenue),
    orders: compare(current.ordersCount, previous.ordersCount),
    aov: compare(current.aov, previous.aov),
    expenses: compare(current.totalExpenses, previous.totalExpenses),
    grossProfit: compare(current.grossProfit, previous.grossProfit),
    netProfit: compare(current.netProfit, previous.netProfit),
    netMargin: compare(current.netMargin, previous.netMargin),
    cancelledOrders: compare(current.cancelledCount, previous.cancelledCount),
  };
}

// ── Break-even analysis ─────────────────────────────────────────────────
export interface BreakEven {
  fixedCosts: number;
  contributionMarginPercent: number; // gross margin %, used as proxy contribution margin
  breakEvenRevenue: number;
  avgContributionPerOrder: number;
  breakEvenOrders: number;
  actualRevenue: number;
  actualOrders: number;
  gapToBreakEvenRevenue: number; // positive = above break-even, negative = below
  status: "above" | "below" | "at";
}

export function calculateBreakEven(
  summary: FinancialSummary,
  fixedCostsMonthly: number,
  periodMonths: number
): BreakEven {
  const fixedCosts = fixedCostsMonthly * periodMonths;
  const contributionMarginPercent = summary.grossMargin; // revenue - direct costs, as % of revenue
  const breakEvenRevenue = contributionMarginPercent > 0 ? fixedCosts / (contributionMarginPercent / 100) : Infinity;
  const avgContributionPerOrder = summary.ordersCount > 0 ? summary.grossProfit / summary.ordersCount : 0;
  const breakEvenOrders = avgContributionPerOrder > 0 ? fixedCosts / avgContributionPerOrder : Infinity;
  const gap = summary.revenue - breakEvenRevenue;
  return {
    fixedCosts, contributionMarginPercent, breakEvenRevenue, avgContributionPerOrder, breakEvenOrders,
    actualRevenue: summary.revenue, actualOrders: summary.ordersCount,
    gapToBreakEvenRevenue: gap,
    status: gap > 0.01 ? "above" : gap < -0.01 ? "below" : "at",
  };
}

// ── Package profitability (Part 10) ─────────────────────────────────────
export interface PackageProfitability {
  packageId: string;
  nameEn: string;
  nameAr: string;
  sellingPrice: number;
  directCost: number;
  contribution: number;
  profitMargin: number; // %
  ordersCount: number;
  revenue: number;
  profit: number;
  revenueShare: number; // % of total revenue
  profitShare: number; // % of total profit
}

export async function getPackageProfitability(
  db: PrismaClient,
  range: DateRange
): Promise<PackageProfitability[]> {
  const orders = await db.order.findMany({
    where: { eventDate: { gte: range.start, lte: range.end }, status: { in: [...ACTIVE_STATUSES] } },
    select: {
      total: true, directCostSnapshot: true, packageId: true,
      package: { select: { id: true, nameEn: true, nameAr: true, price: true, directCost: true } },
    },
  });

  const map = new Map<string, PackageProfitability>();
  for (const o of orders) {
    const pkg = o.package;
    let entry = map.get(pkg.id);
    if (!entry) {
      entry = {
        packageId: pkg.id, nameEn: pkg.nameEn, nameAr: pkg.nameAr,
        sellingPrice: Number(pkg.price), directCost: Number(pkg.directCost),
        contribution: Number(pkg.price) - Number(pkg.directCost),
        profitMargin: Number(pkg.price) > 0 ? ((Number(pkg.price) - Number(pkg.directCost)) / Number(pkg.price)) * 100 : 0,
        ordersCount: 0, revenue: 0, profit: 0, revenueShare: 0, profitShare: 0,
      };
      map.set(pkg.id, entry);
    }
    entry.ordersCount += 1;
    entry.revenue += Number(o.total);
    entry.profit += Number(o.total) - Number(o.directCostSnapshot);
  }

  const list = Array.from(map.values());
  const totalRevenue = sum(list.map((p) => p.revenue));
  const totalProfit = sum(list.map((p) => p.profit));
  for (const p of list) {
    p.revenueShare = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
    p.profitShare = totalProfit > 0 ? (p.profit / totalProfit) * 100 : 0;
  }
  return list.sort((a, b) => b.revenue - a.revenue);
}

// ── Expense breakdown (Part 8) ──────────────────────────────────────────
export interface ExpenseCategoryBreakdown {
  categoryId: string;
  nameEn: string;
  nameAr: string;
  type: "DIRECT" | "OPERATING";
  total: number;
  share: number; // % of total expenses (direct-from-orders excluded — recorded expenses only)
}

export async function getExpenseBreakdown(db: PrismaClient, range: DateRange): Promise<ExpenseCategoryBreakdown[]> {
  const expenses = await db.expense.findMany({
    where: { date: { gte: range.start, lte: range.end } },
    select: { amount: true, category: { select: { id: true, nameEn: true, nameAr: true, type: true } } },
  });
  const map = new Map<string, ExpenseCategoryBreakdown>();
  for (const e of expenses) {
    const c = e.category;
    let entry = map.get(c.id);
    if (!entry) {
      entry = { categoryId: c.id, nameEn: c.nameEn, nameAr: c.nameAr, type: c.type, total: 0, share: 0 };
      map.set(c.id, entry);
    }
    entry.total += Number(e.amount);
  }
  const list = Array.from(map.values());
  const grand = sum(list.map((e) => e.total));
  for (const e of list) e.share = grand > 0 ? (e.total / grand) * 100 : 0;
  return list.sort((a, b) => b.total - a.total);
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
