"use client";

import { useTransition, useState, useMemo } from "react";
import { Search, BadgeCheck, X, Clock, Ban, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { recordBulkAttendanceAction } from "@/server/services/meeting-actions";

interface MemberAttendance {
  membershipId: string;
  fullName: string;
  membershipNumber: string;
  email: string | null;
  roleName: string;
  attendanceStatus: string | null;
  remarks: string | null;
}

interface MeetingAttendeesProps {
  members: MemberAttendance[];
  associationId: string;
  meetingId: string;
}

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present", icon: BadgeCheck, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
  { value: "ABSENT", label: "Absent", icon: X, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
  { value: "EXCUSED", label: "Excused", icon: Ban, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" },
  { value: "LATE", label: "Late", icon: Clock, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
];

function getStatusColor(status: string | null): string {
  if (!status) return "bg-muted text-muted-foreground";
  const opt = STATUS_OPTIONS.find((o) => o.value === status);
  return opt?.color ?? "bg-muted text-muted-foreground";
}

export function MeetingAttendees({ members, associationId, meetingId }: MeetingAttendeesProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const m of members) {
      if (m.attendanceStatus) {
        init[m.membershipId] = m.attendanceStatus;
      }
    }
    return init;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.membershipNumber.toLowerCase().includes(q) ||
        (m.email?.toLowerCase().includes(q) ?? false)
    );
  }, [members, search]);

  function handleStatusChange(membershipId: string, status: string) {
    setLocalStatuses((prev) => {
      const next = { ...prev };
      if (next[membershipId] === status) {
        delete next[membershipId];
      } else {
        next[membershipId] = status;
      }
      return next;
    });
    setHasChanges(true);
    setSuccess(null);
    setError(null);
  }

  function handleMarkAll(status: string) {
    const updates: Record<string, string> = {};
    for (const m of filtered) {
      updates[m.membershipId] = status;
    }
    setLocalStatuses((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
    setSuccess(null);
    setError(null);
  }

  function handleSave() {
    setSuccess(null);
    setError(null);

    const attendance = Object.entries(localStatuses).map(([membershipId, status]) => ({
      membershipId,
      status,
      remarks: undefined as string | undefined,
    }));

    if (attendance.length === 0) {
      setError("No attendance entries to save.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("meetingId", meetingId);
      formData.set("associationId", associationId);
      formData.set("attendance", JSON.stringify(attendance));

      const result = await recordBulkAttendanceAction(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        setHasChanges(false);
      }
    });
  }

  const markedCount = Object.keys(localStatuses).length;

  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Attendance</h3>
          <span className="text-xs text-muted-foreground">
            {markedCount} of {members.length} marked
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("PRESENT")}
            disabled={isPending}
          >
            All Present
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("ABSENT")}
            disabled={isPending}
          >
            All Absent
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending || !hasChanges}
          >
            <Save className="mr-1 size-3" />
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="border-b border-border px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
      </div>

      {success && (
        <div className="border-b border-border bg-green-50 px-4 py-2 dark:bg-green-950">
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}
      {error && (
        <div className="border-b border-border bg-red-50 px-4 py-2 dark:bg-red-950">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Member</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((member) => {
              const currentStatus = localStatuses[member.membershipId] ?? member.attendanceStatus;
              return (
                <tr
                  key={member.membershipId}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground">{member.membershipNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {member.roleName}
                  </td>
                  <td className="px-4 py-3">
                    {currentStatus && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          getStatusColor(currentStatus)
                        )}
                      >
                        {currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase()}
                      </span>
                    )}
                    {!currentStatus && (
                      <span className="text-xs text-muted-foreground">Not marked</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {STATUS_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = currentStatus === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleStatusChange(member.membershipId, opt.value)}
                            disabled={isPending}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                            title={`Mark as ${opt.label}`}
                          >
                            <Icon className="size-3" />
                            <span className="hidden sm:inline">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          {members.length === 0
            ? "No active members in this association."
            : "No members match your search."}
        </div>
      )}
    </div>
  );
}
