import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container, Button, Card } from "@/components/ui/primitives";
import { HandsMotif } from "@/components/site/decor";
import { getServiceBySlug } from "@/lib/catalog";
import type { Locale } from "@/lib/format";

export default async function AboutPage() {
  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const newborn = await getServiceBySlug("newborn-hospital");

  const values = isAr
    ? [
        { title: "الخصوصية أولًا", text: "نراعي أعلى معايير النظافة والخصوصية داخل غرفة الولادة والاستديو." },
        { title: "لمسة هادئة", text: "بيئة تصوير آمنة وهادئة تناسب حساسية المولود الجديد." },
        { title: "جودة احترافية", text: "كاميرات ومعدات احترافية، وتعديل دقيق لكل صورة تسلّم لك." },
        { title: "تسليم موثوق", text: "التزام صارم بالمواعيد وتسليم سريع للصور والفيديوهات." },
      ]
    : [
        { title: "Privacy first", text: "The highest standards of cleanliness and privacy inside the delivery room and studio." },
        { title: "A gentle touch", text: "A calm, safe photography environment suited to a newborn's sensitivity." },
        { title: "Professional quality", text: "Professional cameras and gear, with careful retouching on every photo delivered." },
        { title: "Reliable delivery", text: "Strict punctuality and fast delivery of your photos and videos." },
      ];

  return (
    <div>
      <Container className="py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="font-display text-4xl text-navy-900 sm:text-5xl">
              {isAr ? "من نحن" : "About 1R. Studio"}
            </h1>
            <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-navy-600">
              {newborn ? (isAr ? newborn.descriptionAr : newborn.descriptionEn) : ""}
            </p>
            <Link href="/book" className="mt-8 inline-block">
              <Button variant="primary">{isAr ? "احجزي جلستك" : "Book Your Session"}</Button>
            </Link>
          </div>
          <div className="relative flex aspect-square items-center justify-center rounded-3xl bg-navy-900">
            <HandsMotif className="h-40 w-56 text-accent-300" />
          </div>
        </div>
      </Container>

      <section className="bg-cream-200 py-20">
        <Container>
          <h2 className="font-display text-center text-3xl text-navy-900">{isAr ? "قيمنا" : "Our Values"}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <Card key={v.title} className="p-6">
                <h3 className="font-display text-lg text-navy-900">{v.title}</h3>
                <p className="mt-2 text-sm text-navy-600">{v.text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
