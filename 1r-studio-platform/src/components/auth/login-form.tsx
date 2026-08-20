"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/primitives";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("owner@1rstudio.sa");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError(t("invalidCredentials"));
      return;
    }
    router.push(searchParams.get("callbackUrl") || `/${locale}${callbackUrl}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-navy-800">{t("email")}</span>
        <input dir="ltr" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input mt-1.5" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-navy-800">{t("password")}</span>
        <input dir="ltr" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1.5" />
      </label>
      {error && <p className="text-sm text-risk-red">{error}</p>}
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? "…" : t("signIn")}
      </Button>
      <p className="text-center text-xs text-navy-400">{t("demoCredentialsNote")}</p>
    </form>
  );
}
