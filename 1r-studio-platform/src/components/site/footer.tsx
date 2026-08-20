import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/primitives";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");

  const links = [
    { href: "/", label: nav("home") },
    { href: "/services", label: nav("services") },
    { href: "/packages", label: nav("packages") },
    { href: "/portfolio", label: nav("portfolio") },
    { href: "/about", label: nav("about") },
    { href: "/contact", label: nav("contact") },
  ];

  return (
    <footer className="mt-24 border-t border-navy-100 bg-navy-900 text-cream-100">
      <Container className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo size={48} className="brightness-0 invert" />
          <p className="max-w-xs text-sm text-cream-200/80">{t("tagline")}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cream-300/70">{t("quickLinks")}</p>
          <ul className="mt-4 space-y-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-cream-200/80 hover:text-cream-50">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cream-300/70">{t("getInTouch")}</p>
          <ul className="mt-4 space-y-2 text-sm text-cream-200/80">
            <li dir="ltr" className="text-end sm:text-start">+966 5X XXX XXXX</li>
            <li>hello@1rstudio.sa</li>
            <li>Riyadh, Saudi Arabia</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cream-300/70">{t("followUs")}</p>
          <ul className="mt-4 space-y-2 text-sm text-cream-200/80">
            <li>Instagram — @1r.studio</li>
            <li>TikTok — @1r.studio</li>
            <li>Snapchat — @1r.studio</li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-cream-50/10 py-6">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-cream-300/60 sm:flex-row">
          <p>© {new Date().getFullYear()} 1R. Studio — {t("rights")}</p>
          <p>{t("madeWith")}</p>
        </Container>
      </div>
    </footer>
  );
}
