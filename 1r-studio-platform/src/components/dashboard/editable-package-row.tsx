"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/primitives";

interface PackageRow {
  id: string; nameEn: string; nameAr: string; price: string; depositAmount: string;
  directCost: string; durationMinutes: number; isActive: boolean;
}

export function EditablePackageRow({ pkg }: { pkg: PackageRow }) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [price, setPrice] = useState(pkg.price);
  const [deposit, setDeposit] = useState(pkg.depositAmount);
  const [directCost, setDirectCost] = useState(pkg.directCost);
  const [isActive, setIsActive] = useState(pkg.isActive);

  const margin = Number(price) > 0 ? ((Number(price) - Number(directCost)) / Number(price)) * 100 : 0;

  async function save() {
    setSaving(true);
    await fetch(`/api/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: Number(price), depositAmount: Number(deposit), directCost: Number(directCost), isActive }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <tr className="hover:bg-cream-50">
      <td className="px-4 py-3 font-medium text-navy-800">{locale === "ar" ? pkg.nameAr : pkg.nameEn}</td>
      <td className="px-4 py-3 tabular-nums-ltr">
        {editing ? <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input w-24" /> : formatCurrency(price, locale as "ar" | "en", { decimals: 0 })}
      </td>
      <td className="px-4 py-3 tabular-nums-ltr">
        {editing ? <input type="number" value={directCost} onChange={(e) => setDirectCost(e.target.value)} className="input w-24" /> : formatCurrency(directCost, locale as "ar" | "en", { decimals: 0 })}
      </td>
      <td className="px-4 py-3 tabular-nums-ltr">
        {editing ? <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="input w-24" /> : formatCurrency(deposit, locale as "ar" | "en", { decimals: 0 })}
      </td>
      <td className={`px-4 py-3 tabular-nums-ltr font-semibold ${margin < 40 ? "text-risk-orange" : "text-risk-green"}`}>{margin.toFixed(0)}%</td>
      <td className="px-4 py-3">
        {editing ? (
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        ) : (
          <span className={pkg.isActive ? "text-risk-green" : "text-navy-300"}>{pkg.isActive ? "●" : "○"}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex gap-2">
            <Button variant="primary" className="px-3 py-1.5 text-xs" onClick={save} disabled={saving}>{saving ? "…" : tc("actions.save")}</Button>
            <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setEditing(false)}>{tc("actions.cancel")}</Button>
          </div>
        ) : (
          <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => setEditing(true)}>{tc("actions.edit")}</Button>
        )}
      </td>
    </tr>
  );
}
