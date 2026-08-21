"use client";

import React from "react";
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { RiskAlert } from "@/types";
import { Badge, BadgeTone } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/utils/cn";

const severityConfig: Record<RiskAlert["severity"], { tone: BadgeTone; icon: typeof AlertOctagon; ring: string }> = {
  critical: { tone: "critical", icon: AlertOctagon, ring: "border-critical/30 bg-critical-bg/40" },
  high: { tone: "negative", icon: ShieldAlert, ring: "border-negative/25 bg-negative-bg/30" },
  warning: { tone: "warning", icon: AlertTriangle, ring: "border-warning/25 bg-warning-bg/30" },
  positive: { tone: "positive", icon: CheckCircle2, ring: "border-positive/25 bg-positive-bg/30" },
  info: { tone: "info", icon: Info, ring: "border-info/25 bg-info-bg/30" },
};

export function RiskAlertCard({ alert }: { alert: RiskAlert }) {
  const { t, language } = useLanguage();
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-4 animate-fade-in-up", config.ring)}>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", `text-${alert.severity === "positive" ? "positive" : alert.severity}`)}>
        <Icon className="h-4.5 w-4.5" style={{ color: `var(--color-${alert.severity === "positive" ? "positive" : alert.severity === "warning" ? "warning" : alert.severity === "critical" ? "critical" : alert.severity === "high" ? "negative" : "info"})` }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={config.tone}>{t(`alerts.${alert.severity}`)}</Badge>
          <span className="text-xs font-medium text-muted-foreground">{t(`alertCategory.${alert.category}`)}</span>
          <span className="ms-auto text-xs text-muted-foreground">{formatDate(alert.date, language)}</span>
        </div>
        <p className="mt-1.5 text-sm text-foreground">{t(alert.descriptionKey, alert.descriptionParams)}</p>
      </div>
    </div>
  );
}
