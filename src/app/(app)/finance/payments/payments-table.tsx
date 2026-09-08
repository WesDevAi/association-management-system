"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { PaymentListItem } from "@/server/services/finance-service";

interface PaymentsTableProps {
  payments: PaymentListItem[];
}

const STATUS_OPTIONS = ["ALL", "PENDING", "COMPLETED", "FAILED", "REFUNDED"] as const;
const METHOD_OPTIONS = ["ALL", "CASH", "BANK_TRANSFER", "CARD", "USSD", "OTHER"] as const;

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  REFUNDED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
};

const methodLabels: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  USSD: "USSD",
  OTHER: "Other",
};

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        !search ||
        p.memberName.toLowerCase().includes(search.toLowerCase()) ||
        p.membershipNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.reference.toLowerCase().includes(search.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      const matchesMethod = methodFilter === "ALL" || p.method === methodFilter;
      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [payments, search, statusFilter, methodFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <div className="flex gap-1">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
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
        </div>
      )}

      <div className="rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Member</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Method</th>
              <th className="px-4 py-3 text-left font-medium">Reference</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{payment.memberName}</div>
                  <div className="text-xs text-muted-foreground">
                    {payment.membershipNumber}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {payment.categoryName}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">
                    ₦{Number(payment.amount).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {methodLabels[payment.method] ?? payment.method}
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                  {payment.reference}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {payment.paidAt ? format(payment.paidAt, "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusColors[payment.status] ?? "bg-gray-100 text-gray-800"
                    )}
                  >
                    {payment.status.charAt(0) + payment.status.slice(1).toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            {payments.length === 0
              ? "No payments recorded yet."
              : "No payments match your filters."}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {payments.length} payment(s)
      </p>
    </div>
  );
}
