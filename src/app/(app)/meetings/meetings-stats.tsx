import { CalendarDays, Clock, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { StatCard } from "@/components/app-shell/stat-card";
import type { MeetingStats } from "@/server/services/meeting-service";

interface MeetingsStatsProps {
  stats: MeetingStats;
}

export function MeetingsStats({ stats }: MeetingsStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Total Meetings"
        value={stats.total}
        icon={CalendarDays}
        emptyHint={stats.total === 0 ? "No meetings yet" : undefined}
      />
      <StatCard
        label="Scheduled"
        value={stats.scheduled}
        icon={Clock}
        emptyHint={stats.scheduled === 0 ? "None scheduled" : undefined}
      />
      <StatCard
        label="Ongoing"
        value={stats.ongoing}
        icon={CheckCircle2}
        emptyHint={stats.ongoing === 0 ? "None in progress" : undefined}
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        icon={CheckCircle2}
        emptyHint={stats.completed === 0 ? "None completed" : undefined}
      />
      <StatCard
        label="Cancelled"
        value={stats.cancelled}
        icon={XCircle}
        emptyHint={stats.cancelled === 0 ? "None cancelled" : undefined}
      />
      <StatCard
        label="Avg. Attendance"
        value={stats.completed > 0 ? `${stats.averageAttendanceRate}%` : "—"}
        icon={BarChart3}
        emptyHint={stats.completed === 0 ? "No completed meetings" : undefined}
      />
    </div>
  );
}
