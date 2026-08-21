"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  TrendingUp,
  ShieldAlert,
  Radar,
  Activity,
  Bell,
  Layers,
  Receipt,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useLanguage } from "@/i18n/LanguageContext";

const NAV_ITEMS = [
  { href: "/overview", key: "nav.overview", icon: LayoutDashboard },
  { href: "/accounts", key: "nav.accounts", icon: Wallet },
  { href: "/portfolio", key: "nav.portfolio", icon: PieChart },
  { href: "/performance", key: "nav.performance", icon: TrendingUp },
  { href: "/risk-center", key: "nav.riskCenter", icon: ShieldAlert },
  { href: "/exposure", key: "nav.exposure", icon: Radar },
  { href: "/stress-testing", key: "nav.stressTesting", icon: Activity },
  { href: "/alerts", key: "nav.alerts", icon: Bell },
  { href: "/holdings", key: "nav.holdings", icon: Layers },
  { href: "/transactions", key: "nav.transactions", icon: Receipt },
  { href: "/settings", key: "nav.settings", icon: Settings },
] as const;

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { t, dir } = useLanguage();
  const closedTransform = dir === "rtl" ? "translate-x-full" : "-translate-x-full";

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 flex-col border-e border-border bg-surface transition-transform lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0",
          "start-0",
          mobileOpen ? "translate-x-0" : closedTransform
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-brand-foreground shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none tracking-tight text-foreground">{t("app.name")}</p>
              <p className="mt-1 text-[10px] leading-none text-muted-foreground">{t("app.tagline")}</p>
            </div>
          </div>
          <button className="text-muted-foreground lg:hidden" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-brand" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={2} />
                <span className="truncate">{t(item.key)}</span>
                {active && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t("app.disclaimer")}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
