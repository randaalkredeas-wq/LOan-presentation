"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { DateRangeKey } from "@/types";
import { CustomRange } from "@/utils/dateRange";

interface DateRangeContextValue {
  range: DateRangeKey;
  setRange: (r: DateRangeKey) => void;
  customRange: CustomRange;
  setCustomRange: (r: CustomRange) => void;
}

const DateRangeContext = createContext<DateRangeContextValue | undefined>(undefined);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [range, setRange] = useState<DateRangeKey>("1Y");
  const [customRange, setCustomRange] = useState<CustomRange>({ from: "", to: "" });

  const value = useMemo(() => ({ range, setRange, customRange, setCustomRange }), [range, customRange]);

  return <DateRangeContext.Provider value={value}>{children}</DateRangeContext.Provider>;
}

export function useDateRange(): DateRangeContextValue {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within DateRangeProvider");
  return ctx;
}
