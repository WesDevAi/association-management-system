"use server";

import {
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema,
} from "@/server/validation/role";
import {
  createRole,
  updateRole,
  deleteRole,
} from "@/server/services/role-service";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { logAudit } from "@/server/services/audit-service";

export type RoleActionState = { error: string } | { success: string } | null;

// ---------------------------------------------------------------------------
// Role CRUD actions
// ---------------------------------------------------------------------------

export async function createRoleAction(
  _prevState: RoleActionState,
  formData: FormData
): Promise<RoleActionState> {
  const context = await requirePermission(PERMISSIONS.ROLES_MANAGE);
  const associationId = context.membership.associationId;

  const permissionIdsRaw = formData.getAll("permissionIds");
  const permissionIds = permissionIdsRaw
    .map((v) => (typeof v === "string" ? v : ""))
    .filter((v) => v.length > 0);

  const parsed = createRoleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    permissionIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createRole(associationId, {
    name: parsed.data.name,
    description: parsed.data.description || null,
    permissionIds: parsed.data.permissionIds,
  });

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "role.created",
    entityType: "role",
    entityId: result as string,
    metadata: { entityName: parsed.data.name },
  });

  return { success: "Role created." };
}

export async function updateRoleAction(
  _prevState: RoleActionState,
  formData: FormData
): Promise<RoleActionState> {
  const context = await requirePermission(PERMISSIONS.ROLES_MANAGE);
  const associationId = context.membership.associationId;

  const permissionIdsRaw = formData.getAll("permissionIds");
  const permissionIds = permissionIdsRaw
    .map((v) => (typeof v === "string" ? v : ""))
    .filter((v) => v.length > 0);

  const parsed = updateRoleSchema.safeParse({
    roleId: formData.get("roleId"),
    name: formData.get("name"),
    description: formData.get("description"),
    permissionIds,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateRole(associationId, parsed.data.roleId, {
    name: parsed.data.name,
    description: parsed.data.description,
    permissionIds: parsed.data.permissionIds,
  });

  if (!result) {
    return { error: "Role not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "role.updated",
    entityType: "role",
    entityId: parsed.data.roleId,
    metadata: { entityName: parsed.data.name },
  });

  return { success: "Role updated." };
}

export async function deleteRoleAction(
  _prevState: RoleActionState,
  formData: FormData
): Promise<RoleActionState> {
  const context = await requirePermission(PERMISSIONS.ROLES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = deleteRoleSchema.safeParse({
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await deleteRole(associationId, parsed.data.roleId);

  if (!result) {
    return { error: "Role not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "role.deleted",
    entityType: "role",
    entityId: parsed.data.roleId,
  });

  return { success: "Role deleted." };
}
