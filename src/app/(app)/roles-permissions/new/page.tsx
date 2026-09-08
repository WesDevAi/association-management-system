import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getPermissionCatalog } from "@/server/services/role-service";
import { CreateRoleForm } from "../create-role-form";

export default async function CreateRolePage() {
  await requirePermission(PERMISSIONS.ROLES_MANAGE);

  const permissions = await getPermissionCatalog();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Role</h1>
        <p className="text-sm text-muted-foreground">
          Create a custom role with specific permissions for this association.
        </p>
      </div>

      <CreateRoleForm permissions={permissions} />
    </div>
  );
}
