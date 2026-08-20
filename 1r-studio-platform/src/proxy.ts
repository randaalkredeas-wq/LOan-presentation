import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const locale = routing.locales.includes(segments[0] as (typeof routing.locales)[number])
    ? segments[0]
    : routing.defaultLocale;
  const isDashboard = segments.includes("dashboard");

  if (isDashboard && !req.auth) {
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
