"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/primitives";

interface ServiceRow { id: string; nameEn: string; nameAr: string; isActive: boolean; packagesCount: number }

export function EditableServiceRow({ service }: { service: ServiceRow }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [isActive, setIsActive] = useState(service.isActive);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    const next = !isActive;
    await fetch(`/api/services/${service.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: next }),
    });
    setIsActive(next);
    setSaving(false);
    router.refresh();
  }

  return (
    <tr className="hover:bg-cream-50">
      <td className="px-4 py-3 font-medium text-navy-800">{locale === "ar" ? service.nameAr : service.nameEn}</td>
      <td className="px-4 py-3 tabular-nums-ltr text-navy-600">{service.packagesCount}</td>
      <td className="px-4 py-3">
        <span className={isActive ? "text-risk-green" : "text-navy-300"}>
          {isActive ? `● ${isAr ? "نشطة" : "Active"}` : `○ ${isAr ? "غير نشطة" : "Inactive"}`}
        </span>
      </td>
      <td className="px-4 py-3">
        <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={toggle} disabled={saving}>
          {saving ? "…" : isActive ? (isAr ? "إلغاء التنشيط" : "Deactivate") : (isAr ? "تنشيط" : "Activate")}
        </Button>
      </td>
    </tr>
  );
}
