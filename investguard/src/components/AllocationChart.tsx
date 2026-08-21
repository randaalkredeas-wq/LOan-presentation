"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ExposureSlice, Currency } from "@/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatCurrency, formatPercent } from "@/utils/formatters";

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

export function AllocationChart({
  slices,
  baseCurrency,
  height = 260,
  labelFormatter,
}: {
  slices: ExposureSlice[];
  baseCurrency: Currency;
  height?: number;
  labelFormatter?: (key: string) => string;
}) {
  const { language } = useLanguage();
  const data = slices.slice(0, 8);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer width="100%" height={height} className="sm:max-w-[220px]">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={entry.key} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value, _name, item) => [
              `${formatCurrency(Number(value), baseCurrency, language)} (${formatPercent(item.payload.pct, language, { signed: false })})`,
              labelFormatter ? labelFormatter(item.payload.key) : item.payload.label,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {data.map((slice, i) => (
          <div key={slice.key} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
              <span className="truncate text-foreground">{labelFormatter ? labelFormatter(slice.key) : slice.label}</span>
            </div>
            <span className="shrink-0 tabular-nums font-medium text-muted-foreground">{formatPercent(slice.pct, language, { signed: false })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
