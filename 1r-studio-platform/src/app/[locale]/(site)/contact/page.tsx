import { getLocale } from "next-intl/server";
import { Container, Card } from "@/components/ui/primitives";
import { ContactForm } from "@/components/site/contact-form";
import type { Locale } from "@/lib/format";

export default async function ContactPage() {
  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl text-navy-900 sm:text-5xl">{isAr ? "تواصلي معنا" : "Get in Touch"}</h1>
        <p className="mt-4 text-navy-600">
          {isAr
            ? "لديك سؤال قبل الحجز؟ راسلينا وسنعود إليك في أقرب وقت."
            : "Have a question before booking? Send us a message and we'll get back to you shortly."}
        </p>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-5">
        <Card className="p-8 lg:col-span-2">
          <dl className="space-y-6 text-sm">
            <div>
              <dt className="font-semibold text-navy-800">{isAr ? "الجوال / واتساب" : "Phone / WhatsApp"}</dt>
              <dd dir="ltr" className="mt-1 text-navy-600">+966 5X XXX XXXX</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-800">{isAr ? "البريد الإلكتروني" : "Email"}</dt>
              <dd className="mt-1 text-navy-600">hello@1rstudio.sa</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-800">{isAr ? "الموقع" : "Location"}</dt>
              <dd className="mt-1 text-navy-600">{isAr ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy-800">{isAr ? "ساعات العمل" : "Working Hours"}</dt>
              <dd className="mt-1 text-navy-600">{isAr ? "السبت – الخميس، 9 صباحًا – 8 مساءً" : "Sat – Thu, 9 AM – 8 PM"}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-8 lg:col-span-3">
          <ContactForm />
        </Card>
      </div>
    </Container>
  );
}
