import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getFines } from "@/server/services/finance-service";
import { getMembers } from "@/server/services/member-service";
import { FinesTable } from "./fines-table";
import { IssueFineForm } from "./issue-fine-form";

export default async function FinesPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const context = await requirePermission(PERMISSIONS.FINANCE_VIEW);
  const associationId = context.membership.associationId;

  const [fines, members] = await Promise.all([
    getFines(associationId, {
      status: searchParams?.status,
    }),
    getMembers(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fines</h1>
        <p className="text-sm text-muted-foreground">
          Issue, track, and manage member fines.
        </p>
      </div>

      <IssueFineForm members={members} />

      <FinesTable fines={fines} />
    </div>
  );
}
