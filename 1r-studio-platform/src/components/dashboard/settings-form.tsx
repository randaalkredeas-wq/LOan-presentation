"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, Card } from "@/components/ui/primitives";

const DAYS = [
  { value: 0, en: "Sun", ar: "أحد" }, { value: 1, en: "Mon", ar: "اثنين" }, { value: 2, en: "Tue", ar: "ثلاثاء" },
  { value: 3, en: "Wed", ar: "أربعاء" }, { value: 4, en: "Thu", ar: "خميس" }, { value: 5, en: "Fri", ar: "جمعة" }, { value: 6, en: "Sat", ar: "سبت" },
];

export function SettingsForm({
  businessNameEn, businessNameAr, fixedCostsMonthly, workingDays, locale,
}: {
  businessNameEn: string; businessNameAr: string; fixedCostsMonthly: string; workingDays: number[]; locale: string;
}) {
  const t = useTranslations("dashboard.settings");
  const tc = useTranslations("common");
  const router = useRouter();
  const [nameEn, setNameEn] = useState(businessNameEn);
  const [nameAr, setNameAr] = useState(businessNameAr);
  const [fixedCosts, setFixedCosts] = useState(fixedCostsMonthly);
  const [days, setDays] = useState<number[]>(workingDays);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleDay(v: number) {
    setDays((prev) => (prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v].sort()));
  }

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessNameEn: nameEn, businessNameAr: nameAr, fixedCostsMonthly: Number(fixedCosts), workingDays: days }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-sm font-semibold text-navy-800">{t("business")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">{t("businessNameEn")}</span>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="input mt-1.5" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">{t("businessNameAr")}</span>
            <input dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="input mt-1.5" />
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold text-navy-800">{t("financial")}</p>
        <label className="mt-4 block max-w-xs">
          <span className="text-sm font-medium text-navy-800">{t("fixedCostsMonthly")} (SAR)</span>
          <input type="number" dir="ltr" value={fixedCosts} onChange={(e) => setFixedCosts(e.target.value)} className="input mt-1.5" />
        </label>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold text-navy-800">{t("workingDays")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDay(d.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${days.includes(d.value) ? "bg-navy-800 text-cream-50" : "bg-cream-200 text-navy-600"}`}
            >
              {locale === "ar" ? d.ar : d.en}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={save} disabled={saving}>{saving ? tc("loading") : tc("actions.saveChanges")}</Button>
        {saved && <span className="text-sm text-risk-green">✓ {locale === "ar" ? "تم الحفظ" : "Saved"}</span>}
      </div>
    </div>
  );
}
