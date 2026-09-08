"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ChevronDown, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import type { ExpenseListItem, ExpenseCategoryListItem } from "@/server/services/expense-service";
import { expensesToCsv, downloadCsv } from "@/lib/csv-export";

interface ExpensesTableProps {
  expenses: ExpenseListItem[];
  categories: ExpenseCategoryListItem[];
  total: number;
  page: number;
  totalPages: number;
}

const METHOD_OPTIONS = ["ALL", "CASH", "BANK_TRANSFER", "CARD", "USSD", "OTHER"] as const;

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  USSD: "USSD",
  OTHER: "Other",
};

export function ExpensesTable({ expenses, categories, total, page, totalPages }: ExpensesTableProps) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        !search ||
        e.reference.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.payeeVendor.toLowerCase().includes(search.toLowerCase()) ||
        e.categoryName.toLowerCase().includes(search.toLowerCase());
      const matchesMethod = methodFilter === "ALL" || e.paymentMethod === methodFilter;
      const matchesCategory = categoryFilter === "ALL" || e.categoryName === categoryFilter;
      return matchesSearch && matchesMethod && matchesCategory;
    });
  }, [expenses, search, methodFilter, categoryFilter]);

  function buildUrl(params: Record<string, string>) {
    const sp = new URLSearchParams();
    if (params.search) sp.set("search", params.search);
    if (params.category && params.category !== "ALL") sp.set("category", params.category);
    if (params.method && params.method !== "ALL") sp.set("method", params.method);
    if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
    if (params.dateTo) sp.set("dateTo", params.dateTo);
    if (params.page && params.page !== "1") sp.set("page", params.page);
    const qs = sp.toString();
    return `/finance/expenses${qs ? `?${qs}` : ""}`;
  }

  function handleExport() {
    const csv = expensesToCsv(
      filtered.map((e) => ({
        ...e,
        date: e.date,
      }))
    );
    downloadCsv(`expenses-${format(new Date(), "yyyy-MM-dd")}.csv`, csv);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Filter className="size-4" />
            Filters
            <ChevronDown
              className={cn(
                "size-3 transition-transform",
                showFilters ? "rotate-180" : ""
              )}
            />
          </button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Category:</span>
            <div className="flex gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setCategoryFilter("ALL")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  categoryFilter === "ALL"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.name)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    categoryFilter === c.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Method:</span>
            <div className="flex gap-1">
              {METHOD_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethodFilter(m)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    methodFilter === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {m === "ALL" ? "All" : methodLabels[m] ?? m}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">From:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-7 w-36 text-xs"
            />
            <span className="text-xs font-medium text-muted-foreground">To:</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-7 w-36 text-xs"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Reference</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Method</th>
              <th className="px-4 py-3 text-left font-medium">Payee</th>
              <th className="px-4 py-3 text-left font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((expense) => (
              <tr
                key={expense.id}
                className="border-b border-border/50 last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/finance/expenses/${expense.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {expense.reference}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(expense.date, "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 max-w-[200px] truncate">
                  {expense.description}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {expense.categoryName}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">
                    ₦{Number(expense.amount).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {methodLabels[expense.paymentMethod] ?? expense.paymentMethod}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {expense.payeeVendor}
                </td>
                <td className="px-4 py-3">
                  {expense.hasReceipt ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                      Yes
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            {expenses.length === 0
              ? "No expenses recorded yet."
              : "No expenses match your filters."}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {total} expense(s) · Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link href={buildUrl({ search, category: categoryFilter, method: methodFilter, dateFrom, dateTo, page: String(page - 1) })}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="size-4" />
              </Button>
            </Link>
          )}
          {page < totalPages && (
            <Link href={buildUrl({ search, category: categoryFilter, method: methodFilter, dateFrom, dateTo, page: String(page + 1) })}>
              <Button variant="outline" size="sm">
                <ChevronRight className="size-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
