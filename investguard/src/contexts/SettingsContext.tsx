"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/data/settings";
import { portfolioService } from "@/services";

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    portfolioService.getSettings().then((s) => {
      if (mounted) {
        setSettings(s);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const updated = await portfolioService.updateSettings(patch);
    setSettings(updated);
  }, []);

  const value = useMemo(() => ({ settings, loading, updateSettings }), [settings, loading, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
