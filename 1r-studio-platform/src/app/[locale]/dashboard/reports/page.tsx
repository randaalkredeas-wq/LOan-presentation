import { getTranslations, getLocale } from "next-intl/server";
import { differenceInCalendarMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { resolvePeriodFromParams } from "@/lib/period-params";
import { getFinancialSummary, compareFinancials, calculateBreakEven, getExpenseBreakdown } from "@/lib/finance";
import { computeRawKriValues, evaluateKris } from "@/lib/kri";
import { formatCurrency, formatPercent, type Locale } from "@/lib/format";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { ReportExport, type ReportData } from "@/components/dashboard/report-export";
import { Card } from "@/components/ui/primitives";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const { key, resolved } = resolvePeriodFromParams(sp, now);
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dashboard.reports");
  const tc = await getTranslations("common");
  const tk = await getTranslations("dashboard.kri");
  const tdk = await getTranslations("dashboard.kpi");
  const tdp = await getTranslations("dashboard.profitability");
  const tde = await getTranslations("dashboard.expenses");
  const isAr = locale === "ar";

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const fixedCostsMonthly = Number(settings?.fixedCostsMonthly ?? 900);
  const periodMonths = Math.max(1, differenceInCalendarMonths(resolved.current.end, resolved.current.start) + 1);

  const [current, previous, expenseBreakdown, kriDefs, rawKris] = await Promise.all([
    getFinancialSummary(prisma, resolved.current),
    getFinancialSummary(prisma, resolved.previous),
    getExpenseBreakdown(prisma, resolved.current),
    prisma.kriDefinition.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    computeRawKriValues(prisma, resolved.current, resolved.previous, fixedCostsMonthly, periodMonths, now),
  ]);
  const comparison = compareFinancials(current, previous);
  const breakEven = calculateBreakEven(current, fixedCostsMonthly, periodMonths);
  const kris = evaluateKris(kriDefs, rawKris);

  const money = (n: number) => formatCurrency(n, locale, { decimals: 0 });
  const pct = (n: number) => formatPercent(n, locale);

  const salesRows = [
    { label: tdk("revenue"), current: money(current.revenue), previous: money(previous.revenue), change: pct(comparison.revenue.changePercent) },
    { label: tdk("orders"), current: String(current.ordersCount), previous: String(previous.ordersCount), change: pct(comparison.orders.changePercent) },
    { label: tdk("aov"), current: money(current.aov), previous: money(previous.aov), change: pct(comparison.aov.changePercent) },
  ];
  const expenseRows = expenseBreakdown.map((e) => ({
    category: locale === "ar" ? e.nameAr : e.nameEn,
    type: e.type === "DIRECT" ? tde("direct") : tde("operating"),
    amount: money(e.total), share: pct(e.share),
  }));
  const profitabilityRows = [
    { label: tdp("revenue"), value: money(current.revenue) },
    { label: tdp("directCosts"), value: money(current.directCosts) },
    { label: tdp("grossProfit"), value: money(current.grossProfit) },
    { label: tdp("operatingExpenses"), value: money(current.operatingExpenses) },
    { label: tdp("netProfit"), value: money(current.netProfit) },
    { label: tdp("grossMargin"), value: pct(current.grossMargin) },
    { label: tdp("netMargin"), value: pct(current.netMargin) },
    { label: tdp("breakEven.breakEvenRevenue"), value: Number.isFinite(breakEven.breakEvenRevenue) ? money(breakEven.breakEvenRevenue) : "—" },
  ];
  const kriRows = kris.map((k) => ({
    indicator: locale === "ar" ? k.nameAr : k.nameEn,
    current: k.unit === "PERCENT" ? pct(k.value) : String(Math.round(k.value)),
    previous: k.unit === "PERCENT" ? pct(k.previousValue) : String(Math.round(k.previousValue)),
    risk: tc(`risk.${k.riskLevel}`),
  }));

  const reportData: ReportData = { periodLabel: key, sales: salesRows, expenses: expenseRows, profitability: profitabilityRows, kri: kriRows };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl text-navy-900">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodFilter current={key} />
          <ReportExport data={reportData} />
        </div>
      </div>

      <ReportSection title={t("sales")}>
        <SimpleTable
          head={[isAr ? "المؤشر" : "Metric", tk("current"), tk("previous"), isAr ? "التغير" : "Change"]}
          rows={salesRows.map((r) => [r.label, r.current, r.previous, r.change])}
        />
      </ReportSection>

      <ReportSection title={t("expensesReport")}>
        <SimpleTable
          head={[tde("category"), tde("type"), tde("amount"), isAr ? "الحصة" : "Share"]}
          rows={expenseRows.map((r) => [r.category, r.type, r.amount, r.share])}
        />
      </ReportSection>

      <ReportSection title={t("profitabilityReport")}>
        <SimpleTable head={[isAr ? "المؤشر" : "Metric", isAr ? "القيمة" : "Value"]} rows={profitabilityRows.map((r) => [r.label, r.value])} />
      </ReportSection>

      <ReportSection title={t("kriReport")}>
        <SimpleTable head={[tk("table.indicator"), tk("table.current"), tk("table.previous"), tk("table.risk")]} rows={kriRows.map((r) => [r.indicator, r.current, r.previous, r.risk])} />
      </ReportSection>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-navy-800">{title}</p>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs font-semibold uppercase tracking-wide text-navy-500">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 text-start">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j} className="px-3 py-2 tabular-nums-ltr text-navy-700">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
