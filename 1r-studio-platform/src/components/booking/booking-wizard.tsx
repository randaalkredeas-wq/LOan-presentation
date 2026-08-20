"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { clsx } from "clsx";
import { Link } from "@/i18n/navigation";
import { Container, Button, Card } from "@/components/ui/primitives";
import { CameraGlyph } from "@/components/site/decor";
import { formatCurrency, formatDate, type Locale } from "@/lib/format";
import { StepIndicator } from "./step-indicator";
import { BookingCalendar } from "./calendar";
import { TimePicker } from "./time-picker";

// Plain, JSON-serializable shapes — Prisma's Decimal is a class instance and
// cannot cross the Server -> Client Component boundary, so pages must map to
// these DTOs (see lib/catalog-dto.ts) before rendering <BookingWizard>.
export interface AddonDTO { id: string; nameEn: string; nameAr: string; price: string }
export interface InclusionDTO { id: string; textEn: string; textAr: string }
export interface PackageDTO {
  id: string; serviceId: string; slug: string; nameEn: string; nameAr: string;
  descriptionEn: string; descriptionAr: string; price: string; depositAmount: string;
  durationMinutes: number; inclusions: InclusionDTO[]; addons: AddonDTO[];
}
export interface ServiceWithPackages {
  id: string; slug: string; nameEn: string; nameAr: string;
  descriptionEn: string; descriptionAr: string; packages: PackageDTO[];
}
type PackageWithDetails = PackageDTO;

interface ConfirmationResult {
  orderNumber: string; customerName: string;
  serviceNameEn: string; serviceNameAr: string;
  packageNameEn: string; packageNameAr: string;
  eventDate: string; eventTime: string; total: string; status: string;
}

