import { notFound } from "next/navigation";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getRoleDetail, getPermissionCatalog } from "@/server/services/role-service";
import { EditRoleForm } from "./edit-role-form";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission(PERMISSIONS.ROLES_MANAGE);
  const associationId = context.membership.associationId;

  const [role, permissions] = await Promise.all([
    getRoleDetail(associationId, id),
    getPermissionCatalog(),
  ]);

  if (!role) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Role</h1>
        <p className="text-sm text-muted-foreground">
          Update role details and permission assignments.
        </p>
      </div>

      <EditRoleForm role={role} permissions={permissions} />
    </div>
  );
}
