import React from "react";
import { cn } from "@/utils/cn";

export type BadgeTone = "neutral" | "brand" | "positive" | "negative" | "warning" | "critical" | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted-foreground border-border",
  brand: "bg-brand/10 text-brand border-brand/20",
  positive: "bg-positive-bg text-positive border-positive/20",
  negative: "bg-negative-bg text-negative border-negative/20",
  warning: "bg-warning-bg text-warning border-warning/20",
  critical: "bg-critical-bg text-critical border-critical/20",
  info: "bg-info-bg text-info border-info/20",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  dot = false,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", `bg-current`)} />}
      {children}
    </span>
  );
}

export function riskLevelTone(level: "Low" | "Medium" | "High" | "Critical"): BadgeTone {
  switch (level) {
    case "Low":
      return "positive";
    case "Medium":
      return "warning";
    case "High":
      return "negative";
    case "Critical":
      return "critical";
  }
}
