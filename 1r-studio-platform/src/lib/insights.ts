// Intelligent Business Insights — turns numbers into plain-language findings + recommended focus.
import type { FinancialComparison, FinancialSummary, PackageProfitability, ExpenseCategoryBreakdown, BreakEven } from "./finance";
import { formatCurrency, formatPercent, type Locale } from "./format";

export interface Insight {
  id: string;
  severity: "info" | "positive" | "warning" | "critical";
  textEn: string;
  textAr: string;
}

export function generateInsights(
  comparison: FinancialComparison,
  current: FinancialSummary,
  breakEven: BreakEven,
  packages: PackageProfitability[],
  expenses: ExpenseCategoryBreakdown[]
): Insight[] {
  const insights: Insight[] = [];
  const pct = (n: number) => `${n >= 0 ? "" : ""}${n.toFixed(1)}%`;

  // 1. Revenue vs expense growth causing margin change
  if (comparison.revenue.changePercent !== 0 && comparison.expenses.changePercent !== 0) {
    const revG = comparison.revenue.changePercent, expG = comparison.expenses.changePercent;
    const marginDelta = comparison.netMargin.current - comparison.netMargin.previous;
    if (expG > revG && marginDelta < -0.5) {
      insights.push({
        id: "margin-squeeze",
        severity: marginDelta < -8 ? "critical" : "warning",
        textEn: `Revenue ${revG >= 0 ? "increased" : "changed"} ${pct(Math.abs(revG))}, but expenses ${expG >= 0 ? "increased" : "changed"} ${pct(Math.abs(expG))}, causing net profit margin to decline from ${comparison.netMargin.previous.toFixed(1)}% to ${comparison.netMargin.current.toFixed(1)}%.`,
        textAr: `ارتفعت الإيرادات بنسبة ${pct(Math.abs(revG))}، لكن المصروفات ارتفعت بنسبة ${pct(Math.abs(expG))}، مما أدى إلى تراجع هامش صافي الربح من ${comparison.netMargin.previous.toFixed(1)}% إلى ${comparison.netMargin.current.toFixed(1)}%.`,
      });
    } else if (revG > expG && marginDelta > 0.5) {
      insights.push({
        id: "margin-improve",
        severity: "positive",
        textEn: `Revenue grew ${pct(Math.abs(revG))} while expenses grew only ${pct(Math.abs(expG))}, improving net profit margin from ${comparison.netMargin.previous.toFixed(1)}% to ${comparison.netMargin.current.toFixed(1)}%.`,
        textAr: `نمت الإيرادات بنسبة ${pct(Math.abs(revG))} بينما نمت المصروفات بنسبة ${pct(Math.abs(expG))} فقط، مما حسّن هامش صافي الربح من ${comparison.netMargin.previous.toFixed(1)}% إلى ${comparison.netMargin.current.toFixed(1)}%.`,
      });
    }
  }

  // 2. Highest-margin package
  if (packages.length > 0) {
    const best = [...packages].sort((a, b) => b.profitMargin - a.profitMargin)[0];
    insights.push({
      id: "best-margin-package",
      severity: "positive",
      textEn: `Your highest-margin package is "${best.nameEn}" with a ${best.profitMargin.toFixed(0)}% contribution margin.`,
      textAr: `أعلى باقاتك هامشًا هي "${best.nameAr}" بهامش مساهمة ${best.profitMargin.toFixed(0)}%.`,
    });
  }

  // 3. Order volume decline
  if (comparison.orders.changePercent < -10) {
    insights.push({
      id: "order-volume-decline",
      severity: comparison.orders.changePercent < -25 ? "critical" : "warning",
      textEn: `Order volume decreased ${pct(Math.abs(comparison.orders.changePercent))} compared with the previous period.`,
      textAr: `انخفض حجم الطلبات بنسبة ${pct(Math.abs(comparison.orders.changePercent))} مقارنة بالفترة السابقة.`,
    });
  } else if (comparison.orders.changePercent > 10) {
    insights.push({
      id: "order-volume-growth",
      severity: "positive",
      textEn: `Order volume increased ${pct(comparison.orders.changePercent)} compared with the previous period.`,
      textAr: `ارتفع حجم الطلبات بنسبة ${pct(comparison.orders.changePercent)} مقارنة بالفترة السابقة.`,
    });
  }

  // 4. Top expense category share
  if (expenses.length > 0) {
    const top = expenses[0];
    if (top.share > 15) {
      insights.push({
        id: "top-expense-category",
        severity: top.share > 30 ? "warning" : "info",
        textEn: `${top.nameEn} costs represent ${top.share.toFixed(0)}% of total expenses.`,
        textAr: `تمثل تكاليف ${top.nameAr} نسبة ${top.share.toFixed(0)}% من إجمالي المصروفات.`,
      });
    }
  }

  // 5. Break-even position
  if (Number.isFinite(breakEven.breakEvenRevenue) && breakEven.breakEvenRevenue > 0) {
    const gapPct = (breakEven.gapToBreakEvenRevenue / breakEven.breakEvenRevenue) * 100;
    if (gapPct < 0) {
      insights.push({
        id: "below-breakeven",
        severity: gapPct < -20 ? "critical" : "warning",
        textEn: `Your current revenue is ${pct(Math.abs(gapPct))} below the break-even point.`,
        textAr: `إيراداتك الحالية أقل من نقطة التعادل بنسبة ${pct(Math.abs(gapPct))}.`,
      });
    } else if (gapPct > 15) {
      insights.push({
        id: "above-breakeven",
        severity: "positive",
        textEn: `Your current revenue is ${pct(gapPct)} above the break-even point.`,
        textAr: `إيراداتك الحالية أعلى من نقطة التعادل بنسبة ${pct(gapPct)}.`,
      });
    }
  }

  // 6. AOV change
  if (Math.abs(comparison.aov.changePercent) > 5) {
    const up = comparison.aov.changePercent > 0;
    insights.push({
      id: "aov-change",
      severity: up ? "positive" : "warning",
      textEn: `Average order value ${up ? "increased" : "decreased"} by ${pct(Math.abs(comparison.aov.changePercent))}.`,
      textAr: `${up ? "ارتفع" : "انخفض"} متوسط قيمة الطلب بنسبة ${pct(Math.abs(comparison.aov.changePercent))}.`,
    });
  }

  // 7. High demand + low profitability package
  if (packages.length > 1) {
    const totalOrders = packages.reduce((s, p) => s + p.ordersCount, 0);
    for (const p of packages) {
      const orderShare = totalOrders > 0 ? (p.ordersCount / totalOrders) * 100 : 0;
      if (orderShare >= 25 && p.profitShare < orderShare - 10 && p.profitShare < p.revenueShare - 5) {
        insights.push({
          id: `high-demand-low-profit-${p.packageId}`,
          severity: "warning",
          textEn: `"${p.nameEn}" generated ${orderShare.toFixed(0)}% of total orders but only ${p.profitShare.toFixed(0)}% of total profit — high demand, low profitability.`,
          textAr: `باقة "${p.nameAr}" مثّلت ${orderShare.toFixed(0)}% من إجمالي الطلبات لكن ${p.profitShare.toFixed(0)}% فقط من إجمالي الربح — طلب مرتفع وربحية منخفضة.`,
        });
      }
    }
  }

  return insights;
}

export function formatInsight(insight: Insight, locale: Locale): string {
  return locale === "ar" ? insight.textAr : insight.textEn;
}
