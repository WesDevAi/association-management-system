import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getAppointmentHistory } from "@/server/services/executive-service";
import { HistoryTable } from "./history-table";

export default async function ExecutiveHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; positionId?: string; type?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const history = await getAppointmentHistory(associationId, {
    status: resolvedSearchParams?.status as "ACTIVE" | "COMPLETED" | "REMOVED" | "RESIGNED" | "SUSPENDED" | undefined,
    positionId: resolvedSearchParams?.positionId,
    appointmentType: resolvedSearchParams?.type as "ELECTED" | "APPOINTED" | "ACTING" | "INTERIM" | undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appointment History</h1>
        <p className="text-sm text-muted-foreground">
          View all historical and current executive appointments.
        </p>
      </div>

      <HistoryTable
        appointments={history}
      />
    </div>
  );
}
