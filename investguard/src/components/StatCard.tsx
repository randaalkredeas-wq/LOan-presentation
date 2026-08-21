import React from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

export function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "positive" | "negative" | "brand";
  className?: string;
}) {
  const toneClass = {
    neutral: "text-foreground",
    positive: "text-positive",
    negative: "text-negative",
    brand: "text-brand",
  }[tone];

  return (
    <Card className={cn("p-5 animate-fade-in-up", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums tracking-tight", toneClass)}>{value}</p>
      {subValue && <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>}
    </Card>
  );
}
