import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { BlockedDatesManager } from "@/components/dashboard/blocked-dates-manager";
import type { Locale } from "@/lib/format";

export default async function SettingsPage() {
  const t = await getTranslations("dashboard.settings");
  const locale = (await getLocale()) as Locale;

  const [settings, blockedDates] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    prisma.blockedDate.findMany({ where: { date: { gte: new Date() } }, orderBy: { date: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-navy-900">{t("title")}</h1>

      <SettingsForm
        businessNameEn={settings?.businessNameEn ?? "1R. Studio"}
        businessNameAr={settings?.businessNameAr ?? "استوديو ون آر"}
        fixedCostsMonthly={settings?.fixedCostsMonthly.toString() ?? "900"}
        workingDays={settings?.workingDays ?? [0, 1, 2, 3, 4, 6]}
        locale={locale}
      />

      <BlockedDatesManager
        blockedDates={blockedDates.map((b) => ({ id: b.id, date: b.date.toISOString(), reason: b.reason, type: b.type }))}
      />
    </div>
  );
}
