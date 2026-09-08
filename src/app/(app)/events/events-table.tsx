"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import type { EventListItem } from "@/server/services/event-service";

interface EventsTableProps {
  events: EventListItem[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_OPTIONS = ["ALL", "DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"] as const;

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
};

export function EventsTable({ events, total, page, totalPages }: EventsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (e.location?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, search, statusFilter]);

  function buildUrl(params: Record<string, string>) {
    const sp = new URLSearchParams();
    if (params.search) sp.set("search", params.search);
    if (params.status && params.status !== "ALL") sp.set("status", params.status);
    if (params.page && params.page !== "1") sp.set("page", params.page);
    const qs = sp.toString();
    return `/events${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
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
            className={cn("size-3 transition-transform", showFilters ? "rotate-180" : "")}
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
        </div>
      )}

      <div className="rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Event</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Location</th>
              <th className="px-4 py-3 text-left font-medium">Registrations</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((event) => (
              <tr
                key={event.id}
                className="border-b border-border/50 last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/events/${event.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {event.title}
                  </Link>
                  {event.isVirtual && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                      Virtual
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(event.startAt, "MMM d, yyyy 'at' h:mm a")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {event.location ?? (event.isVirtual ? "Online" : "—")}
                </td>
                <td className="px-4 py-3">
                  {event.registeredCount}
                  {event.capacity ? ` / ${event.capacity}` : ""}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusColors[event.status] ?? "bg-gray-100 text-gray-800"
                    )}
                  >
                    {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            {events.length === 0 ? "No events yet." : "No events match your filters."}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {total} event(s) · Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          {page > 1 && (
            <Link href={buildUrl({ search, status: statusFilter, page: String(page - 1) })}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="size-4" />
              </Button>
            </Link>
          )}
          {page < totalPages && (
            <Link href={buildUrl({ search, status: statusFilter, page: String(page + 1) })}>
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
