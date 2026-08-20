"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button, Card } from "@/components/ui/primitives";

interface Category { id: string; nameEn: string; nameAr: string; type: "DIRECT" | "OPERATING" }

export function AddExpenseForm({ categories }: { categories: Category[] }) {
  const t = useTranslations("dashboard.expenses");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [notes, setNotes] = useState("");

  const selectedCategory = categories.find((c) => c.id === categoryId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, categoryId, amount, date, expenseType: selectedCategory?.type ?? "OPERATING",
        isRecurring, paymentMethod, notes,
      }),
    });
    setSubmitting(false);
    if (!res.ok) { setError(tc("error.description")); return; }
    setOpen(false);
    setName(""); setAmount(""); setNotes("");
    router.refresh();
  }

  if (!open) {
    return <Button variant="primary" onClick={() => setOpen(true)}>+ {t("addExpense")}</Button>;
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-navy-800">{t("name")}</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input mt-1.5" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-navy-800">{t("category")}</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input mt-1.5">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === "ar" ? c.nameAr : c.nameEn} — {c.type === "DIRECT" ? t("direct") : t("operating")}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-navy-800">{t("amount")}</span>
          <input required type="number" min="0" step="0.01" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} className="input mt-1.5" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-navy-800">{t("date")}</span>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input mt-1.5" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-navy-800">{t("paymentMethod")}</span>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input mt-1.5">
            <option value="BANK_TRANSFER">{locale === "ar" ? "تحويل بنكي" : "Bank Transfer"}</option>
            <option value="CASH">{locale === "ar" ? "نقدًا" : "Cash"}</option>
            <option value="CARD">{locale === "ar" ? "بطاقة" : "Card"}</option>
            <option value="OTHER">{locale === "ar" ? "أخرى" : "Other"}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end">
          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
          <span className="text-sm text-navy-700">{t("recurring")}</span>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-navy-800">{t("notes")}</span>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="input mt-1.5" />
        </label>

        {error && <p className="text-sm text-risk-red sm:col-span-2">{error}</p>}

        <div className="flex gap-3 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{tc("actions.cancel")}</Button>
          <Button type="submit" variant="primary" disabled={submitting}>{submitting ? tc("loading") : tc("actions.save")}</Button>
        </div>
      </form>
    </Card>
  );
}
