"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ChevronDown, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { MeetingListItem } from "@/server/services/meeting-service";

interface MeetingsTableProps {
  meetings: MeetingListItem[];
  associationId: string;
}

const STATUS_OPTIONS = ["ALL", "SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"] as const;
const TYPE_OPTIONS = ["ALL", "GENERAL", "EXECUTIVE", "BRANCH", "COMMITTEE", "EMERGENCY"] as const;

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  ONGOING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const typeLabels: Record<string, string> = {
  GENERAL: "General",
  EXECUTIVE: "Executive",
  BRANCH: "Branch",
  COMMITTEE: "Committee",
  EMERGENCY: "Emergency",
};

export function MeetingsTable({ meetings }: MeetingsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      const matchesSearch =
        !search ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.meetingNumber?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (m.location?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
      const matchesType = typeFilter === "ALL" || m.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [meetings, search, statusFilter, typeFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
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
          <ChevronDown className={`size-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
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
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
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
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    typeFilter === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {t === "ALL" ? "All" : typeLabels[t] ?? t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Meeting</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Date & Time</th>
                <th className="px-4 py-3 text-left font-medium">Location</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((meeting) => (
                <tr
                  key={meeting.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      {meeting.meetingNumber && (
                        <p className="text-xs text-muted-foreground">{meeting.meetingNumber}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeLabels[meeting.type] ?? meeting.type}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {new Date(meeting.scheduledAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      <span className="text-xs">
                        {new Date(meeting.scheduledAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">
                    {meeting.location ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[meeting.status] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {meeting.status.charAt(0) + meeting.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`/meetings/${meeting.id}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <CalendarDays className="size-8 text-muted-foreground/50" />
            {meetings.length === 0
              ? "No meetings scheduled yet."
              : "No meetings match your filters."}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {meetings.length} meeting(s)
      </p>
    </div>
  );
}
