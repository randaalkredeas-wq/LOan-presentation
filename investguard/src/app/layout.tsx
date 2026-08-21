import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { DateRangeProvider } from "@/contexts/DateRangeContext";
import { AppShell } from "@/components/layout/AppShell";

const latinSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-latin-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const arabicSans = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "InvestGuard — Personal Investment Command Center",
  description:
    "Consolidate every brokerage, fund and platform into one unified dashboard. See your true exposure, performance and risk — not just where your money is.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${latinSans.variable} ${arabicSans.variable} antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <SettingsProvider>
              <DateRangeProvider>
                <AppShell>{children}</AppShell>
              </DateRangeProvider>
            </SettingsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
