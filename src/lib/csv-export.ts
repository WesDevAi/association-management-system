/**
 * CSV export utilities for financial data.
 * All exports use real database data and respect tenant isolation.
 */

export function escapeCsvField(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function arrayToCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type ExportableExpense = {
  reference: string;
  date: Date;
  description: string;
  categoryName: string;
  amount: string;
  paymentMethod: string;
  payeeVendor: string;
  referenceNumber: string | null;
  notes: string | null;
  recordedByName: string | null;
};

export function expensesToCsv(expenses: ExportableExpense[]): string {
  const headers = [
    "Reference",
    "Date",
    "Description",
    "Category",
    "Amount",
    "Payment Method",
    "Payee/Vendor",
    "Reference Number",
    "Notes",
    "Recorded By",
  ];

  const rows = expenses.map((e) => [
    e.reference,
    e.date instanceof Date ? e.date.toISOString().split("T")[0] : String(e.date),
    e.description,
    e.categoryName,
    e.amount,
    e.paymentMethod.replace("_", " "),
    e.payeeVendor,
    e.referenceNumber ?? "",
    e.notes ?? "",
    e.recordedByName ?? "",
  ]);

  return arrayToCsv(headers, rows);
}

export type ExportablePayment = {
  reference: string;
  memberName: string;
  membershipNumber: string;
  categoryName: string;
  amount: string;
  method: string;
  status: string;
  paidAt: Date | null;
  notes: string | null;
};

export function paymentsToCsv(payments: ExportablePayment[]): string {
  const headers = [
    "Reference",
    "Member",
    "Membership #",
    "Category",
    "Amount",
    "Method",
    "Status",
    "Paid Date",
    "Notes",
  ];

  const rows = payments.map((p) => [
    p.reference,
    p.memberName,
    p.membershipNumber,
    p.categoryName,
    p.amount,
    p.method.replace("_", " "),
    p.status,
    p.paidAt ? p.paidAt.toISOString().split("T")[0] : "",
    p.notes ?? "",
  ]);

  return arrayToCsv(headers, rows);
}

export type ExportableReportRow = {
  label: string;
  income: string;
  expenses: string;
  net: string;
};

export function reportToCsv(title: string, rows: ExportableReportRow[]): string {
  const headers = [title, "Income", "Expenses", "Net"];
  const dataRows = rows.map((r) => [r.label, r.income, r.expenses, r.net]);
  return arrayToCsv(headers, dataRows);
}
