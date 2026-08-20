import { clsx } from "clsx";
import { getTranslations } from "next-intl/server";
import { Card, TrendArrow } from "@/components/ui/primitives";
import { formatPercent, type Locale } from "@/lib/format";
import type { MetricComparison } from "@/lib/finance";

export async function KpiCard({
  label, value, comparison, locale, prominent, invertTrendColor,
}: {
  label: string;
  value: string;
  comparison: MetricComparison;
  locale: Locale;
  prominent?: boolean;
  invertTrendColor?: boolean;
}) {
  const t = await getTranslations("common");
  const goodTrend = invertTrendColor ? comparison.trend === "down" : comparison.trend === "up";

  return (
    <Card className={clsx("p-5", prominent && "border-navy-800 ring-1 ring-navy-800/10")}>
      <p className="text-sm font-medium text-navy-500">{label}</p>
      <p className={clsx("font-display mt-2 tabular-nums-ltr text-navy-900", prominent ? "text-3xl" : "text-2xl")}>{value}</p>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        <TrendArrow trend={comparison.trend} />
        <span className={clsx("font-semibold tabular-nums-ltr", goodTrend ? "text-risk-green" : comparison.trend === "flat" ? "text-navy-400" : "text-risk-red")}>
          {formatPercent(Math.abs(comparison.changePercent), locale)}
        </span>
        <span className="text-navy-400">{t("vs")} {t("previousPeriod")}</span>
      </div>
    </Card>
  );
}
