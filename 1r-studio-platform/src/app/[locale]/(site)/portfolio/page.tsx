import { getTranslations, getLocale } from "next-intl/server";
import { Container } from "@/components/ui/primitives";
import { CameraGlyph, HandsMotif } from "@/components/site/decor";
import { getServices } from "@/lib/catalog";
import type { Locale } from "@/lib/format";

const TILE_TONES = [
  "from-navy-800 to-navy-600",
  "from-accent-500 to-accent-300",
  "from-navy-500 to-navy-300",
  "from-accent-600 to-accent-500",
];

export default async function PortfolioPage() {
  const locale = (await getLocale()) as Locale;
  const services = await getServices();

  const isAr = locale === "ar";

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl text-navy-900 sm:text-5xl">
          {isAr ? "أعمالنا" : "Our Portfolio"}
        </h1>
        <p className="mt-4 text-navy-600">
          {isAr
            ? "معرض أعمال الاستديو قيد التحديث — يمكن لصاحبة الاستديو رفع صور الجلسات الحقيقية من لوحة التحكم."
            : "The studio's gallery is being curated — real session photos can be uploaded from the dashboard."}
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.flatMap((s, si) =>
          s.packages.slice(0, 1).map((p, pi) => (
            <div
              key={p.id}
              className={`group relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br ${TILE_TONES[(si + pi) % TILE_TONES.length]} p-6 text-cream-50`}
            >
              <HandsMotif className="absolute -bottom-4 -end-4 h-40 w-52 opacity-20" />
              <div className="relative flex h-full flex-col justify-between">
                <CameraGlyph className="h-9 w-9 opacity-80" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    {isAr ? s.nameAr : s.nameEn}
                  </p>
                  <p className="font-display mt-1 text-lg">{isAr ? p.nameAr : p.nameEn}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Container>
  );
}
