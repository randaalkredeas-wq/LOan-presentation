import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { resolvePeriodFromParams } from "@/lib/period-params";
import { computeRawKriValues, evaluateKris, getKriTrendSeries } from "@/lib/kri";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { KriTable } from "@/components/dashboard/kri-table";
import { KriDetailCard } from "@/components/dashboard/kri-detail-card";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { differenceInCalendarMonths } from "date-fns";

export default async function KriPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const { key, resolved } = resolvePeriodFromParams(sp, now);
  const t = await getTranslations("dashboard.kri");

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const fixedCostsMonthly = Number(settings?.fixedCostsMonthly ?? 900);
  const periodMonths = Math.max(1, differenceInCalendarMonths(resolved.current.end, resolved.current.start) + 1);

  const [kriDefs, rawKris, trendSeries] = await Promise.all([
    prisma.kriDefinition.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    computeRawKriValues(prisma, resolved.current, resolved.previous, fixedCostsMonthly, periodMonths, now),
    getKriTrendSeries(prisma, fixedCostsMonthly, now, 6),
  ]);

  const kris = evaluateKris(kriDefs, rawKris);
  const financial = kris.filter((k) => k.category === "FINANCIAL");
  const operational = kris.filter((k) => k.category === "OPERATIONAL");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-navy-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-navy-500">{t("subtitle")}</p>
        </div>
        <PeriodFilter current={key} />
      </div>

      <AlertsPanel kris={kris} />

      <KriTable kris={kris} />

      <section>
        <h2 className="text-sm font-semibold text-navy-800">{t("financial")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {financial.map((k) => (
            <KriDetailCard key={k.code} k={k} trend6m={trendSeries[k.code]} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-navy-800">{t("operational")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {operational.map((k) => (
            <KriDetailCard key={k.code} k={k} trend6m={trendSeries[k.code]} />
          ))}
        </div>
      </section>
    </div>
  );
}
