import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/primitives";
import { EditablePackageRow } from "@/components/dashboard/editable-package-row";

export default async function DashboardPackagesPage() {
  const t = await getTranslations("dashboard.profitability");
  const tc = await getTranslations("common");
  const tp = await getTranslations("packages");
  const locale = await getLocale();
  const isAr = locale === "ar";

  const packages = await prisma.package.findMany({
    orderBy: [{ service: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { service: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-navy-900">{tc("actions.edit")} · {tp("pageTitle")}</h1>
        <p className="mt-1 text-sm text-navy-500">
          {isAr
            ? "عدّلي الأسعار والتكلفة المباشرة وحالة الإتاحة لكل باقة حقيقية. التغييرات تنعكس فورًا على موقع الحجز."
            : "Edit pricing, direct cost and availability for each real package. Changes apply immediately to the booking site."}
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-4 py-3 text-start">{tp("pageTitle")}</th>
                <th className="px-4 py-3 text-start">{t("sellingPrice")}</th>
                <th className="px-4 py-3 text-start">{t("directCost")}</th>
                <th className="px-4 py-3 text-start">{tp("deposit")}</th>
                <th className="px-4 py-3 text-start">{t("margin")}</th>
                <th className="px-4 py-3 text-start">{isAr ? "نشطة" : "Active"}</th>
                <th className="px-4 py-3 text-start">{tc("actions.edit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {packages.map((p) => (
                <EditablePackageRow
                  key={p.id}
                  pkg={{
                    id: p.id, nameEn: p.nameEn, nameAr: p.nameAr,
                    price: p.price.toString(), depositAmount: p.depositAmount.toString(),
                    directCost: p.directCost.toString(), durationMinutes: p.durationMinutes, isActive: p.isActive,
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
