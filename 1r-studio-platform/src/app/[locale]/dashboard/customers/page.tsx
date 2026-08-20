import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateShort, type Locale } from "@/lib/format";
import { Card } from "@/components/ui/primitives";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dashboard.customers");
  const tc = await getTranslations("customers");

  const customers = await prisma.customer.findMany({
    where: q
      ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { email: { contains: q, mode: "insensitive" } }] }
      : {},
    include: { orders: { where: { status: { not: "CANCELLED" } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const rows = customers
    .map((c) => {
      const activeOrders = c.orders;
      const totalSpending = activeOrders.reduce((s, o) => s + Number(o.total), 0);
      const lastOrder = activeOrders.length > 0 ? activeOrders.reduce((a, b) => (a.eventDate > b.eventDate ? a : b)) : null;
      return {
        id: c.id, fullName: c.fullName, phone: c.phone, email: c.email,
        ordersCount: activeOrders.length, totalSpending,
        aov: activeOrders.length > 0 ? totalSpending / activeOrders.length : 0,
        lastOrderDate: lastOrder?.eventDate ?? null,
      };
    })
    .sort((a, b) => b.totalSpending - a.totalSpending);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-navy-900">{t("title")} <span className="text-base font-normal text-navy-400">({customers.length})</span></h1>

      <form>
        <input name="q" defaultValue={q} placeholder={tc("searchPlaceholder")} className="input max-w-xs" />
      </form>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-4 py-3 text-start">{t("name")}</th>
                <th className="px-4 py-3 text-start">{t("phone")}</th>
                <th className="px-4 py-3 text-start">{t("ordersCount")}</th>
                <th className="px-4 py-3 text-start">{t("totalSpending")}</th>
                <th className="px-4 py-3 text-start">{t("aov")}</th>
                <th className="px-4 py-3 text-start">{t("lastOrder")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3 font-medium text-navy-800">{c.fullName}</td>
                  <td dir="ltr" className="px-4 py-3 text-navy-500">{c.phone}</td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-600">
                    {c.ordersCount} {c.ordersCount > 1 && <span className="ms-1 rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-semibold text-accent-600">{locale === "ar" ? "متكررة" : "repeat"}</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums-ltr font-semibold text-navy-900">{formatCurrency(c.totalSpending, locale, { decimals: 0 })}</td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-600">{formatCurrency(c.aov, locale, { decimals: 0 })}</td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-500">{c.lastOrderDate ? formatDateShort(c.lastOrderDate, locale) : "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-navy-400">—</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
