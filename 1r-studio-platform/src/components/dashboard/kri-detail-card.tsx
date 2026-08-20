import { getTranslations, getLocale } from "next-intl/server";
import { clsx } from "clsx";
import { Card, RiskBadge, TrendArrow } from "@/components/ui/primitives";
import { formatNumber, type Locale } from "@/lib/format";
import type { KriEvaluation } from "@/lib/kri";

function fmt(value: number, unit: string, locale: Locale) {
  if (unit === "PERCENT") return `${formatNumber(Number(value.toFixed(1)), locale)}%`;
  return formatNumber(Math.round(value), locale);
}

const BORDER: Record<KriEvaluation["riskLevel"], string> = {
  GREEN: "border-navy-100", YELLOW: "border-risk-yellow/40", ORANGE: "border-risk-orange/50", RED: "border-risk-red/60",
};

export async function KriDetailCard({ k, trend6m }: { k: KriEvaluation; trend6m?: number[] }) {
  const t = await getTranslations("dashboard.kri");
  const tc = await getTranslations("common");
  const locale = (await getLocale()) as Locale;

  return (
    <Card className={clsx("border-2 p-5", BORDER[k.riskLevel])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy-900">{locale === "ar" ? k.nameAr : k.nameEn}</p>
          <p className="mt-0.5 text-xs text-navy-400">
            {k.category === "FINANCIAL" ? (locale === "ar" ? "مالي" : "Financial") : locale === "ar" ? "تشغيلي" : "Operational"}
          </p>
        </div>
        <RiskBadge level={k.riskLevel} label={tc(`risk.${k.riskLevel}`)} />
      </div>

      <div className="mt-4 flex items-end gap-4">
        <div>
          <p className="text-[11px] text-navy-400">{t("current")}</p>
          <p className="font-display text-2xl text-navy-900 tabular-nums-ltr">{fmt(k.value, k.unit, locale)}</p>
        </div>
        <div className="flex items-center gap-1 pb-1 text-sm">
          <TrendArrow trend={k.trend} />
          <span className="tabular-nums-ltr text-navy-500">{fmt(k.previousValue, k.unit, locale)} {t("previous")}</span>
        </div>
      </div>

      {trend6m && trend6m.length > 1 && <Sparkline values={trend6m} riskLevel={k.riskLevel} />}

      <p className="mt-3 text-xs leading-relaxed text-navy-500">{locale === "ar" ? k.descriptionAr : k.descriptionEn}</p>

      {(k.riskLevel === "ORANGE" || k.riskLevel === "RED") && (
        <div className="mt-3 rounded-lg bg-cream-100 p-3 text-xs text-navy-700">
          <span className="font-semibold">{t("recommendedAction")}: </span>
          {locale === "ar" ? k.recommendedActionAr : k.recommendedActionEn}
        </div>
      )}

      <p className="mt-3 text-[11px] text-navy-400">
        {t("threshold")}: {fmt(k.thresholdYellow, k.unit, locale)} / {fmt(k.thresholdOrange, k.unit, locale)} / {fmt(k.thresholdRed, k.unit, locale)}
      </p>
    </Card>
  );
}

function Sparkline({ values, riskLevel }: { values: number[]; riskLevel: KriEvaluation["riskLevel"] }) {
  const w = 160, h = 32;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const color = riskLevel === "RED" ? "var(--risk-red)" : riskLevel === "ORANGE" ? "var(--risk-orange)" : riskLevel === "YELLOW" ? "var(--risk-yellow)" : "var(--risk-green)";
  return (
    <svg width={w} height={h} className="mt-3">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
