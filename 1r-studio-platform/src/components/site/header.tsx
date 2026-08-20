import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");

  const links = [
    { href: "/", label: t("home") },
    { href: "/services", label: t("services") },
    { href: "/packages", label: t("packages") },
    { href: "/portfolio", label: t("portfolio") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="relative z-50 border-b border-navy-100/70 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={44} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-navy-700 transition-colors hover:text-navy-900">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/track" className="text-sm font-medium text-navy-600 hover:text-navy-900">
            {t("myBooking")}
          </Link>
          <LanguageSwitcher />
          <Link
            href="/book"
            className="rounded-full bg-navy-800 px-5 py-2.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-navy-700"
          >
            {tc("actions.bookNow")}
          </Link>
        </div>

        <MobileMenu links={links} bookLabel={tc("actions.bookNow")} trackLabel={t("myBooking")} />
      </div>
    </header>
  );
}
