import { notFound } from "next/navigation";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getBranchDetail } from "@/server/services/branch-service";
import { EditBranchForm } from "./edit-branch-form";

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  const associationId = context.membership.associationId;

  const branch = await getBranchDetail(associationId, id);

  if (!branch) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Branch</h1>
        <p className="text-sm text-muted-foreground">
          Update branch details and configuration.
        </p>
      </div>

      <EditBranchForm branch={branch} />
    </div>
  );
}
