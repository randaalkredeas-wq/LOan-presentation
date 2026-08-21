"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en, { TranslationDict } from "./translations/en";
import ar from "./translations/ar";

export type Language = "en" | "ar";

const dictionaries: Record<Language, TranslationDict> = { en, ar };

function getByPath(dict: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: "ltr" | "rtl";
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "investguard.language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Restoring persisted state on mount (rather than in a lazy useState
    // initializer) keeps server/client markup identical and avoids a
    // hydration mismatch, since localStorage is unavailable during SSR.
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "en" || stored === "ar") setLanguageState(stored);
    } catch {
      // ignore
    }
  }, []);

  const dir: "ltr" | "rtl" = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = dictionaries[language];
      const value = getByPath(dict, key);
      if (typeof value === "string") return interpolate(value, params);
      const fallback = getByPath(dictionaries.en, key);
      if (typeof fallback === "string") return interpolate(fallback, params);
      return key;
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, dir, t }), [language, setLanguage, dir, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
