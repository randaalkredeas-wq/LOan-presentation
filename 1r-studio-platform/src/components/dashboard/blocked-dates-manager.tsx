"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatDateShort } from "@/lib/format";
import { Button, Card } from "@/components/ui/primitives";

interface BlockedDate { id: string; date: string; reason: string | null; type: string }

export function BlockedDatesManager({ blockedDates }: { blockedDates: BlockedDate[] }) {
  const t = useTranslations("dashboard.settings");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setSubmitting(true);
    await fetch("/api/blocked-dates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason, type: "BLOCKED" }),
    });
    setSubmitting(false);
    setDate(""); setReason("");
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/blocked-dates?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-navy-800">{t("blockedDates")}</p>

      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs font-medium text-navy-600">{locale === "ar" ? "التاريخ" : "Date"}</span>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input mt-1" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-navy-600">{locale === "ar" ? "السبب" : "Reason"}</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="input mt-1" />
        </label>
        <Button type="submit" variant="primary" disabled={submitting}>+ {t("addBlockedDate")}</Button>
      </form>

      <ul className="mt-5 divide-y divide-navy-100">
        {blockedDates.map((b) => (
          <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
            <span>
              <span className="tabular-nums-ltr font-medium text-navy-800">{formatDateShort(b.date, locale as "ar" | "en")}</span>
              {b.reason && <span className="ms-2 text-navy-400">— {b.reason}</span>}
            </span>
            <button onClick={() => remove(b.id)} className="text-xs font-medium text-risk-red">{tc("actions.delete")}</button>
          </li>
        ))}
        {blockedDates.length === 0 && <li className="py-4 text-sm text-navy-400">—</li>}
      </ul>
    </Card>
  );
}
