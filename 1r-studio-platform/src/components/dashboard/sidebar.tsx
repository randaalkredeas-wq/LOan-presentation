"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import { Logo } from "@/components/ui/logo";

const ITEMS = [
  { href: "/dashboard", key: "overview", icon: "◧" },
  { href: "/dashboard/calendar", key: "calendar", icon: "▦" },
  { href: "/dashboard/orders", key: "orders", icon: "▤" },
  { href: "/dashboard/customers", key: "customers", icon: "◔" },
  { href: "/dashboard/services", key: "services", icon: "◈" },
  { href: "/dashboard/packages", key: "packages", icon: "◫" },
  { href: "/dashboard/sales", key: "sales", icon: "↗" },
  { href: "/dashboard/expenses", key: "expenses", icon: "▽" },
  { href: "/dashboard/profitability", key: "profitability", icon: "◎" },
  { href: "/dashboard/kri", key: "kri", icon: "⚠" },
  { href: "/dashboard/reports", key: "reports", icon: "▧" },
  { href: "/dashboard/settings", key: "settings", icon: "⚙" },
] as const;

export function DashboardSidebar() {
  const t = useTranslations("nav.dashboardNav");
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-navy-100 bg-white lg:flex">
      <div className="flex items-center gap-2 border-b border-navy-100 px-6 py-5">
        <Logo size={36} />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ITEMS.map((item) => {
          const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-navy-800 text-cream-50" : "text-navy-600 hover:bg-cream-200"
              )}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
