import { formatCurrency, formatPercent, type Locale } from "@/lib/format";
import type { ExpenseCategoryBreakdown } from "@/lib/finance";

export function BreakdownBars({ items, locale }: { items: ExpenseCategoryBreakdown[]; locale: Locale }) {
  const max = Math.max(...items.map((i) => i.total), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.categoryId}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-navy-700">{locale === "ar" ? item.nameAr : item.nameEn}</span>
            <span className="tabular-nums-ltr text-navy-500">
              {formatCurrency(item.total, locale, { decimals: 0 })} · {formatPercent(item.share, locale)}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream-200">
            <div
              className={item.type === "DIRECT" ? "h-full rounded-full bg-accent-500" : "h-full rounded-full bg-navy-600"}
              style={{ width: `${(item.total / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
