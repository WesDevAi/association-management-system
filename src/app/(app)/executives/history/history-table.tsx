"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ExecutiveAppointmentListItem } from "@/server/services/executive-service";

interface HistoryTableProps {
  appointments: ExecutiveAppointmentListItem[];
}

const STATUS_OPTIONS = ["ALL", "ACTIVE", "COMPLETED", "REMOVED", "RESIGNED", "SUSPENDED"] as const;
const TYPE_OPTIONS = ["ALL", "ELECTED", "APPOINTED", "ACTING", "INTERIM"] as const;

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  REMOVED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  RESIGNED: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  SUSPENDED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

const typeLabels: Record<string, string> = {
  ELECTED: "Elected",
  APPOINTED: "Appointed",
  ACTING: "Acting",
  INTERIM: "Interim",
};

export function HistoryTable({ appointments }: HistoryTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchesSearch =
        !search ||
        a.memberName.toLowerCase().includes(search.toLowerCase()) ||
        a.positionTitle.toLowerCase().includes(search.toLowerCase()) ||
        a.membershipNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
      const matchesType = typeFilter === "ALL" || a.appointmentType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [appointments, search, statusFilter, typeFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
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
            <span className="text-xs font-medium text-muted-foreground">Type:</span>
            <div className="flex gap-1">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    typeFilter === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t === "ALL" ? "All" : typeLabels[t] ?? t}
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
              <th className="px-4 py-3 text-left font-medium">Position</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Start Date</th>
              <th className="px-4 py-3 text-left font-medium">End Date</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((appt) => (
              <tr
                key={appt.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{appt.memberName}</div>
                  <div className="text-xs text-muted-foreground">
                    {appt.membershipNumber}
                  </div>
                </td>
                <td className="px-4 py-3">{appt.positionTitle}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {typeLabels[appt.appointmentType] ?? appt.appointmentType}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(appt.startDate, "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {appt.endDate ? format(appt.endDate, "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusColors[appt.status] ?? "bg-gray-100 text-gray-800"
                    )}
                  >
                    {appt.status.charAt(0) + appt.status.slice(1).toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            {appointments.length === 0
              ? "No appointment history yet."
              : "No appointments match your filters."}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {appointments.length} appointment(s)
      </p>
    </div>
  );
}
