"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/primitives";

export interface ReportData {
  periodLabel: string;
  sales: { label: string; current: string; previous: string; change: string }[];
  expenses: { category: string; type: string; amount: string; share: string }[];
  profitability: { label: string; value: string }[];
  kri: { indicator: string; current: string; previous: string; risk: string }[];
}

export function ReportExport({ data }: { data: ReportData }) {
  const t = useTranslations("reports");
  const locale = useLocale();

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.sales), "Sales");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.expenses), "Expenses");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.profitability), "Profitability");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.kri), "KRI");
    XLSX.writeFile(wb, `1R-Studio-Report-${data.periodLabel}.xlsx`);
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("1R. Studio — Business Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Period: ${data.periodLabel}`, 14, 23);

    let y = 30;
    const section = (title: string, head: string[], rows: string[][]) => {
      doc.setFontSize(12);
      doc.text(title, 14, y);
      autoTable(doc, { startY: y + 3, head: [head], body: rows, styles: { fontSize: 8 }, headStyles: { fillColor: [10, 37, 64] } });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      if (y > 260) { doc.addPage(); y = 20; }
    };

    section("Sales", ["Metric", "Current", "Previous", "Change"], data.sales.map((r) => [r.label, r.current, r.previous, r.change]));
    section("Expenses", ["Category", "Type", "Amount", "Share"], data.expenses.map((r) => [r.category, r.type, r.amount, r.share]));
    section("Profitability", ["Metric", "Value"], data.profitability.map((r) => [r.label, r.value]));
    section("KRI", ["Indicator", "Current", "Previous", "Risk"], data.kri.map((r) => [r.indicator, r.current, r.previous, r.risk]));

    doc.save(`1R-Studio-Report-${data.periodLabel}.pdf`);
  }

  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={exportExcel}>{t("downloadExcel")}</Button>
      <Button variant="primary" onClick={exportPdf}>{t("downloadPdf")}</Button>
      <span className="sr-only">{locale}</span>
    </div>
  );
}
