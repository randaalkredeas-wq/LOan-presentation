import { getTranslations, getLocale } from "next-intl/server";
import { clsx } from "clsx";
import { Card } from "@/components/ui/primitives";
import { formatCurrency, type Locale } from "@/lib/format";
import type { BreakEven } from "@/lib/finance";

export async function BreakEvenCard({ breakEven }: { breakEven: BreakEven }) {
  const t = await getTranslations("dashboard.profitability.breakEven");
  const locale = (await getLocale()) as Locale;

  const pct = Number.isFinite(breakEven.breakEvenRevenue) && breakEven.breakEvenRevenue > 0
    ? Math.min((breakEven.actualRevenue / breakEven.breakEvenRevenue) * 100, 150)
    : 0;

  const statusLabel = breakEven.status === "above" ? t("aboveBreakEven") : breakEven.status === "below" ? t("belowBreakEven") : t("atBreakEven");
  const statusColor = breakEven.status === "above" ? "text-risk-green" : breakEven.status === "below" ? "text-risk-red" : "text-risk-yellow";
  const statusIcon = breakEven.status === "above" ? "🟢" : breakEven.status === "below" ? "🔴" : "🟡";

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-navy-800">{t("title")}</p>
        <span className={clsx("text-sm font-semibold", statusColor)}>{statusIcon} {statusLabel}</span>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="flex justify-between text-xs text-navy-500">
            <span>{t("actualRevenue")}: <span className="tabular-nums-ltr font-semibold text-navy-800">{formatCurrency(breakEven.actualRevenue, locale, { decimals: 0 })}</span></span>
            <span>{t("breakEvenRevenue")}: <span className="tabular-nums-ltr font-semibold text-navy-800">
              {Number.isFinite(breakEven.breakEvenRevenue) ? formatCurrency(breakEven.breakEvenRevenue, locale, { decimals: 0 }) : "—"}
            </span></span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-cream-200">
            <div
              className={clsx("h-full rounded-full", breakEven.status === "above" ? "bg-risk-green" : "bg-risk-red")}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-navy-100 pt-4 text-sm sm:grid-cols-4">
          <Stat label={t("fixedCosts")} value={formatCurrency(breakEven.fixedCosts, locale, { decimals: 0 })} />
          <Stat label={t("contributionMargin")} value={`${breakEven.contributionMarginPercent.toFixed(1)}%`} />
          <Stat label={t("breakEvenOrders")} value={Number.isFinite(breakEven.breakEvenOrders) ? Math.ceil(breakEven.breakEvenOrders).toString() : "—"} />
          <Stat label={locale === "ar" ? "الطلبات الفعلية" : "Actual Orders"} value={String(breakEven.actualOrders)} />
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-navy-400">{label}</p>
      <p className="tabular-nums-ltr font-semibold text-navy-800">{value}</p>
    </div>
  );
}
