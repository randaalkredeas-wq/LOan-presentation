import { getTranslations, getLocale } from "next-intl/server";
import { clsx } from "clsx";
import { Link } from "@/i18n/navigation";
import { Container, Card, Button } from "@/components/ui/primitives";
import { getServices, getPackages } from "@/lib/catalog";
import { formatCurrency, type Locale } from "@/lib/format";

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: activeService } = await searchParams;
  const t = await getTranslations("packages");
  const locale = (await getLocale()) as Locale;
  const [services, packages] = await Promise.all([getServices(), getPackages()]);

  const filtered = activeService ? packages.filter((p) => p.service.slug === activeService) : packages;

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl text-navy-900 sm:text-5xl">{t("pageTitle")}</h1>
        <p className="mt-4 text-navy-600">{t("pageSubtitle")}</p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        <Link
          href="/packages"
          className={clsx(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            !activeService ? "bg-navy-800 text-cream-50" : "bg-cream-200 text-navy-700 hover:bg-cream-300"
          )}
        >
          {t("allServices")}
        </Link>
        {services.map((s) => (
          <Link
            key={s.id}
            href={`/packages?service=${s.slug}`}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeService === s.slug ? "bg-navy-800 text-cream-50" : "bg-cream-200 text-navy-700 hover:bg-cream-300"
            )}
          >
            {locale === "ar" ? s.nameAr : s.nameEn}
          </Link>
        ))}
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        {filtered.map((p) => (
          <Card key={p.id} id={p.slug} className="scroll-mt-24 flex flex-col p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
                  {locale === "ar" ? p.service.nameAr : p.service.nameEn}
                </p>
                <h2 className="font-display mt-1 text-2xl text-navy-900">{locale === "ar" ? p.nameAr : p.nameEn}</h2>
              </div>
              {(locale === "ar" ? p.badgeAr : p.badgeEn) && (
                <span className="shrink-0 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600">
                  {locale === "ar" ? p.badgeAr : p.badgeEn}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-navy-600">{locale === "ar" ? p.descriptionAr : p.descriptionEn}</p>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-4xl text-navy-900 tabular-nums-ltr">
                {formatCurrency(p.price.toString(), locale)}
              </span>
              <span className="text-sm text-navy-500">
                {t("duration")}: {t("durationMinutes", { minutes: p.durationMinutes })}
              </span>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-navy-800">{t("whatsIncluded")}</p>
              <ul className="mt-3 space-y-2">
                {p.inclusions.map((inc) => (
                  <li key={inc.id} className="flex gap-2 text-sm text-navy-600">
                    <span className="mt-0.5 text-risk-green">✓</span>
                    <span>{locale === "ar" ? inc.textAr : inc.textEn}</span>
                  </li>
                ))}
              </ul>
            </div>

            {p.addons.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-navy-800">{t("addonsAvailable")}</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {p.addons.map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-lg bg-cream-100 px-3 py-2 text-xs text-navy-600">
                      <span>{locale === "ar" ? a.nameAr : a.nameEn}</span>
                      <span className="font-semibold text-navy-800 tabular-nums-ltr">
                        +{formatCurrency(a.price.toString(), locale, { decimals: 0 })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-navy-100 pt-5">
              <p className="text-xs text-navy-500">
                {t("depositNote", { amount: formatCurrency(p.depositAmount.toString(), locale, { decimals: 0 }) })}
              </p>
            </div>
            <Link href={`/book?package=${p.slug}`} className="mt-4">
              <Button variant="primary" className="w-full">
                {t("selectPackage")}
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </Container>
  );
}
