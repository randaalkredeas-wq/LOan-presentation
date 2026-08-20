"use client";

import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/site/language-switcher";

const MOBILE_ITEMS = [
  "/dashboard", "/dashboard/calendar", "/dashboard/orders", "/dashboard/customers",
  "/dashboard/services", "/dashboard/packages", "/dashboard/sales", "/dashboard/expenses",
  "/dashboard/profitability", "/dashboard/kri", "/dashboard/reports", "/dashboard/settings",
] as const;

export function DashboardTopbar() {
  const t = useTranslations("nav.dashboardNav");
  const tc = useTranslations("common");
  const td = useTranslations("dashboard");
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const keyFor = (href: string) => href.split("/").pop() as string;

  return (
    <header className="flex flex-col gap-3 border-b border-navy-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center gap-3">
        <select
          value={pathname}
          onChange={(e) => router.push(e.target.value)}
          className="rounded-lg border border-navy-200 px-3 py-2 text-sm lg:hidden"
        >
          {MOBILE_ITEMS.map((href) => (
            <option key={href} value={href}>
              {t(href === "/dashboard" ? "overview" : keyFor(href))}
            </option>
          ))}
        </select>
        <span className="rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600">
          {td("demoDataBadge")}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <span className="hidden text-sm text-navy-600 sm:inline">{session?.user?.name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-navy-200 px-4 py-1.5 text-sm font-medium text-navy-700 hover:border-navy-800"
        >
          {tc("actions.signOut")}
        </button>
      </div>
    </header>
  );
}
