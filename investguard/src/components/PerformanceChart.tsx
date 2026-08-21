"use client";

import React, { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PortfolioSnapshot } from "@/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDate, formatPercent } from "@/utils/formatters";

function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  const out = arr.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
  return out;
}

export function PerformanceChart({
  snapshots,
  benchmarkSeries,
  benchmarkName,
  height = 320,
}: {
  snapshots: PortfolioSnapshot[];
  benchmarkSeries: { date: string; value: number }[];
  benchmarkName: string;
  height?: number;
}) {
  const { language, t } = useLanguage();

  const data = useMemo(() => {
    if (snapshots.length === 0) return [];
    const benchMap = new Map(benchmarkSeries.map((b) => [b.date, b.value]));
    const base = snapshots[0].totalValue;
    let benchBase: number | null = null;
    const rows = snapshots.map((s) => {
      const benchVal = benchMap.get(s.date);
      if (benchVal !== undefined && benchBase === null) benchBase = benchVal;
      return {
        date: s.date,
        portfolio: base !== 0 ? ((s.totalValue - base) / base) * 100 : 0,
        benchmark: benchVal !== undefined && benchBase ? ((benchVal - benchBase) / benchBase) * 100 : null,
      };
    });
    return downsample(rows, 180);
  }, [snapshots, benchmarkSeries]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatDate(d, language, { month: "short", day: "numeric" })}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis
          tickFormatter={(v) => `${Math.round(v)}%`}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
          labelFormatter={(d) => formatDate(String(d), language, { year: "numeric", month: "short", day: "numeric" })}
          formatter={(value, name) => [formatPercent(Number(value), language), name === "benchmark" ? benchmarkName : t("performance.myPortfolio")]}
        />
        <Legend
          formatter={(value) => (value === "benchmark" ? benchmarkName : t("performance.myPortfolio"))}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Line type="monotone" dataKey="portfolio" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} name="portfolio" />
        <Line type="monotone" dataKey="benchmark" stroke="var(--color-chart-4)" strokeWidth={2} strokeDasharray="4 3" dot={false} name="benchmark" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
