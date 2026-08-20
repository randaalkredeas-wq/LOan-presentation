import { getTranslations, getLocale } from "next-intl/server";
import { clsx } from "clsx";
import { Card } from "@/components/ui/primitives";
import type { Insight } from "@/lib/insights";
import type { Locale } from "@/lib/format";

const ICON: Record<Insight["severity"], string> = { info: "ℹ", positive: "✓", warning: "⚠", critical: "⛔" };
const STYLE: Record<Insight["severity"], string> = {
  info: "bg-navy-50 text-navy-700 border-navy-100",
  positive: "bg-risk-green/5 text-risk-green border-risk-green/20",
  warning: "bg-risk-yellow/5 text-risk-yellow border-risk-yellow/20",
  critical: "bg-risk-red/5 text-risk-red border-risk-red/20",
};

export async function InsightsPanel({ insights }: { insights: Insight[] }) {
  const t = await getTranslations("dashboard.insights");
  const locale = (await getLocale()) as Locale;

  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-navy-800">{t("title")}</p>
      <p className="text-xs text-navy-400">{t("subtitle")}</p>
      <div className="mt-4 space-y-3">
        {insights.length === 0 && <p className="text-sm text-navy-400">{t("empty")}</p>}
        {insights.map((insight) => (
          <div key={insight.id} className={clsx("flex items-start gap-3 rounded-xl border p-3 text-sm", STYLE[insight.severity])}>
            <span className="mt-0.5">{ICON[insight.severity]}</span>
            <p className="text-navy-800">{locale === "ar" ? insight.textAr : insight.textEn}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