export function BookingWizard({
  services,
  initialPackageSlug,
}: {
  services: ServiceWithPackages[];
  initialPackageSlug?: string;
}) {
  const t = useTranslations("booking");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  const initialPackage = initialPackageSlug
    ? services.flatMap((s) => s.packages).find((p) => p.slug === initialPackageSlug)
    : undefined;
  const initialService = initialPackage ? services.find((s) => s.id === initialPackage.serviceId) : undefined;

  const [step, setStep] = useState(initialPackage ? 3 : 1);
  const [serviceId, setServiceId] = useState<string | null>(initialService?.id ?? null);
  const [packageId, setPackageId] = useState<string | null>(initialPackage?.id ?? null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmationResult | null>(null);

  const selectedService = services.find((s) => s.id === serviceId) ?? null;
  const selectedPackage: PackageWithDetails | null =
    services.flatMap((s) => s.packages).find((p) => p.id === packageId) ?? null;
  const selectedAddons = selectedPackage?.addons.filter((a) => addonIds.includes(a.id)) ?? [];
  const addonsTotal = selectedAddons.reduce((s, a) => s + Number(a.price), 0);
  const total = (selectedPackage ? Number(selectedPackage.price) : 0) + addonsTotal;

  const steps = [t("steps.service"), t("steps.package"), t("steps.date"), t("steps.time"), t("steps.details"), t("steps.review")];

  function next() { setStep((s) => Math.min(s + 1, 7)); setError(null); }
  function back() { setStep((s) => Math.max(s - 1, 1)); setError(null); }

  async function submitBooking() {
    if (!selectedPackage || !date || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          addonIds,
          eventDate: date,
          eventTime: time,
          customer: { fullName, phone, email: email || undefined },
          location, additionalRequirements, notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "slot_taken") {
          setError(t("errors.slotTaken"));
          setStep(3);
          setDate(null);
          setTime(null);
        } else {
          setError(t("errors.generic"));
        }
        return;
      }
      setResult(data);
      setStep(7);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 7 && result) {
    return <Confirmation result={result} locale={locale} />;
  }

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-center text-3xl text-navy-900 sm:text-4xl">{t("pageTitle")}</h1>
        <div className="mt-10">
          <StepIndicator steps={steps} current={step} />
        </div>

        {error && <p className="mt-4 rounded-xl bg-risk-red/10 p-4 text-sm text-risk-red">{error}</p>}

        <Card className="mt-6 p-6 sm:p-8">
          {step === 1 && (
            <div>
              <h2 className="font-display text-xl text-navy-900">{t("step1.title")}</h2>
              <p className="mt-1 text-sm text-navy-500">{t("step1.subtitle")}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setServiceId(s.id); setPackageId(null); next(); }}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl border p-4 text-start transition-colors",
                      serviceId === s.id ? "border-navy-800 bg-navy-50" : "border-navy-100 hover:border-navy-300"
                    )}
                  >
                    <CameraGlyph className="h-8 w-8 shrink-0 text-accent-500" />
                    <span>
                      <span className="block text-sm font-semibold text-navy-900">{isAr ? s.nameAr : s.nameEn}</span>
                      <span className="block text-xs text-navy-500">{s.packages.length} {isAr ? "باقات" : "packages"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedService && (
            <div>
              <h2 className="font-display text-xl text-navy-900">{t("step2.title")}</h2>
              <p className="mt-1 text-sm text-navy-500">{t("step2.subtitle")}</p>
              <div className="mt-6 space-y-3">
                {selectedService.packages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setPackageId(p.id); setAddonIds([]); next(); }}
                    className={clsx(
                      "w-full rounded-xl border p-4 text-start transition-colors",
                      packageId === p.id ? "border-navy-800 bg-navy-50" : "border-navy-100 hover:border-navy-300"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-navy-900">{isAr ? p.nameAr : p.nameEn}</span>
                      <span className="font-display text-lg text-navy-900 tabular-nums-ltr">{formatCurrency(p.price.toString(), locale)}</span>
                    </div>
                    <p className="mt-1 text-xs text-navy-500">{isAr ? p.descriptionAr : p.descriptionEn}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6"><Button variant="ghost" onClick={back}>← {tc("actions.back")}</Button></div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-xl text-navy-900">{t("step3.title")}</h2>
              <p className="mt-1 text-sm text-navy-500">{t("step3.subtitle")}</p>
              <div className="mt-6">
                <BookingCalendar selectedDate={date} onSelect={(d) => { setDate(d); setTime(null); next(); }} />
              </div>
              <div className="mt-6"><Button variant="ghost" onClick={back}>← {tc("actions.back")}</Button></div>
            </div>
          )}

          {step === 4 && date && (
            <div>
              <h2 className="font-display text-xl text-navy-900">{t("step4.title")}</h2>
              <TimePicker date={date} selectedTime={time} onSelect={(tm) => { setTime(tm); next(); }} />
              <div className="mt-6"><Button variant="ghost" onClick={back}>← {tc("actions.back")}</Button></div>
            </div>
          )}

          {step === 5 && selectedPackage && (
            <div>
              <h2 className="font-display text-xl text-navy-900">{t("step5.title")}</h2>
              <p className="mt-1 text-sm text-navy-500">{t("step5.subtitle")}</p>

              <form
                className="mt-6 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!fullName.trim() || !phone.trim()) { setError(t("errors.required")); return; }
                  next();
                }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t("step5.fullName")}>
                    <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("step5.fullNamePlaceholder")} className="input" />
                  </Field>
                  <Field label={t("step5.phone")}>
                    <input required dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("step5.phonePlaceholder")} className="input" />
                  </Field>
                </div>
                <Field label={t("step5.email")}>
                  <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("step5.emailPlaceholder")} className="input" />
                </Field>
                <Field label={t("step5.location")}>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("step5.locationPlaceholder")} className="input" />
                </Field>
                <Field label={t("step5.additionalRequirements")}>
                  <textarea rows={3} value={additionalRequirements} onChange={(e) => setAdditionalRequirements(e.target.value)} placeholder={t("step5.additionalRequirementsPlaceholder")} className="input" />
                </Field>
                <Field label={t("step5.notes")}>
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("step5.notesPlaceholder")} className="input" />
                </Field>

                {selectedPackage.addons.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-navy-800">{t("step5.addons")}</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {selectedPackage.addons.map((a) => (
                        <label key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm">
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={addonIds.includes(a.id)}
                              onChange={(e) =>
                                setAddonIds((prev) => (e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)))
                              }
                            />
                            {isAr ? a.nameAr : a.nameEn}
                          </span>
                          <span className="font-semibold tabular-nums-ltr">+{formatCurrency(a.price.toString(), locale, { decimals: 0 })}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={back}>← {tc("actions.back")}</Button>
                  <Button type="submit" variant="primary">{tc("actions.continue")}</Button>
                </div>
              </form>
            </div>
          )}

          {step === 6 && selectedPackage && selectedService && date && time && (
            <div>
              <h2 className="font-display text-xl text-navy-900">{t("step6.title")}</h2>
              <p className="mt-1 text-sm text-navy-500">{t("step6.subtitle")}</p>

              <dl className="mt-6 divide-y divide-navy-100 text-sm">
                <Row label={t("step6.service")} value={isAr ? selectedService.nameAr : selectedService.nameEn} />
                <Row label={t("step6.package")} value={isAr ? selectedPackage.nameAr : selectedPackage.nameEn} />
                {selectedAddons.length > 0 && (
                  <Row label={t("step6.addons")} value={selectedAddons.map((a) => (isAr ? a.nameAr : a.nameEn)).join("، ")} />
                )}
                <Row label={t("step6.date")} value={formatDate(date, locale)} />
                <Row label={t("step6.time")} value={time} ltr />
                <Row label={t("step6.customer")} value={`${fullName} — ${phone}`} ltr />
                <Row label={t("step6.packagePrice")} value={formatCurrency(selectedPackage.price.toString(), locale)} />
                {addonsTotal > 0 && <Row label={t("step6.addonsTotal")} value={formatCurrency(addonsTotal, locale)} />}
                <Row label={t("step6.total")} value={formatCurrency(total, locale)} bold />
                <Row label={t("step6.depositDue")} value={formatCurrency(selectedPackage.depositAmount.toString(), locale)} accent />
              </dl>

              <p className="mt-4 text-xs text-navy-500">{t("step6.termsNote")}</p>

              <div className="mt-6 flex gap-3">
                <Button type="button" variant="ghost" onClick={back}>← {tc("actions.back")}</Button>
                <Button type="button" variant="primary" disabled={submitting} onClick={submitBooking}>
                  {submitting ? tc("loading") : t("step6.submit")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-navy-800">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Row({ label, value, bold, accent, ltr }: { label: string; value: string; bold?: boolean; accent?: boolean; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-navy-500">{label}</dt>
      <dd className={clsx(ltr && "tabular-nums-ltr", bold && "font-display text-lg text-navy-900", accent && "font-semibold text-accent-600", !bold && !accent && "text-navy-800")}>
        {value}
      </dd>
    </div>
  );
}

function Confirmation({ result, locale }: { result: ConfirmationResult; locale: Locale }) {
  const t = useTranslations("booking.confirmation");
  const tc = useTranslations("common");
  const isAr = locale === "ar";

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-risk-green/10 text-3xl text-risk-green">✓</div>
        <h1 className="font-display mt-6 text-3xl text-navy-900">{t("title")}</h1>
        <p className="mt-2 text-navy-600">{t("subtitle")}</p>

        <Card className="mt-8 p-6 text-start">
          <dl className="divide-y divide-navy-100 text-sm">
            <Row label={t("bookingNumber")} value={result.orderNumber} bold ltr />
            <Row label={t("customerName")} value={result.customerName} />
            <Row label={t("service")} value={isAr ? result.serviceNameAr : result.serviceNameEn} />
            <Row label={t("package")} value={isAr ? result.packageNameAr : result.packageNameEn} />
            <Row label={t("date")} value={formatDate(result.eventDate, locale)} />
            <Row label={t("time")} value={result.eventTime} ltr />
            <Row label={t("amount")} value={formatCurrency(result.total, locale)} accent />
            <Row label={t("status")} value={tc(`status.${result.status}`)} />
          </dl>
        </Card>

        <p className="mt-4 text-xs text-navy-500">{t("trackHint")}</p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/"><Button variant="outline">{t("backHome")}</Button></Link>
          <Link href={`/track?orderNumber=${result.orderNumber}`}><Button variant="primary">{t("trackBooking")}</Button></Link>
        </div>
      </div>
    </Container>
  );
}
