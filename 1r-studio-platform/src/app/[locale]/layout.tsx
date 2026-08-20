import type { Metadata } from "next";
import { Inter, Playfair_Display, Tajawal, Amiri } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "./globals.css";

const fontSans = Inter({ variable: "--font-sans", subsets: ["latin"] });
const fontDisplay = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });
const fontSansAr = Tajawal({ variable: "--font-sans-ar", subsets: ["arabic"], weight: ["300", "400", "500", "700", "800"] });
const fontDisplayAr = Amiri({ variable: "--font-display-ar", subsets: ["arabic"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "1R. Studio — Newborn, Maternity & Family Photography",
  description:
    "1R. Studio — professional newborn, maternity and family photography in Saudi Arabia. Browse packages and book your session online.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontSansAr.variable} ${fontDisplayAr.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-cream-100 text-navy-900">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
