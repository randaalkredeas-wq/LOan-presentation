"use client";

import React, { useEffect, useState } from "react";
import { InvestmentAccount, InvestmentPlatform, Currency, RiskLevel } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { useLanguage } from "@/i18n/LanguageContext";
import { localizedName } from "@/utils/formatters";

export interface AccountFormValue {
  platformName: string;
  accountName: string;
  currency: Currency;
  totalValue: number;
  costBasis: number;
  cashBalance: number;
  riskLevel: RiskLevel;
}

const CURRENCIES: Currency[] = ["SAR", "USD", "EUR", "GBP"];
const RISK_LEVELS: RiskLevel[] = ["Low", "Medium", "High", "Critical"];

export function AccountFormModal({
  open,
  onClose,
  onSubmit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: AccountFormValue) => void;
  initial?: { account: InvestmentAccount; platform: InvestmentPlatform };
}) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState<AccountFormValue>({
    platformName: "",
    accountName: "",
    currency: "SAR",
    totalValue: 0,
    costBasis: 0,
    cashBalance: 0,
    riskLevel: "Medium",
  });

  useEffect(() => {
    // Re-seed the draft form whenever the modal is (re)opened for a
    // different account, or reset to a blank draft for "add account".
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        platformName: localizedName(initial.platform, language),
        accountName: localizedName(initial.account, language),
        currency: initial.account.currency,
        totalValue: initial.account.totalValue,
        costBasis: initial.account.costBasis,
        cashBalance: initial.account.cashBalance,
        riskLevel: initial.account.riskLevel,
      });
    } else {
      setForm({ platformName: "", accountName: "", currency: "SAR", totalValue: 0, costBasis: 0, cashBalance: 0, riskLevel: "Medium" });
    }
  }, [initial, open, language]);

  const inputClass = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/40";
  const labelClass = "flex flex-col gap-1.5 text-xs font-medium text-muted-foreground";

  return (
    <Modal open={open} onClose={onClose} title={initial ? t("accounts.editAccount") : t("accounts.addAccount")}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            {t("accounts.platformName")}
            <input
              required
              className={inputClass}
              value={form.platformName}
              onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
              placeholder="e.g. Alinma Investment"
            />
          </label>
          <label className={labelClass}>
            {t("accounts.accountName")}
            <input
              required
              className={inputClass}
              value={form.accountName}
              onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
              placeholder="e.g. Growth Portfolio"
            />
          </label>
          <label className={labelClass}>
            {t("accounts.currency")}
            <select className={inputClass} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as Currency }))}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {t("accounts.riskScore")} ({t("holdings.riskLevel")})
            <select className={inputClass} value={form.riskLevel} onChange={(e) => setForm((f) => ({ ...f, riskLevel: e.target.value as RiskLevel }))}>
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>{t(`riskLevel.${r}`)}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {t("accounts.totalValue")}
            <input
              required
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={form.totalValue}
              onChange={(e) => setForm((f) => ({ ...f, totalValue: Number(e.target.value) }))}
            />
          </label>
          <label className={labelClass}>
            {t("accounts.costBasis")}
            <input
              required
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={form.costBasis}
              onChange={(e) => setForm((f) => ({ ...f, costBasis: Number(e.target.value) }))}
            />
          </label>
          <label className={labelClass}>
            {t("accounts.cashBalance")}
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={form.cashBalance}
              onChange={(e) => setForm((f) => ({ ...f, cashBalance: Number(e.target.value) }))}
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-2">
            {t("common.cancel")}
          </button>
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90">
            {t("common.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
