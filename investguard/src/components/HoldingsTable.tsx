"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { EnrichedHolding, Currency } from "@/types";
import { Badge, riskLevelTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/formatters";
import { cn } from "@/utils/cn";

type SortKey = "symbol" | "marketValue" | "weightPct" | "pnl" | "returnPct" | "quantity";

const PAGE_SIZE = 10;

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export function HoldingsTable({ holdings, baseCurrency }: { holdings: EnrichedHolding[]; baseCurrency: Currency }) {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [assetClassFilter, setAssetClassFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("marketValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const accounts = useMemo(() => Array.from(new Set(holdings.map((h) => h.accountName))).sort(), [holdings]);
  const platforms = useMemo(() => Array.from(new Set(holdings.map((h) => h.platformName))).sort(), [holdings]);
  const sectors = useMemo(() => Array.from(new Set(holdings.map((h) => h.asset.sector))).sort(), [holdings]);
  const assetClasses = useMemo(() => Array.from(new Set(holdings.map((h) => h.asset.assetClass))).sort(), [holdings]);

  const filtered = useMemo(() => {
    return holdings.filter((h) => {
      if (search && !`${h.symbol} ${h.asset.name}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (accountFilter && h.accountName !== accountFilter) return false;
      if (platformFilter && h.platformName !== platformFilter) return false;
      if (sectorFilter && h.asset.sector !== sectorFilter) return false;
      if (riskFilter && h.asset.riskLevel !== riskFilter) return false;
      if (assetClassFilter && h.asset.assetClass !== assetClassFilter) return false;
      return true;
    });
  }, [holdings, search, accountFilter, platformFilter, sectorFilter, riskFilter, assetClassFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: number | string = a[sortKey as keyof EnrichedHolding] as number;
      let bv: number | string = b[sortKey as keyof EnrichedHolding] as number;
      if (sortKey === "symbol") {
        av = a.symbol;
        bv = b.symbol;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const selectClass = "rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40";

  const resetFilters = () => {
    setSearch("");
    setAccountFilter("");
    setPlatformFilter("");
    setSectorFilter("");
    setRiskFilter("");
    setAssetClassFilter("");
    setPage(1);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("holdings.searchPlaceholder")}
            className="w-56 rounded-lg border border-border bg-surface-2 py-1.5 ps-8 pe-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>
        <select className={selectClass} value={accountFilter} onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}>
          <option value="">{t("holdings.filterByAccount")}</option>
          {accounts.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select className={selectClass} value={platformFilter} onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}>
          <option value="">{t("holdings.filterByPlatform")}</option>
          {platforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className={selectClass} value={sectorFilter} onChange={(e) => { setSectorFilter(e.target.value); setPage(1); }}>
          <option value="">{t("holdings.filterBySector")}</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{t(`sector.${s}`)}</option>
          ))}
        </select>
        <select className={selectClass} value={assetClassFilter} onChange={(e) => { setAssetClassFilter(e.target.value); setPage(1); }}>
          <option value="">{t("holdings.filterByAssetClass")}</option>
          {assetClasses.map((c) => (
            <option key={c} value={c}>{t(`assetClass.${c}`)}</option>
          ))}
        </select>
        <select className={selectClass} value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}>
          <option value="">{t("holdings.filterByRisk")}</option>
          {["Low", "Medium", "High", "Critical"].map((r) => (
            <option key={r} value={r}>{t(`riskLevel.${r}`)}</option>
          ))}
        </select>
        {(search || accountFilter || platformFilter || sectorFilter || riskFilter || assetClassFilter) && (
          <button onClick={resetFilters} className="text-xs font-medium text-brand hover:underline">
            {t("common.reset")}
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <EmptyState title={t("common.noResults")} description={t("common.tryAdjusting")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[1000px] text-start text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-xs text-muted-foreground">
                  <th className="cursor-pointer select-none px-3 py-2.5 text-start font-medium" onClick={() => toggleSort("symbol")}>
                    <span className="flex items-center gap-1">{t("common.symbol")} <SortIcon active={sortKey === "symbol"} dir={sortDir} /></span>
                  </th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("holdings.assetName")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("common.platform")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("common.account")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("holdings.assetType")}</th>
                  <th className="cursor-pointer select-none px-3 py-2.5 text-end font-medium" onClick={() => toggleSort("quantity")}>
                    <span className="flex items-center justify-end gap-1">{t("holdings.quantity")} <SortIcon active={sortKey === "quantity"} dir={sortDir} /></span>
                  </th>
                  <th className="px-3 py-2.5 text-end font-medium">{t("holdings.currentPrice")}</th>
                  <th className="cursor-pointer select-none px-3 py-2.5 text-end font-medium" onClick={() => toggleSort("marketValue")}>
                    <span className="flex items-center justify-end gap-1">{t("holdings.marketValue")} <SortIcon active={sortKey === "marketValue"} dir={sortDir} /></span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-2.5 text-end font-medium" onClick={() => toggleSort("weightPct")}>
                    <span className="flex items-center justify-end gap-1">{t("holdings.weightPct")} <SortIcon active={sortKey === "weightPct"} dir={sortDir} /></span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-2.5 text-end font-medium" onClick={() => toggleSort("pnl")}>
                    <span className="flex items-center justify-end gap-1">{t("holdings.pnl")} <SortIcon active={sortKey === "pnl"} dir={sortDir} /></span>
                  </th>
                  <th className="cursor-pointer select-none px-3 py-2.5 text-end font-medium" onClick={() => toggleSort("returnPct")}>
                    <span className="flex items-center justify-end gap-1">{t("holdings.returnPct")} <SortIcon active={sortKey === "returnPct"} dir={sortDir} /></span>
                  </th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("holdings.sector")}</th>
                  <th className="px-3 py-2.5 text-start font-medium">{t("holdings.riskLevel")}</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((h) => (
                  <tr key={h.id} className="border-b border-border last:border-0 hover:bg-surface-2/60 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-foreground">{h.symbol}</td>
                    <td className="px-3 py-2.5 text-muted-foreground max-w-[180px] truncate">{h.asset.name}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{h.platformName}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{h.accountName}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{t(`assetClass.${h.asset.assetClass}`)}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums text-foreground">{formatNumber(h.quantity, language, 2)}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums text-foreground">{formatCurrency(h.currentPrice, h.asset.currency, language)}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums font-medium text-foreground">{formatCurrency(h.marketValue, baseCurrency, language)}</td>
                    <td className="px-3 py-2.5 text-end tabular-nums text-muted-foreground">{formatPercent(h.weightPct, language, { signed: false })}</td>
                    <td className={cn("px-3 py-2.5 text-end tabular-nums font-medium", h.pnl >= 0 ? "text-positive" : "text-negative")}>
                      {formatCurrency(h.pnl, baseCurrency, language, { signed: true })}
                    </td>
                    <td className={cn("px-3 py-2.5 text-end tabular-nums font-medium", h.returnPct >= 0 ? "text-positive" : "text-negative")}>
                      {formatPercent(h.returnPct, language)}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{t(`sector.${h.asset.sector}`)}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={riskLevelTone(h.asset.riskLevel)}>{t(`riskLevel.${h.asset.riskLevel}`)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("common.page")} {page} {t("common.of")} {totalPages} · {sorted.length} {t("nav.holdings")}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-border px-2.5 py-1 disabled:opacity-40"
              >
                ‹
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-border px-2.5 py-1 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
