import { clsx } from "clsx";
import type { ReactNode } from "react";
import type { RiskLevel } from "@/lib/kri";
import type { Trend } from "@/lib/periods";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Card({
  className,
  children,
  ...props
}: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-2xl border border-navy-100 bg-white shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx("text-xs font-semibold uppercase tracking-[0.2em] text-accent-600", className)}>
      {children}
    </p>
  );
}

const buttonVariants = {
  primary: "bg-navy-800 text-cream-50 hover:bg-navy-700 focus-visible:outline-navy-800",
  secondary: "bg-cream-200 text-navy-900 hover:bg-cream-300",
  outline: "border border-navy-800 text-navy-800 hover:bg-navy-800 hover:text-cream-50",
  ghost: "text-navy-800 hover:bg-navy-50",
  accent: "bg-accent-500 text-white hover:bg-accent-600",
} as const;

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: {
  variant?: keyof typeof buttonVariants;
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
        buttonVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

const RISK_STYLES: Record<RiskLevel, string> = {
  GREEN: "bg-risk-green/10 text-risk-green ring-1 ring-inset ring-risk-green/30",
  YELLOW: "bg-risk-yellow/10 text-risk-yellow ring-1 ring-inset ring-risk-yellow/30",
  ORANGE: "bg-risk-orange/10 text-risk-orange ring-1 ring-inset ring-risk-orange/30",
  RED: "bg-risk-red/10 text-risk-red ring-1 ring-inset ring-risk-red/30",
};
const RISK_DOT: Record<RiskLevel, string> = {
  GREEN: "bg-risk-green", YELLOW: "bg-risk-yellow", ORANGE: "bg-risk-orange", RED: "bg-risk-red",
};

export function RiskBadge({ level, label, className }: { level: RiskLevel; label: string; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", RISK_STYLES[level], className)}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", RISK_DOT[level])} />
      {label}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-200",
  PENDING: "bg-risk-yellow/10 text-risk-yellow ring-1 ring-inset ring-risk-yellow/30",
  CONFIRMED: "bg-risk-green/10 text-risk-green ring-1 ring-inset ring-risk-green/30",
  IN_PROGRESS: "bg-accent-500/10 text-accent-600 ring-1 ring-inset ring-accent-500/30",
  COMPLETED: "bg-navy-800/10 text-navy-800 ring-1 ring-inset ring-navy-800/30",
  CANCELLED: "bg-risk-red/10 text-risk-red ring-1 ring-inset ring-risk-red/30",
  UNPAID: "bg-risk-red/10 text-risk-red ring-1 ring-inset ring-risk-red/30",
  PARTIALLY_PAID: "bg-risk-yellow/10 text-risk-yellow ring-1 ring-inset ring-risk-yellow/30",
  PAID: "bg-risk-green/10 text-risk-green ring-1 ring-inset ring-risk-green/30",
  REFUNDED: "bg-navy-100 text-navy-600 ring-1 ring-inset ring-navy-200",
};

export function StatusBadge({ status, label, className }: { status: string; label: string; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLES[status] ?? "bg-navy-50 text-navy-700", className)}>
      {label}
    </span>
  );
}

export function TrendArrow({ trend, className }: { trend: Trend; className?: string }) {
  if (trend === "flat") return <span className={clsx("text-navy-400", className)}>→</span>;
  return (
    <span className={clsx(trend === "up" ? "text-risk-green" : "text-risk-red", className)}>
      {trend === "up" ? "↑" : "↓"}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-md bg-navy-100/70", className)} />;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-navy-200 bg-cream-50 px-6 py-16 text-center">
      <p className="font-display text-lg text-navy-800">{title}</p>
      <p className="max-w-sm text-sm text-navy-500">{description}</p>
    </div>
  );
}
