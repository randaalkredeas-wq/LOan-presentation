"use client";

import React, { useMemo, useState } from "react";
import { TrendingDown, Zap } from "lucide-react";
import { EnrichedHolding, Currency, Sector, StressScenario } from "@/types";
import { PRESET_MARKET_SHOCKS, PRESET_SECTOR_SHOCKS, runStressTest } from "@/calculations/stressTestCalculations";
import { Card, CardContent } from "@/components/ui/Card";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import { cn } from "@/utils/cn";

const SECTORS: Sector[] = [
  "Technology",
  "Financials",
  "Energy",
  "Healthcare",
  "Consumer Discretionary",
  "Consumer Staples",
  "Communication Services",
  "Industrials",
  "Materials",
  "Utilities",
  "Real Estate",
  "Fixed Income",
];

export function StressTestPanel({ holdings, baseCurrency }: { holdings: EnrichedHolding[]; baseCurrency: Currency }) {
  const { t, language } = useLanguage();
  const [selectedScenario, setSelectedScenario] = useState<StressScenario>(PRESET_MARKET_SHOCKS[1]);
  const [customSector, setCustomSector] = useState<Sector>("Technology");
  const [customShock, setCustomShock] = useState(-10);
  const [useCustom, setUseCustom] = useState(false);

  const symbols = useMemo(
    () => Array.from(new Set(holdings.filter((h) => h.asset.assetClass !== "Cash").map((h) => h.symbol))).sort(),
    [holdings]
  );
  const [customSymbol, setCustomSymbol] = useState("");

  const activeScenario: StressScenario = useMemo(
    () =>
      useCustom
        ? {
            id: "custom-live",
            nameKey: "stress.custom",
            kind: customSymbol ? "custom" : "sector",
            shockPct: customShock,
            sector: customSymbol ? undefined : customSector,
            symbol: customSymbol || undefined,
          }
        : selectedScenario,
    [useCustom, customSymbol, customShock, customSector, selectedScenario]
  );

  const result = useMemo(() => runStressTest(holdings, activeScenario), [holdings, activeScenario]);

  const scenarioLabel = useCustom
    ? `${customSymbol || t(`sector.${customSector}`)} ${customShock}%`
    : t(activeScenario.nameKey);

  const selectClass = "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardContent className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("stressTesting.marketShock")}</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_MARKET_SHOCKS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedScenario(s);
                    setUseCustom(false);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    !useCustom && selectedScenario.id === s.id
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(s.nameKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("stressTesting.sectorShock")}</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_SECTOR_SHOCKS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedScenario(s);
                    setUseCustom(false);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    !useCustom && selectedScenario.id === s.id
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(s.nameKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              {t("stressTesting.customScenario")}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                {t("stressTesting.selectSector")}
                <select
                  className={selectClass}
                  value={customSector}
                  onChange={(e) => {
                    setCustomSector(e.target.value as Sector);
                    setUseCustom(true);
                  }}
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>{t(`sector.${s}`)}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                {t("stressTesting.selectAsset")}
                <select
                  className={selectClass}
                  value={customSymbol}
                  onChange={(e) => {
                    setCustomSymbol(e.target.value);
                    setUseCustom(true);
                  }}
                >
                  <option value="">{t("common.all")}</option>
                  {symbols.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="col-span-full flex flex-col gap-1 text-xs text-muted-foreground">
                {t("stressTesting.shockPct")}: {customShock}%
                <input
                  type="range"
                  min={-60}
                  max={0}
                  step={1}
                  value={customShock}
                  onChange={(e) => {
                    setCustomShock(Number(e.target.value));
                    setUseCustom(true);
                  }}
                  className="accent-brand"
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-negative-bg text-negative">
              <TrendingDown className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{scenarioLabel}</p>
              <p className="text-xs text-muted-foreground">{t("stressTesting.runScenario")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs text-muted-foreground">{t("stressTesting.estimatedLoss")}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-negative">
                {formatCurrency(result.estimatedLoss, baseCurrency, language, { signed: true })}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs text-muted-foreground">{t("stressTesting.estimatedValue")}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {formatCurrency(result.estimatedPortfolioValue, baseCurrency, language)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="text-xs text-muted-foreground">{t("stressTesting.portfolioImpact")}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-negative">{formatPercent(result.impactPct, language)}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("stressTesting.topContributors")}</p>
            {result.topContributors.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("stressTesting.noContributors")}</p>
            ) : (
              <div className="space-y-2">
                {result.topContributors.map((c) => {
                  const maxLoss = Math.abs(result.topContributors[0].loss) || 1;
                  return (
                    <div key={c.symbol} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs font-semibold text-foreground">{c.symbol}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-negative"
                          style={{ width: `${(Math.abs(c.loss) / maxLoss) * 100}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-end text-xs font-medium tabular-nums text-negative">
                        {formatCurrency(c.loss, baseCurrency, language, { signed: true })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
