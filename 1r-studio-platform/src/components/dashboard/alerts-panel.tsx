import { getTranslations, getLocale } from "next-intl/server";
import { clsx } from "clsx";
import { Card } from "@/components/ui/primitives";
import { formatNumber, type Locale } from "@/lib/format";
import type { KriEvaluation } from "@/lib/kri";

const SEVERITY_ICON: Record<string, string> = { RED: "⛔", ORANGE: "⚠" };
const SEVERITY_STYLE: Record<string, string> = {
  RED: "border-risk-red/40 bg-risk-red/5",
  ORANGE: "border-risk-orange/40 bg-risk-orange/5",
};

function fmt(value: number, unit: string, locale: Locale) {
  return unit === "PERCENT" ? `${formatNumber(Number(value.toFixed(1)), locale)}%` : formatNumber(Math.round(value), locale);
}

export async function AlertsPanel({ kris }: { kris: KriEvaluation[] }) {
  const t = await getTranslations("dashboard.kri");
  const locale = (await getLocale()) as Locale;
  const alerts = kris.filter((k) => k.riskLevel === "RED" || k.riskLevel === "ORANGE");

  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-navy-800">{t("alerts")}</p>
      <div className="mt-4 space-y-3">
        {alerts.length === 0 && <p className="text-sm text-navy-400">{t("noAlerts")}</p>}
        {alerts.map((k) => (
          <div key={k.code} className={clsx("rounded-xl border p-4", SEVERITY_STYLE[k.riskLevel])}>
            <div className="flex items-start gap-3">
              <span className="text-lg">{SEVERITY_ICON[k.riskLevel]}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-navy-900">{locale === "ar" ? k.nameAr : k.nameEn}</p>
                <p className="mt-1 text-sm text-navy-600">
                  {locale === "ar"
                    ? `القيمة الحالية ${fmt(k.value, k.unit, locale)} مقارنة بـ ${fmt(k.previousValue, k.unit, locale)} سابقًا.`
                    : `Current value ${fmt(k.value, k.unit, locale)} vs ${fmt(k.previousValue, k.unit, locale)} previously.`}
                </p>
                <p className="mt-2 text-xs font-medium text-navy-700">
                  {t("recommendedAction")}: {locale === "ar" ? k.recommendedActionAr : k.recommendedActionEn}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
