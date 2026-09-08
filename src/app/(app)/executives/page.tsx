import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import {
  getCurrentExecutives,
  getExecutiveStats,
  getVacantPositions,
} from "@/server/services/executive-service";
import { ExecutiveStatsCards } from "./executive-stats";
import { CurrentExecutiveGrid } from "./current-executive-grid";
import { VacantPositionsCard } from "./vacant-positions-card";

export default async function ExecutivesPage() {
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const [currentExecutives, stats, vacantPositions] = await Promise.all([
    getCurrentExecutives(associationId),
    getExecutiveStats(associationId),
    getVacantPositions(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Current Executive</h1>
        <p className="text-sm text-muted-foreground">
          View the current executive leadership of the association.
        </p>
      </div>

      <ExecutiveStatsCards stats={stats} />

      <CurrentExecutiveGrid executives={currentExecutives} />

      {vacantPositions.length > 0 && (
        <VacantPositionsCard positions={vacantPositions} />
      )}
    </div>
  );
}
