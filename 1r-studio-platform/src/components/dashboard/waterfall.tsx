import { getTranslations, getLocale } from "next-intl/server";
import { formatCurrency, type Locale } from "@/lib/format";
import { Card } from "@/components/ui/primitives";

interface Step { label: string; value: number; kind: "start" | "decrease" | "end" }

export async function ProfitWaterfall({
  revenue, directCosts, grossProfit, operatingExpenses, netProfit,
}: {
  revenue: number; directCosts: number; grossProfit: number; operatingExpenses: number; netProfit: number;
}) {
  const t = await getTranslations("dashboard.profitability");
  const locale = (await getLocale()) as Locale;

  const steps: Step[] = [
    { label: t("revenue"), value: revenue, kind: "start" },
    { label: t("directCosts"), value: -directCosts, kind: "decrease" },
    { label: t("grossProfit"), value: grossProfit, kind: "end" },
    { label: t("operatingExpenses"), value: -operatingExpenses, kind: "decrease" },
    { label: t("netProfit"), value: netProfit, kind: "end" },
  ];

  const max = Math.max(revenue, grossProfit, 1);
  let running = 0;

  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-navy-800">{t("waterfall")}</p>
      <div className="mt-6 flex items-end gap-3 overflow-x-auto pb-2" dir="ltr">
        {steps.map((s, i) => {
          const isTotal = s.kind !== "decrease";
          const base = isTotal ? 0 : running;
          if (isTotal) running = s.value;
          else running += s.value;
          const barHeight = Math.max((Math.abs(s.value) / max) * 160, 4);
          const bottom = isTotal ? 0 : (Math.min(base, running) / max) * 160;

          return (
            <div key={i} className="flex flex-1 min-w-[80px] flex-col items-center">
              <div className="relative flex h-40 w-full items-end justify-center">
                <div
                  className="w-10 rounded-md sm:w-14"
                  style={{
                    height: barHeight,
                    marginBottom: bottom,
                    background: s.kind === "decrease" ? "var(--risk-red)" : s.kind === "start" ? "var(--brand-navy-800)" : "var(--risk-green)",
                  }}
                />
              </div>
              <p dir={locale === "ar" ? "rtl" : "ltr"} className="mt-2 text-center text-[11px] text-navy-500">{s.label}</p>
              <p className="tabular-nums-ltr text-xs font-semibold text-navy-800">
                {s.kind === "decrease" ? "-" : ""}{formatCurrency(Math.abs(s.value), locale, { decimals: 0 })}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
