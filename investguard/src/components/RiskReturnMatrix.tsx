"use client";

import React from "react";
import { CartesianGrid, Cell, ReferenceArea, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { RiskReturnPoint } from "@/calculations/riskReturnMatrix";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatPercent } from "@/utils/formatters";

const riskLevelColor: Record<RiskReturnPoint["riskLevel"], string> = {
  Low: "var(--color-risk-low)",
  Medium: "var(--color-risk-medium)",
  High: "var(--color-risk-high)",
  Critical: "var(--color-risk-critical)",
};

export function RiskReturnMatrix({ points, height = 380 }: { points: RiskReturnPoint[]; height?: number }) {
  const { language, t } = useLanguage();
  const maxReturn = Math.max(10, ...points.map((p) => Math.abs(p.returnPct))) * 1.2;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <ReferenceArea x1={0} x2={50} y1={0} y2={maxReturn} fill="var(--color-positive)" fillOpacity={0.04} />
        <ReferenceArea x1={50} x2={100} y1={0} y2={maxReturn} fill="var(--color-warning)" fillOpacity={0.04} />
        <ReferenceArea x1={0} x2={50} y1={-maxReturn} y2={0} fill="var(--color-muted-foreground)" fillOpacity={0.03} />
        <ReferenceArea x1={50} x2={100} y1={-maxReturn} y2={0} fill="var(--color-negative)" fillOpacity={0.04} />
        <XAxis
          type="number"
          dataKey="riskScore"
          name={t("riskReturn.risk")}
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
          label={{ value: t("riskReturn.risk"), position: "insideBottom", offset: -4, fontSize: 12, fill: "var(--color-muted-foreground)" }}
        />
        <YAxis
          type="number"
          dataKey="returnPct"
          name={t("riskReturn.return")}
          domain={[-maxReturn, maxReturn]}
          tickFormatter={(v) => `${Math.round(v)}%`}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          label={{ value: t("riskReturn.return"), angle: -90, position: "insideLeft", fontSize: 12, fill: "var(--color-muted-foreground)" }}
        />
        <ZAxis type="number" dataKey="size" range={[80, 500]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
          formatter={(value, name) => {
            const numeric = Number(value);
            if (name === t("riskReturn.return")) return [formatPercent(numeric, language), name];
            if (name === t("riskReturn.risk")) return [Math.round(numeric), name];
            return [numeric, name];
          }}
          labelFormatter={() => ""}
        />
        <Scatter data={points} shape="circle" fillOpacity={0.85}>
          {points.map((p) => (
            <Cell key={p.id} fill={riskLevelColor[p.riskLevel]} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
