import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getExecutivePositions } from "@/server/services/executive-service";
import { PositionsTable } from "./positions-table";
import { CreatePositionForm } from "./create-position-form";

export default async function PositionsPage() {
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const positions = await getExecutivePositions(associationId, { includeInactive: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Executive Positions</h1>
        <p className="text-sm text-muted-foreground">
          Define and manage executive positions for the association.
        </p>
      </div>

      <CreatePositionForm associationId={associationId} />

      <PositionsTable positions={positions} associationId={associationId} />
    </div>
  );
}
