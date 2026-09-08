"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { waiveFineAction, cancelFineAction } from "@/server/services/finance-actions";
import type { FineListItem } from "@/server/services/finance-service";

interface FinesTableProps {
  fines: FineListItem[];
}

const STATUS_OPTIONS = ["ALL", "PENDING", "PARTIALLY_PAID", "PAID", "WAIVED", "CANCELLED"] as const;

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  PARTIALLY_PAID: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  WAIVED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

export function FinesTable({ fines }: FinesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return fines.filter((f) => {
      const matchesSearch =
        !search ||
        f.memberName.toLowerCase().includes(search.toLowerCase()) ||
        f.membershipNumber.toLowerCase().includes(search.toLowerCase()) ||
        f.reason.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [fines, search, statusFilter]);

  function handleWaive(fineId: string) {
    const reason = window.prompt("Enter reason for waiving this fine:");
    if (!reason) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("fineId", fineId);
      formData.set("waivedReason", reason);
      await waiveFineAction(null, formData);
      window.location.reload();
    });
  }

  function handleCancel(fineId: string) {
    if (!window.confirm("Are you sure you want to cancel this fine?")) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("fineId", fineId);
      await cancelFineAction(formData);
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search fines..."
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
                  {s === "ALL"
                    ? "All"
                    : s.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
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
              <th className="px-4 py-3 text-left font-medium">Reason</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-right font-medium">Paid</th>
              <th className="px-4 py-3 text-right font-medium">Outstanding</th>
              <th className="px-4 py-3 text-left font-medium">Issued</th>
              <th className="px-4 py-3 text-left font-medium">Due</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((fine) => (
              <tr
                key={fine.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{fine.memberName}</div>
                  <div className="text-xs text-muted-foreground">
                    {fine.membershipNumber}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-[200px] truncate text-muted-foreground">
                    {fine.reason}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  ₦{Number(fine.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  ₦{Number(fine.paidAmount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      Number(fine.outstandingAmount) > 0
                        ? "font-medium text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }
                  >
                    ₦{Number(fine.outstandingAmount).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(fine.issuedAt, "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {fine.dueDate ? format(fine.dueDate, "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusColors[fine.status] ?? "bg-gray-100 text-gray-800"
                    )}
                  >
                    {fine.status.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {(fine.status === "PENDING" || fine.status === "PARTIALLY_PAID") && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleWaive(fine.id)}
                          disabled={isPending}
                          title="Waive fine"
                        >
                          <span className="text-xs">W</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancel(fine.id)}
                          disabled={isPending}
                          title="Cancel fine"
                        >
                          <span className="text-xs">C</span>
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            {fines.length === 0
              ? "No fines issued yet."
              : "No fines match your filters."}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {fines.length} fine(s)
      </p>
    </div>
  );
}
