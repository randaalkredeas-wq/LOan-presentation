import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDateShort, type Locale } from "@/lib/format";
import { StatusBadge, Card } from "@/components/ui/primitives";

const STATUSES = ["NEW", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("dashboard.orders");
  const tc = await getTranslations("common");
  const tf = await getTranslations("orders.filters");

  const orders = await prisma.order.findMany({
    where: {
      ...(sp.status ? { status: sp.status as (typeof STATUSES)[number] } : {}),
      ...(sp.payment ? { paymentStatus: sp.payment as (typeof PAYMENT_STATUSES)[number] } : {}),
      ...(sp.q
        ? {
            OR: [
              { orderNumber: { contains: sp.q, mode: "insensitive" } },
              { customer: { fullName: { contains: sp.q, mode: "insensitive" } } },
              { customer: { phone: { contains: sp.q } } },
            ],
          }
        : {}),
    },
    include: { customer: true, service: true, package: true },
    orderBy: { eventDate: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl text-navy-900">{t("title")} <span className="text-base font-normal text-navy-400">({orders.length})</span></h1>
      </div>

      <form className="flex flex-wrap gap-3">
        <input name="q" defaultValue={sp.q} placeholder={tf("searchPlaceholder")} className="input max-w-xs" />
        <select name="status" defaultValue={sp.status ?? ""} className="input max-w-[180px]">
          <option value="">{tf("all")}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{tc(`status.${s}`)}</option>)}
        </select>
        <select name="payment" defaultValue={sp.payment ?? ""} className="input max-w-[180px]">
          <option value="">{tf("allPayment")}</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{tc(`status.${s}`)}</option>)}
        </select>
        <button type="submit" className="rounded-full bg-navy-800 px-5 py-2 text-sm font-semibold text-cream-50">{tc("actions.filter")}</button>
      </form>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-4 py-3 text-start">{t("orderId")}</th>
                <th className="px-4 py-3 text-start">{t("customer")}</th>
                <th className="px-4 py-3 text-start">{t("package")}</th>
                <th className="px-4 py-3 text-start">{t("eventDate")}</th>
                <th className="px-4 py-3 text-start">{t("time")}</th>
                <th className="px-4 py-3 text-start">{t("amount")}</th>
                <th className="px-4 py-3 text-start">{t("status")}</th>
                <th className="px-4 py-3 text-start">{t("paymentStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3 tabular-nums-ltr font-medium text-navy-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-navy-700">
                    <p>{o.customer.fullName}</p>
                    <p dir="ltr" className="text-xs text-navy-400">{o.customer.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-navy-600">{locale === "ar" ? o.package.nameAr : o.package.nameEn}</td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-600">{formatDateShort(o.eventDate, locale)}</td>
                  <td className="px-4 py-3 tabular-nums-ltr text-navy-600">{o.eventTime ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums-ltr font-semibold text-navy-900">{formatCurrency(o.total.toString(), locale, { decimals: 0 })}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} label={tc(`status.${o.status}`)} /></td>
                  <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} label={tc(`status.${o.paymentStatus}`)} /></td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-navy-400">{t("noOrders")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
