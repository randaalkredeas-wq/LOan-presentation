"use client";

import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/utils/cn";

const ZONES = [
  { max: 30, color: "var(--color-risk-low)", key: "Low" },
  { max: 60, color: "var(--color-risk-medium)", key: "Moderate" },
  { max: 80, color: "var(--color-risk-high)", key: "High" },
  { max: 100, color: "var(--color-risk-critical)", key: "Critical" },
];

function levelForScore(score: number): "Low" | "Moderate" | "High" | "Critical" {
  if (score <= 30) return "Low";
  if (score <= 60) return "Moderate";
  if (score <= 80) return "High";
  return "Critical";
}

export function RiskGauge({ score, size = 220 }: { score: number; size?: number }) {
  const { t } = useLanguage();
  const clamped = Math.max(0, Math.min(100, score));
  const level = levelForScore(clamped);
  const radius = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 180;

  const polarToCartesian = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  const arcPath = (fromAngle: number, toAngle: number) => {
    const start = polarToCartesian(fromAngle);
    const end = polarToCartesian(toAngle);
    const largeArc = fromAngle - toAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const zoneArcs = ZONES.reduce<{ items: (typeof ZONES[number] & { path: string })[]; prevPct: number }>(
    (acc, zone) => {
      const fromAngle = startAngle - (acc.prevPct / 100) * 180;
      const toAngle = startAngle - (zone.max / 100) * 180;
      acc.items.push({ ...zone, path: arcPath(fromAngle, toAngle) });
      acc.prevPct = zone.max;
      return acc;
    },
    { items: [], prevPct: 0 }
  ).items;

  const needleAngle = startAngle - (clamped / 100) * 180;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = radius - 10;
  const needleX = cx + needleLength * Math.cos(needleRad);
  const needleY = cy - needleLength * Math.sin(needleRad);

  const levelColor = `var(--color-risk-${level.toLowerCase()})`;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {zoneArcs.map((zone) => (
          <path key={zone.key} d={zone.path} stroke={zone.color} strokeWidth={14} strokeLinecap="round" fill="none" opacity={0.9} />
        ))}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="var(--color-foreground)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill="var(--color-foreground)" />
        <text x={cx} y={cy - 34} textAnchor="middle" className="fill-foreground" style={{ fontSize: 34, fontWeight: 800 }}>
          {Math.round(clamped)}
        </text>
        <text x={cx} y={cy - 12} textAnchor="middle" className="fill-current text-muted-foreground" style={{ fontSize: 11 }}>
          / 100
        </text>
      </svg>
      <span
        className={cn("mt-1 rounded-full px-3 py-1 text-xs font-semibold")}
        style={{ color: levelColor, backgroundColor: `color-mix(in srgb, ${levelColor} 15%, transparent)` }}
      >
        {t(`riskScoreLevel.${level}`)}
      </span>
    </div>
  );
}
