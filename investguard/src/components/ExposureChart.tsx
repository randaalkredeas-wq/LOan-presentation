"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExposureSlice } from "@/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatPercent } from "@/utils/formatters";

const PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "#a78bfa",
  "#f472b6",
];

export function ExposureChart({
  slices,
  limit,
  height,
  labelFormatter,
}: {
  slices: ExposureSlice[];
  limit?: number;
  height?: number;
  labelFormatter?: (key: string) => string;
}) {
  const { language } = useLanguage();
  const data = slices.map((s) => ({ ...s, displayLabel: labelFormatter ? labelFormatter(s.key) : s.label }));
  const chartHeight = height ?? Math.max(180, data.length * 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => `${Math.round(v)}%`}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          domain={[0, (dataMax: number) => Math.max(dataMax * 1.15, limit ? limit * 1.15 : 0)]}
        />
        <YAxis
          type="category"
          dataKey="displayLabel"
          tick={{ fontSize: 12, fill: "var(--color-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={130}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(value) => [formatPercent(Number(value), language, { signed: false }), ""]}
        />
        {limit !== undefined && (
          <ReferenceLine x={limit} stroke="var(--color-negative)" strokeDasharray="4 4" strokeWidth={1.5} />
        )}
        <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((entry, i) => (
            <Cell key={entry.key} fill={limit !== undefined && entry.pct > limit ? "var(--color-negative)" : PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
