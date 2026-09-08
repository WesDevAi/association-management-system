"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { arrayToCsv, downloadCsv } from "@/lib/csv-export";

interface FinanceReportExportProps {
  title: string;
  filename: string;
  rows: { label: string; income: string; expenses: string; net: string }[];
}

export function FinanceReportExport({ title, filename, rows }: FinanceReportExportProps) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(() => {
      const headers = [title, "Income", "Expenses", "Net"];
      const dataRows = rows.map((r) => [r.label, r.income, r.expenses, r.net]);
      const csv = arrayToCsv(headers, dataRows);
      downloadCsv(`${filename}-${new Date().toISOString().split("T")[0]}.csv`, csv);
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
      <Download className="mr-2 size-4" />
      Export CSV
    </Button>
  );
}
