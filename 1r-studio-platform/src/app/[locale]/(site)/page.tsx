import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, SectionEyebrow, Button, Card } from "@/components/ui/primitives";
import { HeroBackdrop, HandsMotif, CameraGlyph } from "@/components/site/decor";
import { getServices, getPackages } from "@/lib/catalog";
import { formatCurrency } from "@/lib/format";
import type { Locale } from "@/lib/format";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const tp = await getTranslations("packages");
  const locale = (await getLocale()) as Locale;

  const [services, packages] = await Promise.all([getServices(), getPackages()]);
  const featured = packages.filter((p) => p.badgeEn).slice(0, 3);
  const showcasePackages = featured.length >= 3 ? featured : packages.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <HeroBackdrop />
        <Container className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>{t("hero.eyebrow")}</SectionEyebrow>
            <h1 className="font-display mt-4 whitespace-pre-line text-4xl leading-tight text-navy-900 sm:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-navy-600 sm:text-lg">{t("hero.subtitle")}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/book">
                <Button variant="primary">{t("hero.cta")}</Button>
              </Link>
              <Link href="/packages">
                <Button variant="outline">{t("hero.ctaSecondary")}</Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Services */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>{t("servicesSection.eyebrow")}</SectionEyebrow>
            <h2 className="font-display mt-3 text-3xl text-navy-900 sm:text-4xl">{t("servicesSection.title")}</h2>
            <p className="mt-3 text-navy-600">{t("servicesSection.subtitle")}</p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <Link key={s.id} href={`/services#${s.slug}`}>
                <Card className="group h-full p-7 transition-shadow hover:shadow-lg">
                  <CameraGlyph className="h-10 w-10 text-accent-500" />
                  <h3 className="font-display mt-5 text-xl text-navy-900">{locale === "ar" ? s.nameAr : s.nameEn}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-navy-500">
                    {locale === "ar" ? s.descriptionAr : s.descriptionEn}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-navy-800 group-hover:text-accent-600">
                    {s.packages.length} {locale === "ar" ? "باقات" : "packages"} →
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Why us */}
      <section className="bg-navy-900 py-20 text-cream-50">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow className="text-accent-300">{t("whyUs.eyebrow")}</SectionEyebrow>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl">{t("whyUs.title")}</h2>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {t.raw("whyUs.items").map((item: { title: string; text: string }, i: number) => (
              <div key={i} className="text-center sm:text-start">
                <HandsMotif className="mx-auto h-12 w-16 text-accent-300 sm:mx-0" />
                <h3 className="font-display mt-4 text-lg">{item.title}</h3>
                <p className="mt-2 text-sm text-cream-200/70">{item.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Packages preview */}
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>{t("packagesSection.eyebrow")}</SectionEyebrow>
            <h2 className="font-display mt-3 text-3xl text-navy-900 sm:text-4xl">{t("packagesSection.title")}</h2>
            <p className="mt-3 text-navy-600">{t("packagesSection.subtitle")}</p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {showcasePackages.map((p) => (
              <Card key={p.id} className="flex flex-col p-7">
                {(locale === "ar" ? p.badgeAr : p.badgeEn) && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-600">
                    {locale === "ar" ? p.badgeAr : p.badgeEn}
                  </span>
                )}
                <h3 className="font-display text-xl text-navy-900">{locale === "ar" ? p.nameAr : p.nameEn}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-navy-500">
                  {locale === "ar" ? p.descriptionAr : p.descriptionEn}
                </p>
                <p className="mt-6 font-display text-3xl text-navy-900 tabular-nums-ltr">
                  {formatCurrency(p.price.toString(), locale)}
                </p>
                <Link href={`/packages#${p.slug}`} className="mt-6">
                  <Button variant="outline" className="w-full">
                    {tp("selectPackage")}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/packages">
              <Button variant="ghost">{tc("actions.viewAll")} →</Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* CTA banner */}
      <section className="py-16">
        <Container>
          <div className="rounded-3xl bg-accent-500/10 px-8 py-16 text-center">
            <h2 className="font-display text-3xl text-navy-900 sm:text-4xl">{t("ctaBanner.title")}</h2>
            <p className="mx-auto mt-3 max-w-md text-navy-600">{t("ctaBanner.subtitle")}</p>
            <Link href="/book" className="mt-8 inline-block">
              <Button variant="primary">{t("ctaBanner.cta")}</Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
