"use client";

import React, { useEffect, useState } from "react";
import { Check, Database } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { usePortfolioRawData } from "@/hooks/usePortfolioRawData";
import { AppSettings, Currency, RiskLimit, Sector } from "@/types";
import { cn } from "@/utils/cn";

const CURRENCIES: Currency[] = ["SAR", "USD", "EUR", "GBP"];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-brand" : "bg-surface-2 border border-border")}
      aria-pressed={checked}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px] rtl:-translate-x-[22px]" : "translate-x-0.5 rtl:-translate-x-0.5")} />
    </button>
  );
}

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { benchmarks } = usePortfolioRawData();
  const [local, setLocal] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Settings load asynchronously from the service; sync the local draft
    // copy once the real values arrive (and whenever they're refetched).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(settings);
  }, [settings]);

  const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40";
  const labelClass = "flex flex-col gap-1.5 text-xs font-medium text-muted-foreground";

  const updateLimit = (key: keyof RiskLimit, value: number) => {
    setLocal((s) => ({ ...s, riskLimits: { ...s.riskLimits, [key]: value } }));
  };

  const updateTarget = (sector: Sector, value: number) => {
    setLocal((s) => ({
      ...s,
      targetAllocations: s.targetAllocations.map((t2) => (t2.sector === sector ? { ...t2, targetPct: value } : t2)),
    }));
  };

  const handleSave = async () => {
    await updateSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        actions={
          <button onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90">
            {saved ? <Check className="h-4 w-4" /> : null}
            {saved ? t("settings.changesSaved") : t("settings.saveChanges")}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("settings.profile")}</CardTitle>
              <CardDescription>{t("settings.profileSubtitle")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className={labelClass}>
                {t("settings.displayName")}
                <input
                  className={inputClass}
                  value={local.profile.displayName}
                  onChange={(e) => setLocal((s) => ({ ...s, profile: { ...s.profile, displayName: e.target.value } }))}
                  placeholder={t("settings.displayNamePlaceholder")}
                />
              </label>
              <label className={labelClass}>
                {t("settings.email")}
                <input
                  type="email"
                  className={inputClass}
                  value={local.profile.email}
                  onChange={(e) => setLocal((s) => ({ ...s, profile: { ...s.profile, email: e.target.value } }))}
                  placeholder={t("settings.emailPlaceholder")}
                />
              </label>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t("settings.displayPreferences")}</p>
              <div className="grid grid-cols-2 gap-4">
                <label className={labelClass}>
                  {t("settings.language")}
                  <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value as "en" | "ar")}>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </label>
                <label className={labelClass}>
                  {t("settings.theme")}
                  <select className={inputClass} value={theme} onChange={(e) => setTheme(e.target.value as "dark" | "light")}>
                    <option value="dark">{t("settings.themeDark")}</option>
                    <option value="light">{t("settings.themeLight")}</option>
                  </select>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("settings.general")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className={labelClass}>
              {t("settings.baseCurrency")}
              <select className={inputClass} value={local.baseCurrency} onChange={(e) => setLocal((s) => ({ ...s, baseCurrency: e.target.value as Currency }))}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              {t("settings.benchmark")}
              <select className={inputClass} value={local.benchmarkId} onChange={(e) => setLocal((s) => ({ ...s, benchmarkId: e.target.value }))}>
                {benchmarks.map((b) => <option key={b.id} value={b.id}>{language === "ar" ? b.nameAr : b.name}</option>)}
              </select>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("settings.riskLimits")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {([
              ["maxPlatformExposurePct", "settings.maxPlatformExposure"],
              ["maxSingleAssetExposurePct", "settings.maxSingleAssetExposure"],
              ["maxSectorExposurePct", "settings.maxSectorExposure"],
              ["maxDrawdownPct", "settings.maxDrawdown"],
              ["maxCurrencyExposurePct", "settings.maxCurrencyExposure"],
            ] as [keyof RiskLimit, string][]).map(([key, labelKey]) => (
              <label key={key} className={labelClass}>
                {t(labelKey)}: {local.riskLimits[key]}%
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={local.riskLimits[key]}
                  onChange={(e) => updateLimit(key, Number(e.target.value))}
                  className="accent-brand"
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("settings.targetAllocations")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {local.targetAllocations.map((ta) => (
              <label key={ta.sector} className={labelClass}>
                {t(`sector.${ta.sector}`)}: {ta.targetPct}%
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ta.targetPct}
                  onChange={(e) => updateTarget(ta.sector, Number(e.target.value))}
                  className="accent-brand"
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("settings.alertPreferences")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {([
              ["emailNotifications", "settings.emailNotifications"],
              ["criticalOnly", "settings.criticalOnly"],
              ["concentrationAlerts", "settings.concentrationAlerts"],
              ["drawdownAlerts", "settings.drawdownAlerts"],
              ["performanceAlerts", "settings.performanceAlerts"],
            ] as [keyof AppSettings["alertPreferences"], string][]).map(([key, labelKey]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{t(labelKey)}</span>
                <Toggle
                  checked={local.alertPreferences[key]}
                  onChange={(v) => setLocal((s) => ({ ...s, alertPreferences: { ...s.alertPreferences, [key]: v } }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t("settings.dataSource")}</CardTitle>
              <CardDescription>{t("settings.dataSourceText")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-brand/25 bg-brand/5 px-3.5 py-2.5">
                <Database className="h-4 w-4 text-brand" />
                <div>
                  <p className="text-[11px] text-muted-foreground">{t("settings.currentSource")}</p>
                  <p className="text-sm font-semibold text-brand">{t("settings.mockData")}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{t("settings.futureSources")}:</span>
              {["REST / Brokerage API", "Excel / CSV Upload", "Database"].map((s) => (
                <Badge key={s} tone="neutral">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
