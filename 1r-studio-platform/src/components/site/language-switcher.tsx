"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { clsx } from "clsx";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const other = locale === "ar" ? "en" : "ar";
  const otherLabel = locale === "ar" ? t("english") : t("arabic");

  function switchLocale() {
    const qs = searchParams.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { locale: other });
  }

  return (
    <button
      onClick={switchLocale}
      className={clsx(
        "rounded-full border border-navy-200 px-4 py-1.5 text-sm font-medium text-navy-700 transition-colors hover:border-navy-800 hover:text-navy-900",
        className
      )}
      aria-label={t("language")}
    >
      {otherLabel}
    </button>
  );
}
