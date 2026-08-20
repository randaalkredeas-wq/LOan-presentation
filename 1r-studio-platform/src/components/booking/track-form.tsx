"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container, Button, Card } from "@/components/ui/primitives";
import { formatCurrency, formatDate, type Locale } from "@/lib/format";

interface TrackResult {
  orderNumber: string; customerName: string;
  serviceNameEn: string; serviceNameAr: string;
  packageNameEn: string; packageNameAr: string;
  eventDate: string; eventTime: string; total: string; paid: string;
  status: string; paymentStatus: string;
}

export function TrackForm({ initialOrderNumber }: { initialOrderNumber?: string }) {
  const t = useTranslations("booking.track");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber ?? "");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setResult(null);
    try {
      const res = await fetch(`/api/bookings/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`);
      if (!res.ok) { setNotFound(true); return; }
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-center text-3xl text-navy-900 sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-center text-navy-600">{t("subtitle")}</p>

        <Card className="mt-8 p-6">
          <form onSubmit={search} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">{t("bookingNumber")}</span>
              <input required dir="ltr" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="input mt-1.5" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">{t("phone")}</span>
              <input required dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1.5" />
            </label>
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? tc("loading") : t("find")}
            </Button>
          </form>

          {notFound && <p className="mt-4 text-sm text-risk-red">{t("notFound")}</p>}

          {result && (
            <dl className="mt-6 divide-y divide-navy-100 border-t border-navy-100 text-sm">
              <Row label={isAr ? "الحالة" : "Status"} value={tc(`status.${result.status}`)} />
              <Row label={isAr ? "حالة الدفع" : "Payment"} value={tc(`status.${result.paymentStatus}`)} />
              <Row label={isAr ? "الخدمة" : "Service"} value={isAr ? result.serviceNameAr : result.serviceNameEn} />
              <Row label={isAr ? "الباقة" : "Package"} value={isAr ? result.packageNameAr : result.packageNameEn} />
              <Row label={isAr ? "التاريخ" : "Date"} value={formatDate(result.eventDate, locale)} />
              <Row label={isAr ? "الوقت" : "Time"} value={result.eventTime} ltr />
              <Row label={isAr ? "الإجمالي" : "Total"} value={formatCurrency(result.total, locale)} />
              <Row label={isAr ? "المدفوع" : "Paid"} value={formatCurrency(result.paid, locale)} />
            </dl>
          )}
        </Card>
      </div>
    </Container>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-navy-500">{label}</dt>
      <dd className={ltr ? "tabular-nums-ltr font-medium text-navy-800" : "font-medium text-navy-800"}>{value}</dd>
    </div>
  );
}
