import { getTranslations, getLocale } from "next-intl/server";
import { clsx } from "clsx";
import { Card } from "@/components/ui/primitives";
import { formatCurrency, formatPercent, type Locale } from "@/lib/format";
import type { PackageProfitability } from "@/lib/finance";

export async function PackageProfitabilityTable({ packages }: { packages: PackageProfitability[] }) {
  const t = await getTranslations("dashboard.profitability");
  const locale = (await getLocale()) as Locale;

  if (packages.length === 0) return null;

  const mostProfitable = [...packages].sort((a, b) => b.profit - a.profit)[0];
  const highestRevenue = [...packages].sort((a, b) => b.revenue - a.revenue)[0];
  const highestVolume = [...packages].sort((a, b) => b.ordersCount - a.ordersCount)[0];
  const lowestMargin = [...packages].sort((a, b) => a.profitMargin - b.profitMargin)[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Highlight label={t("mostProfitable")} pkg={mostProfitable} locale={locale} tone="green" />
        <Highlight label={t("highestRevenue")} pkg={highestRevenue} locale={locale} tone="navy" />
        <Highlight label={t("highestVolume")} pkg={highestVolume} locale={locale} tone="accent" />
        <Highlight label={t("lowestMargin")} pkg={lowestMargin} locale={locale} tone="red" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-4 py-3 text-start">{t("packageProfitability")}</th>
                <th className="px-4 py-3 text-start">{t("sellingPrice")}</th>
                <th className="px-4 py-3 text-start">{t("directCost")}</th>
                <th className="px-4 py-3 text-start">{t("contribution")}</th>
                <th className="px-4 py-3 text-start">{t("margin")}</th>
                <th className="px-4 py-3 text-start">{t("ordersCount")}</th>
                <th className="px-4 py-3 text-start">{locale === "ar" ? "الإيرادات" : "Revenue"}</th>
                <th className="px-4 py-3 text-start">{locale === "ar" ? "الربح" : "Profit"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {packages.map((p) => (
                <tr key={p.packageId}>
                  <td className="px-4 py-3 font-medium text-navy-800">{locale === "ar" ? p.nameAr : p.nameEn}</td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-600">{formatCurrency(p.sellingPrice, locale, { decimals: 0 })}</td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-600">{formatCurrency(p.directCost, locale, { decimals: 0 })}</td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-600">{formatCurrency(p.contribution, locale, { decimals: 0 })}</td>
                  <td className={clsx("px-4 py-3 tabular-nums-ltr font-semibold", p.profitMargin < 40 ? "text-risk-orange" : "text-risk-green")}>
                    {formatPercent(p.profitMargin, locale)}
                  </td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-600">{p.ordersCount}</td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-600">{formatCurrency(p.revenue, locale, { decimals: 0 })}</td>
                  <td className="px-4 py-3 tabular-nums-ltr font-semibold text-navy-900">{formatCurrency(p.profit, locale, { decimals: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Highlight({ label, pkg, locale, tone }: { label: string; pkg: PackageProfitability; locale: Locale; tone: "green" | "navy" | "accent" | "red" }) {
  const toneClass = {
    green: "border-risk-green/30 bg-risk-green/5", navy: "border-navy-200 bg-navy-50",
    accent: "border-accent-300 bg-accent-500/5", red: "border-risk-red/30 bg-risk-red/5",
  }[tone];
  return (
    <Card className={clsx("border p-4", toneClass)}>
      <p className="text-xs font-medium text-navy-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-navy-900">{locale === "ar" ? pkg.nameAr : pkg.nameEn}</p>
      <p className="mt-1 text-xs tabular-nums-ltr text-navy-500">
        {formatCurrency(pkg.revenue, locale, { decimals: 0 })} · {formatPercent(pkg.profitMargin, locale)}
      </p>
    </Card>
  );
}
