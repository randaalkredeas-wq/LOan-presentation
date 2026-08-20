import { getTranslations } from "next-intl/server";
import { clsx } from "clsx";
import { Card } from "@/components/ui/primitives";
import type { HealthScore } from "@/lib/kri";
import type { Locale } from "@/lib/format";

const RING_COLOR: Record<HealthScore["status"], string> = {
  healthy: "text-risk-green", attention: "text-risk-yellow", at_risk: "text-risk-red",
};

export async function HealthScoreCard({ score, locale }: { score: HealthScore; locale: Locale }) {
  const t = await getTranslations("dashboard.healthScore");
  const tk = await getTranslations("kri.healthComponents");
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score.score / 100) * circumference;

  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-navy-800">{t("title")}</p>
      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--brand-cream-300)" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="42" fill="none" strokeWidth="10" strokeLinecap="round"
              className={RING_COLOR[score.status]}
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl text-navy-900 tabular-nums-ltr">{score.score}</span>
            <span className="text-[10px] text-navy-400">{t("outOf100")}</span>
          </div>
        </div>
        <div>
          <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-semibold",
            score.status === "healthy" && "bg-risk-green/10 text-risk-green",
            score.status === "attention" && "bg-risk-yellow/10 text-risk-yellow",
            score.status === "at_risk" && "bg-risk-red/10 text-risk-red")}>
            {t(score.status)}
          </span>
          <ul className="mt-3 space-y-1">
            {score.components.slice(0, 4).map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-4 text-xs text-navy-500">
                <span>{tk(c.key)}</span>
                <span className="tabular-nums-ltr font-medium text-navy-700">{Math.round(c.rawScore)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
