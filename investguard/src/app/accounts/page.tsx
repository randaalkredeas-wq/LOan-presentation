"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { AccountsTable } from "@/components/AccountsTable";
import { AccountFormModal, AccountFormValue } from "@/components/AccountFormModal";
import { Modal } from "@/components/ui/Modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Badge, riskLevelTone } from "@/components/ui/Badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePortfolioAnalytics } from "@/hooks/usePortfolioAnalytics";
import { portfolioService } from "@/services";
import { formatCurrency, formatDate, formatPercent } from "@/utils/formatters";
import { Wallet } from "lucide-react";

export default function AccountsPage() {
  const { t, language } = useLanguage();
  const data = usePortfolioAnalytics();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;

  const editing = editingId ? data.accountSummaries.find((r) => r.account.id === editingId) : undefined;
  const viewing = viewingId ? data.accountSummaries.find((r) => r.account.id === viewingId) : undefined;

  const handleSubmit = async (value: AccountFormValue) => {
    if (editingId) {
      await portfolioService.updateAccount(editingId, {
        name: value.accountName,
        currency: value.currency,
        totalValue: value.totalValue,
        costBasis: value.costBasis,
        cashBalance: value.cashBalance,
        riskLevel: value.riskLevel,
      });
    } else {
      await portfolioService.addAccount(
        {
          platformId: "",
          name: value.accountName,
          currency: value.currency,
          totalValue: value.totalValue,
          costBasis: value.costBasis,
          cashBalance: value.cashBalance,
          openedDate: new Date().toISOString().slice(0, 10),
          riskScore: value.riskLevel === "Low" ? 25 : value.riskLevel === "Medium" ? 50 : value.riskLevel === "High" ? 75 : 92,
          riskLevel: value.riskLevel,
        },
        { name: value.platformName, type: "Brokerage", country: "Other" }
      );
    }
    setModalOpen(false);
    setEditingId(null);
    data.reload();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t("common.confirmDelete"))) {
      await portfolioService.deleteAccount(id);
      data.reload();
    }
  };

  const toggleCompare = (id: string) => {
    setSelectedCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev));
  };

  const compareRows = data.accountSummaries.filter((r) => selectedCompare.includes(r.account.id));

  return (
    <div>
      <PageHeader
        title={t("accounts.title")}
        subtitle={t("accounts.subtitle")}
        actions={
          <>
            <button
              onClick={() => setCompareMode((v) => !v)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${compareMode ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {t("accounts.compareAccounts")}
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {t("accounts.addAccount")}
            </button>
          </>
        }
      />

      {compareMode && selectedCompare.length > 0 && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>{t("accounts.compareAccounts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {compareRows.map((r) => (
                <div key={r.account.id} className="relative rounded-xl border border-border p-4">
                  <button onClick={() => toggleCompare(r.account.id)} className="absolute end-2 top-2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <p className="text-sm font-semibold text-foreground">{r.platform.name}</p>
                  <p className="mt-2 text-lg font-bold tabular-nums text-foreground">{formatCurrency(r.valueBase, data.settings.baseCurrency, language)}</p>
                  <p className={`mt-1 text-xs font-medium tabular-nums ${r.returnPct >= 0 ? "text-positive" : "text-negative"}`}>
                    {formatPercent(r.returnPct, language)}
                  </p>
                  <Badge tone={riskLevelTone(r.account.riskLevel)} className="mt-2">
                    {t(`riskLevel.${r.account.riskLevel}`)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {data.loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : data.accountSummaries.length === 0 ? (
            <EmptyState
              title={t("accounts.noAccounts")}
              description={t("accounts.addFirstAccount")}
              icon={<Wallet className="h-5 w-5" />}
              action={
                <button onClick={() => setModalOpen(true)} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
                  {t("accounts.addAccount")}
                </button>
              }
            />
          ) : compareMode ? (
            <div className="space-y-2">
              {data.accountSummaries.map((r) => (
                <label key={r.account.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-surface-2/60">
                  <input
                    type="checkbox"
                    checked={selectedCompare.includes(r.account.id)}
                    onChange={() => toggleCompare(r.account.id)}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="text-sm font-medium text-foreground">{r.platform.name}</span>
                  <span className="ms-auto tabular-nums text-sm font-semibold text-foreground">{formatCurrency(r.valueBase, data.settings.baseCurrency, language)}</span>
                </label>
              ))}
            </div>
          ) : (
            <AccountsTable
              rows={data.accountSummaries}
              baseCurrency={data.settings.baseCurrency}
              onView={setViewingId}
              onEdit={(id) => {
                setEditingId(id);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      <AccountFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        onSubmit={handleSubmit}
        initial={editing ? { account: editing.account, platform: editing.platform } : undefined}
      />

      <Modal open={!!viewing} onClose={() => setViewingId(null)} title={viewing?.platform.name ?? ""}>
        {viewing && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("accounts.accountName")}</p>
                <p className="font-medium text-foreground">{viewing.account.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("accounts.currency")}</p>
                <p className="font-medium text-foreground">{viewing.account.currency}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("accounts.totalValue")}</p>
                <p className="font-medium tabular-nums text-foreground">{formatCurrency(viewing.valueBase, data.settings.baseCurrency, language)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("accounts.costBasis")}</p>
                <p className="font-medium tabular-nums text-foreground">{formatCurrency(viewing.costBasisBase, data.settings.baseCurrency, language)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("accounts.pnl")}</p>
                <p className={`font-medium tabular-nums ${viewing.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                  {formatCurrency(viewing.pnl, data.settings.baseCurrency, language, { signed: true })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("accounts.return")}</p>
                <p className={`font-medium tabular-nums ${viewing.returnPct >= 0 ? "text-positive" : "text-negative"}`}>{formatPercent(viewing.returnPct, language)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("accounts.openedDate")}</p>
                <p className="font-medium text-foreground">{formatDate(viewing.account.openedDate, language)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("accounts.riskScore")}</p>
                <Badge tone={riskLevelTone(viewing.account.riskLevel)}>{t(`riskLevel.${viewing.account.riskLevel}`)} · {viewing.account.riskScore}</Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
