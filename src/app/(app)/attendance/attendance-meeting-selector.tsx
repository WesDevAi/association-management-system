"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";

type AttendanceMeetingSelectorProps = {
  meetings: { id: string; title: string; meetingNumber: string | null; scheduledAt: Date; status: string }[];
  selectedMeetingId?: string;
};

export function AttendanceMeetingSelector({
  meetings,
  selectedMeetingId,
}: AttendanceMeetingSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("meetingId", value);
    } else {
      params.delete("meetingId");
    }
    router.push(`/attendance?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="meeting-select"
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
      >
        <CalendarDays className="size-4" />
        Select meeting:
      </label>
      <select
        id="meeting-select"
        value={selectedMeetingId ?? ""}
        onChange={handleChange}
        className="flex h-9 max-w-sm flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">Choose a meeting...</option>
        {meetings.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
            {m.meetingNumber ? ` (${m.meetingNumber})` : ""} —{" "}
            {new Date(m.scheduledAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {" "}
            <span className="text-muted-foreground">[{m.status}]</span>
          </option>
        ))}
      </select>
    </div>
  );
}
