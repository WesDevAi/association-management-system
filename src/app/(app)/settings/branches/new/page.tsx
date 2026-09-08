import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { CreateBranchForm } from "../create-branch-form";

export default async function CreateBranchPage() {
  await requirePermission(PERMISSIONS.BRANCHES_MANAGE);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Branch</h1>
        <p className="text-sm text-muted-foreground">
          Create a new branch or regional office for the association.
        </p>
      </div>

      <CreateBranchForm />
    </div>
  );
}
