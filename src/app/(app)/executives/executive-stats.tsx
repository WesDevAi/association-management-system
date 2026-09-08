import { Shield, Users, UserCheck, UserX, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/app-shell/stat-card";
import type { ExecutiveStats } from "@/server/services/executive-service";

interface ExecutiveStatsCardsProps {
  stats: ExecutiveStats;
}

export function ExecutiveStatsCards({ stats }: ExecutiveStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Total Positions"
        value={stats.totalPositions}
        icon={Shield}
        emptyHint={stats.totalPositions === 0 ? "No positions defined" : undefined}
      />
      <StatCard
        label="Active Positions"
        value={stats.activePositions}
        icon={UserCheck}
        emptyHint={stats.activePositions === 0 ? "None active" : undefined}
      />
      <StatCard
        label="Filled"
        value={stats.filledPositions}
        icon={Users}
        emptyHint={stats.filledPositions === 0 ? "None filled" : undefined}
      />
      <StatCard
        label="Vacant"
        value={stats.vacantPositions}
        icon={UserX}
        emptyHint={stats.vacantPositions === 0 ? "All filled" : undefined}
      />
      <StatCard
        label="Active Executives"
        value={stats.activeExecutives}
        icon={Users}
        emptyHint={stats.activeExecutives === 0 ? "No executives" : undefined}
      />
      <StatCard
        label="Ending Soon"
        value={stats.expiringSoon}
        icon={AlertTriangle}
        emptyHint={stats.expiringSoon === 0 ? "None expiring" : undefined}
      />
    </div>
  );
}
