"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/primitives";

export function ContactForm() {
  const t = useTranslations("booking.step5");
  const locale = useLocale();
  const isAr = locale === "ar";
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (sent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
        <span className="text-4xl">✓</span>
        <p className="font-display text-xl text-navy-900">{isAr ? "تم إرسال رسالتك" : "Message sent"}</p>
        <p className="text-sm text-navy-500">
          {isAr ? "سنتواصل معك في أقرب وقت ممكن." : "We'll get back to you as soon as possible."}
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
          setSubmitting(false);
          setSent(true);
        }, 600);
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-navy-800">{t("fullName")}</label>
          <input required placeholder={t("fullNamePlaceholder")} className="mt-1.5 w-full rounded-lg border border-navy-200 px-3 py-2.5 text-sm outline-none focus:border-navy-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-navy-800">{t("phone")}</label>
          <input required dir="ltr" placeholder={t("phonePlaceholder")} className="mt-1.5 w-full rounded-lg border border-navy-200 px-3 py-2.5 text-sm outline-none focus:border-navy-500" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-navy-800">{t("email")}</label>
        <input type="email" dir="ltr" placeholder={t("emailPlaceholder")} className="mt-1.5 w-full rounded-lg border border-navy-200 px-3 py-2.5 text-sm outline-none focus:border-navy-500" />
      </div>
      <div>
        <label className="text-sm font-medium text-navy-800">{t("notes")}</label>
        <textarea rows={4} placeholder={t("notesPlaceholder")} className="mt-1.5 w-full rounded-lg border border-navy-200 px-3 py-2.5 text-sm outline-none focus:border-navy-500" />
      </div>
      <Button type="submit" variant="primary" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "…" : isAr ? "إرسال" : "Send Message"}
      </Button>
    </form>
  );
}
