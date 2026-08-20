import { getTranslations, getLocale } from "next-intl/server";
import { clsx } from "clsx";
import { Card, RiskBadge, TrendArrow } from "@/components/ui/primitives";
import { formatNumber, type Locale } from "@/lib/format";
import type { KriEvaluation } from "@/lib/kri";

function formatKriValue(k: KriEvaluation, locale: Locale) {
  if (k.unit === "PERCENT") return `${formatNumber(Number(k.value.toFixed(1)), locale)}%`;
  if (k.unit === "CURRENCY") return formatNumber(Math.round(k.value), locale);
  return formatNumber(Math.round(k.value), locale);
}

export async function KriTable({ kris, monthlySeries }: { kris: KriEvaluation[]; monthlySeries?: Record<string, number[]> }) {
  const t = await getTranslations("dashboard.kri.table");
  const tc = await getTranslations("common");
  const locale = (await getLocale()) as Locale;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-100 text-start text-xs font-semibold uppercase tracking-wide text-navy-500">
            <tr>
              <th className="px-4 py-3 text-start">{t("indicator")}</th>
              <th className="px-4 py-3 text-start">{t("current")}</th>
              <th className="px-4 py-3 text-start">{t("previous")}</th>
              <th className="px-4 py-3 text-start">{t("trend")}</th>
              <th className="px-4 py-3 text-start">{t("risk")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {kris.map((k) => (
              <tr key={k.code} className={clsx(k.riskLevel === "RED" && "bg-risk-red/5", k.riskLevel === "ORANGE" && "bg-risk-orange/5")}>
                <td className="px-4 py-3 font-medium text-navy-800">{locale === "ar" ? k.nameAr : k.nameEn}</td>
                <td className="px-4 py-3 tabular-nums-ltr text-navy-700">{formatKriValue(k, locale)}</td>
                <td className="px-4 py-3 tabular-nums-ltr text-navy-500">{formatKriValue({ ...k, value: k.previousValue }, locale)}</td>
                <td className="px-4 py-3"><TrendArrow trend={k.trend} /></td>
                <td className="px-4 py-3"><RiskBadge level={k.riskLevel} label={tc(`risk.${k.riskLevel}`)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
