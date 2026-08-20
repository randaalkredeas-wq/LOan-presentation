// KRI (Key Risk Indicator) engine — "Is something becoming risky?"
// Values are computed from live DB data; thresholds come from the (owner-editable) KriDefinition rows.
import type { KriDefinition, PrismaClient } from "@prisma/client";
import type { DateRange } from "./periods";
import { growthPercent, trendOf, lastNMonths, type Trend } from "./periods";
import { getFinancialSummary, calculateBreakEven, sum, type FinancialSummary } from "./finance";

export type RiskLevel = "GREEN" | "YELLOW" | "ORANGE" | "RED";

export interface KriEvaluation {
  code: string;
  nameEn: string;
  nameAr: string;
  category: "FINANCIAL" | "OPERATIONAL";
  unit: string;
  value: number;
  previousValue: number;
  changePercent: number;
  trend: Trend;
  riskLevel: RiskLevel;
  thresholdYellow: number;
  thresholdOrange: number;
  thresholdRed: number;
  direction: "HIGHER_IS_RISK" | "LOWER_IS_RISK";
  descriptionEn: string;
  descriptionAr: string;
  recommendedActionEn: string;
  recommendedActionAr: string;
}

export function classifyRisk(
  value: number,
  def: Pick<KriDefinition, "thresholdYellow" | "thresholdOrange" | "thresholdRed" | "direction">
): RiskLevel {
  const y = Number(def.thresholdYellow), o = Number(def.thresholdOrange), r = Number(def.thresholdRed);
  if (def.direction === "HIGHER_IS_RISK") {
    if (value >= r) return "RED";
    if (value >= o) return "ORANGE";
    if (value >= y) return "YELLOW";
    return "GREEN";
  } else {
    if (value <= r) return "RED";
    if (value <= o) return "ORANGE";
    if (value <= y) return "YELLOW";
    return "GREEN";
  }
}

export const RISK_ORDER: Record<RiskLevel, number> = { RED: 3, ORANGE: 2, YELLOW: 1, GREEN: 0 };

interface RawKriValue {
  value: number;
  previousValue: number;
}

export interface KriContext {
  current: FinancialSummary;
  previous: FinancialSummary;
  fixedCostsMonthly: number;
  periodMonths: number;
}

