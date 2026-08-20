import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/logo";
import { Card } from "@/components/ui/primitives";
import { LoginForm } from "@/components/auth/login-form";
import { HeroBackdrop } from "@/components/site/decor";

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream-100 px-4 py-16">
      <HeroBackdrop />
      <Card className="relative w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <Logo size={56} />
          <h1 className="font-display mt-6 text-2xl text-navy-900">{t("loginTitle")}</h1>
          <p className="mt-2 text-sm text-navy-500">{t("loginSubtitle")}</p>
        </div>
        <div className="mt-8">
          <LoginForm callbackUrl="/dashboard" />
        </div>
      </Card>
    </div>
  );
}
