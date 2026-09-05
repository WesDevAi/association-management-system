import { Users, UserCheck, UserX, UserMinus } from "lucide-react";
import { StatCard } from "@/components/app-shell/stat-card";
import type { MemberStats } from "@/server/services/member-service";

interface MembersStatsProps {
  stats: MemberStats;
}

export function MembersStats({ stats }: MembersStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Members" value={stats.total} icon={Users} />
      <StatCard label="Active" value={stats.active} icon={UserCheck} />
      <StatCard label="Pending" value={stats.pending} icon={UserMinus} />
      <StatCard label="Inactive" value={stats.inactive} icon={UserX} />
    </div>
  );
}
