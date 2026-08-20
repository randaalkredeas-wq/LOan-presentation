import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, SectionEyebrow, Card, Button } from "@/components/ui/primitives";
import { CameraGlyph } from "@/components/site/decor";
import { getServices } from "@/lib/catalog";
import { formatCurrency, type Locale } from "@/lib/format";

export default async function ServicesPage() {
  const t = await getTranslations("services");
  const tp = await getTranslations("packages");
  const locale = (await getLocale()) as Locale;
  const services = await getServices();

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl text-navy-900 sm:text-5xl">{t("pageTitle")}</h1>
        <p className="mt-4 text-navy-600">{t("pageSubtitle")}</p>
      </div>

      <div className="mt-16 space-y-10">
        {services.map((s) => {
          const minPrice = Math.min(...s.packages.map((p) => Number(p.price)));
          return (
            <Card key={s.id} id={s.slug} className="scroll-mt-24 overflow-hidden">
              <div className="grid gap-8 p-8 lg:grid-cols-[1fr_2fr] lg:items-center">
                <div>
                  <CameraGlyph className="h-12 w-12 text-accent-500" />
                  <h2 className="font-display mt-4 text-2xl text-navy-900">{locale === "ar" ? s.nameAr : s.nameEn}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-navy-600">
                    {locale === "ar" ? s.descriptionAr : s.descriptionEn}
                  </p>
                  <p className="mt-4 text-sm text-navy-500">
                    {t("startingFrom")}{" "}
                    <span className="font-semibold text-navy-900 tabular-nums-ltr">{formatCurrency(minPrice, locale)}</span>
                  </p>
                  <Link href={`/packages#${s.packages[0]?.slug ?? ""}`} className="mt-5 inline-block">
                    <Button variant="outline">{t("viewPackages")}</Button>
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {s.packages.map((p) => (
                    <div key={p.id} className="rounded-xl border border-navy-100 bg-cream-50 p-4">
                      <p className="text-sm font-semibold text-navy-900">{locale === "ar" ? p.nameAr : p.nameEn}</p>
                      <p className="mt-1 text-lg font-semibold text-accent-600 tabular-nums-ltr">
                        {formatCurrency(p.price.toString(), locale)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Container>
  );
}
