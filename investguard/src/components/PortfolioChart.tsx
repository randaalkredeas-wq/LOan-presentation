"use client";

import React, { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PortfolioSnapshot, Currency } from "@/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCompactNumber, formatCurrency, formatDate } from "@/utils/formatters";

function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  const out = arr.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
  return out;
}

export function PortfolioChart({ snapshots, baseCurrency, height = 320 }: { snapshots: PortfolioSnapshot[]; baseCurrency: Currency; height?: number }) {
  const { language } = useLanguage();
  const data = useMemo(() => downsample(snapshots, 180), [snapshots]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="portfolioValueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={(v) => formatCompactNumber(v, language)}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={54}
          domain={["auto", "auto"]}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelFormatter={(d) => formatDate(String(d), language, { year: "numeric", month: "short", day: "numeric" })}
          formatter={(value, name) => [
            formatCurrency(Number(value), baseCurrency, language),
            name === "costBasis" ? "Cost Basis" : "Portfolio Value",
          ]}
        />
        <Area type="monotone" dataKey="costBasis" stroke="var(--color-muted-foreground)" strokeDasharray="4 4" fill="none" strokeWidth={1.5} />
        <Area type="monotone" dataKey="totalValue" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#portfolioValueGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