const ACTIVE = ["NEW", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"] as const;
const CONFIRMED_PLUS = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"] as const;

export async function computeRawKriValues(
  db: PrismaClient,
  currentRange: DateRange,
  previousRange: DateRange,
  fixedCostsMonthly: number,
  periodMonths: number,
  now: Date
): Promise<Record<string, RawKriValue>> {
  const [current, previous] = await Promise.all([
    getFinancialSummary(db, currentRange),
    getFinancialSummary(db, previousRange),
  ]);

  const [
    currentAllOrders, previousAllOrders,
    currentCancelled, previousCancelled,
    currentConfirmed, previousConfirmed,
  ] = await Promise.all([
    db.order.count({ where: { eventDate: { gte: currentRange.start, lte: currentRange.end } } }),
    db.order.count({ where: { eventDate: { gte: previousRange.start, lte: previousRange.end } } }),
    db.order.count({ where: { eventDate: { gte: currentRange.start, lte: currentRange.end }, status: "CANCELLED" } }),
    db.order.count({ where: { eventDate: { gte: previousRange.start, lte: previousRange.end }, status: "CANCELLED" } }),
    db.order.count({ where: { eventDate: { gte: currentRange.start, lte: currentRange.end }, status: { in: [...CONFIRMED_PLUS] } } }),
    db.order.count({ where: { eventDate: { gte: previousRange.start, lte: previousRange.end }, status: { in: [...CONFIRMED_PLUS] } } }),
  ]);

  // Expense ratio
  const expenseRatio = { value: current.expenseRatio, previousValue: previous.expenseRatio };

  // Net margin (risk when LOW)
  const netMargin = { value: current.netMargin, previousValue: previous.netMargin };

  // Expense growth vs revenue growth gap (positive = expenses outgrowing revenue)
  const revenueGrowth = growthPercent(current.revenue, previous.revenue);
  const expenseGrowth = growthPercent(current.totalExpenses, previous.totalExpenses);
  const expenseVsRevenueGap = { value: expenseGrowth - revenueGrowth, previousValue: 0 };

  // Profit decline — count of consecutive trailing months where net profit fell vs the month before
  const monthly = lastNMonths(now, 6);
  const monthlyProfits: number[] = [];
  for (const m of monthly) {
    const s = await getFinancialSummary(db, m);
    monthlyProfits.push(s.netProfit);
  }
  let declineStreak = 0;
  for (let i = monthlyProfits.length - 1; i > 0; i--) {
    if (monthlyProfits[i] < monthlyProfits[i - 1]) declineStreak++;
    else break;
  }
  let prevDeclineStreak = 0;
  for (let i = monthlyProfits.length - 2; i > 0; i--) {
    if (monthlyProfits[i] < monthlyProfits[i - 1]) prevDeclineStreak++;
    else break;
  }
  const profitDecline = { value: declineStreak, previousValue: prevDeclineStreak };

  // Order volume decline (% drop, positive = decline magnitude)
  const orderVolumeChange = growthPercent(current.ordersCount, previous.ordersCount);
  const orderVolumeDecline = { value: orderVolumeChange < 0 ? Math.abs(orderVolumeChange) : 0, previousValue: 0 };

  // AOV decline (% drop, positive = decline magnitude)
  const aovChange = growthPercent(current.aov, previous.aov);
  const aovDecline = { value: aovChange < 0 ? Math.abs(aovChange) : 0, previousValue: 0 };

  // Cancellation rate
  const cancellationRate = {
    value: currentAllOrders > 0 ? (currentCancelled / currentAllOrders) * 100 : 0,
    previousValue: previousAllOrders > 0 ? (previousCancelled / previousAllOrders) * 100 : 0,
  };

  // Outstanding payments ratio (% of revenue outstanding)
  const outstandingRatio = {
    value: current.revenue > 0 ? (current.outstandingAmount / current.revenue) * 100 : 0,
    previousValue: previous.revenue > 0 ? (previous.outstandingAmount / previous.revenue) * 100 : 0,
  };

  // Fixed cost burden
  const fixedCostBurden = {
    value: current.revenue > 0 ? (fixedCostsMonthly * periodMonths / current.revenue) * 100 : 0,
    previousValue: previous.revenue > 0 ? (fixedCostsMonthly * periodMonths / previous.revenue) * 100 : 0,
  };

  // Break-even risk (% below break-even revenue; positive = below, negative = comfortably above)
  const be = calculateBreakEven(current, fixedCostsMonthly, periodMonths);
  const bePrev = calculateBreakEven(previous, fixedCostsMonthly, periodMonths);
  const breakEvenRisk = {
    value: Number.isFinite(be.breakEvenRevenue) && be.breakEvenRevenue > 0
      ? ((be.breakEvenRevenue - be.actualRevenue) / be.breakEvenRevenue) * 100 : 0,
    previousValue: Number.isFinite(bePrev.breakEvenRevenue) && bePrev.breakEvenRevenue > 0
      ? ((bePrev.breakEvenRevenue - bePrev.actualRevenue) / bePrev.breakEvenRevenue) * 100 : 0,
  };

  // Booking utilization: booked slots / available slots (working days × active time slots) in range
  const [timeSlots, settings] = await Promise.all([
    db.timeSlot.count({ where: { isActive: true } }),
    db.settings.findUnique({ where: { id: "singleton" } }),
  ]);
  const workingDays = settings?.workingDays ?? [0, 1, 2, 3, 4, 6];
  const capacity = (range: DateRange) => {
    let days = 0;
    const d = new Date(range.start);
    while (d <= range.end) {
      if (workingDays.includes(d.getDay())) days++;
      d.setDate(d.getDate() + 1);
    }
    return days * Math.max(timeSlots, 1);
  };
  const currentCapacity = capacity(currentRange);
  const previousCapacity = capacity(previousRange);
  const bookingUtilization = {
    value: currentCapacity > 0 ? (current.ordersCount / currentCapacity) * 100 : 0,
    previousValue: previousCapacity > 0 ? (previous.ordersCount / previousCapacity) * 100 : 0,
  };

  // Booking conversion rate: confirmed-or-further / all requests
  const bookingConversion = {
    value: currentAllOrders > 0 ? (currentConfirmed / currentAllOrders) * 100 : 0,
    previousValue: previousAllOrders > 0 ? (previousConfirmed / previousAllOrders) * 100 : 0,
  };

  // Repeat customer rate: of customers who ordered in period, % with >1 lifetime order
  const currentCustomerIds = await db.order.findMany({
    where: { eventDate: { gte: currentRange.start, lte: currentRange.end }, status: { in: [...ACTIVE] } },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  let repeatCount = 0;
  for (const c of currentCustomerIds) {
    const lifetimeOrders = await db.order.count({ where: { customerId: c.customerId, status: { in: [...ACTIVE] } } });
    if (lifetimeOrders > 1) repeatCount++;
  }
  const repeatCustomerRate = {
    value: currentCustomerIds.length > 0 ? (repeatCount / currentCustomerIds.length) * 100 : 0,
    previousValue: 0,
  };

  return {
    EXPENSE_RATIO: expenseRatio,
    NET_MARGIN: netMargin,
    EXPENSE_VS_REVENUE_GROWTH: expenseVsRevenueGap,
    PROFIT_DECLINE: profitDecline,
    ORDER_VOLUME_DECLINE: orderVolumeDecline,
    AOV_DECLINE: aovDecline,
    CANCELLATION_RATE: cancellationRate,
    OUTSTANDING_PAYMENTS: outstandingRatio,
    FIXED_COST_BURDEN: fixedCostBurden,
    BREAKEVEN_RISK: breakEvenRisk,
    BOOKING_UTILIZATION: bookingUtilization,
    BOOKING_CONVERSION: bookingConversion,
    REPEAT_CUSTOMER_RATE: repeatCustomerRate,
  };
}

export function evaluateKris(
  definitions: KriDefinition[],
  raw: Record<string, RawKriValue>
): KriEvaluation[] {
  return definitions
    .filter((d) => d.isActive && raw[d.code])
    .map((d) => {
      const { value, previousValue } = raw[d.code];
      return {
        code: d.code, nameEn: d.nameEn, nameAr: d.nameAr, category: d.category,
        unit: d.unit, value, previousValue,
        changePercent: growthPercent(value, previousValue),
        trend: trendOf(value, previousValue),
        riskLevel: classifyRisk(value, d),
        thresholdYellow: Number(d.thresholdYellow), thresholdOrange: Number(d.thresholdOrange), thresholdRed: Number(d.thresholdRed),
        direction: d.direction,
        descriptionEn: d.descriptionEn, descriptionAr: d.descriptionAr,
        recommendedActionEn: d.recommendedActionEn, recommendedActionAr: d.recommendedActionAr,
      } satisfies KriEvaluation;
    })
    .sort((a, b) => RISK_ORDER[b.riskLevel] - RISK_ORDER[a.riskLevel]);
}

/** Monthly value series per KRI code, for 3-/6-month trend sparklines (Part 13). */
export async function getKriTrendSeries(
  db: PrismaClient,
  fixedCostsMonthly: number,
  now: Date,
  months = 6
): Promise<Record<string, number[]>> {
  const monthRanges = lastNMonths(now, months + 1); // need one extra to compute the first month's "previous"
  const series: Record<string, number[]> = {};

  for (let i = 1; i < monthRanges.length; i++) {
    const raw = await computeRawKriValues(db, monthRanges[i], monthRanges[i - 1], fixedCostsMonthly, 1, now);
    for (const [code, { value }] of Object.entries(raw)) {
      if (!series[code]) series[code] = [];
      series[code].push(value);
    }
  }
  return series;
}

// ── Business Health Score (Part 15) — transparent, configurable weighting ──
export interface HealthScoreComponent {
  key: string;
  labelEn: string;
  labelAr: string;
  weight: number;
  rawScore: number; // 0-100
  weightedScore: number;
}

export interface HealthScore {
  score: number; // 0-100
  status: "healthy" | "attention" | "at_risk";
  components: HealthScoreComponent[];
}

export function calculateHealthScore(
  kris: KriEvaluation[],
  financials: { revenueGrowth: number; orderGrowth: number },
  weights: Record<string, number>
): HealthScore {
  const scoreFromRisk = (level: RiskLevel | undefined): number =>
    level === "GREEN" ? 100 : level === "YELLOW" ? 65 : level === "ORANGE" ? 35 : level === "RED" ? 10 : 50;
  const scoreFromGrowth = (g: number): number => Math.max(0, Math.min(100, 50 + g * 2.5));

  const byCode = Object.fromEntries(kris.map((k) => [k.code, k]));

  const components: Omit<HealthScoreComponent, "weightedScore">[] = [
    { key: "revenueGrowth", labelEn: "Revenue Growth", labelAr: "نمو الإيرادات", weight: weights.revenueGrowth ?? 15, rawScore: scoreFromGrowth(financials.revenueGrowth) },
    { key: "orderGrowth", labelEn: "Order Growth", labelAr: "نمو الطلبات", weight: weights.orderGrowth ?? 10, rawScore: scoreFromGrowth(financials.orderGrowth) },
    { key: "netMargin", labelEn: "Net Profit Margin", labelAr: "هامش صافي الربح", weight: weights.netMargin ?? 25, rawScore: scoreFromRisk(byCode.NET_MARGIN?.riskLevel) },
    { key: "expenseRatio", labelEn: "Expense-to-Revenue Ratio", labelAr: "نسبة المصروفات إلى الإيرادات", weight: weights.expenseRatio ?? 20, rawScore: scoreFromRisk(byCode.EXPENSE_RATIO?.riskLevel) },
    { key: "breakEven", labelEn: "Break-even Position", labelAr: "موقع نقطة التعادل", weight: weights.breakEven ?? 15, rawScore: scoreFromRisk(byCode.BREAKEVEN_RISK?.riskLevel) },
    { key: "cancellationRate", labelEn: "Cancellation Rate", labelAr: "معدل الإلغاء", weight: weights.cancellationRate ?? 10, rawScore: scoreFromRisk(byCode.CANCELLATION_RATE?.riskLevel) },
    { key: "outstandingPayments", labelEn: "Outstanding Payments", labelAr: "المدفوعات المستحقة", weight: weights.outstandingPayments ?? 5, rawScore: scoreFromRisk(byCode.OUTSTANDING_PAYMENTS?.riskLevel) },
  ];

  const totalWeight = sum(components.map((c) => c.weight)) || 1;
  const withWeighted = components.map((c) => ({ ...c, weightedScore: (c.rawScore * c.weight) / totalWeight }));
  const score = Math.round(sum(withWeighted.map((c) => c.weightedScore)));

  return {
    score,
    status: score >= 75 ? "healthy" : score >= 55 ? "attention" : "at_risk",
    components: withWeighted,
  };
}
