import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/primitives";
import { EditableServiceRow } from "@/components/dashboard/editable-service-row";

export default async function DashboardServicesPage() {
  const ts = await getTranslations("services");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const isAr = locale === "ar";

  const services = await prisma.service.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { packages: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-navy-900">{ts("pageTitle")}</h1>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-xs font-semibold uppercase tracking-wide text-navy-500">
              <tr>
                <th className="px-4 py-3 text-start">{ts("pageTitle")}</th>
                <th className="px-4 py-3 text-start">{isAr ? "الباقات" : "Packages"}</th>
                <th className="px-4 py-3 text-start">{isAr ? "الحالة" : "Status"}</th>
                <th className="px-4 py-3 text-start">{tc("actions.edit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {services.map((s) => (
                <EditableServiceRow key={s.id} service={{ id: s.id, nameEn: s.nameEn, nameAr: s.nameAr, isActive: s.isActive, packagesCount: s._count.packages }} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
