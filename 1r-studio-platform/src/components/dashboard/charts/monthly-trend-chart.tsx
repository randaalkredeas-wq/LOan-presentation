"use client";

import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export function MonthlyTrendChart({
  data,
  barKey,
  lineKey,
  barLabel,
  lineLabel,
}: {
  data: { label: string; bar: number; line: number }[];
  barKey?: string;
  lineKey?: string;
  barLabel: string;
  lineLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="var(--brand-cream-300)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--brand-navy-500)" }} axisLine={{ stroke: "var(--brand-cream-400)" }} tickLine={false} />
        <YAxis yAxisId="bar" tick={{ fontSize: 11, fill: "var(--brand-navy-500)" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="line" orientation="right" tick={{ fontSize: 11, fill: "var(--brand-navy-500)" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid var(--brand-navy-100)", fontSize: 12 }}
          formatter={(value, name) => [Math.round(Number(value)).toLocaleString(), name === "bar" ? barLabel : lineLabel]}
        />
        <Bar yAxisId="bar" dataKey="bar" name="bar" fill="var(--brand-navy-300)" radius={[6, 6, 0, 0]} barSize={22} />
        <Line yAxisId="line" type="monotone" dataKey="line" name="line" stroke="var(--brand-accent-600)" strokeWidth={2.5} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
