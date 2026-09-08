"use server";

import {
  createBranchSchema,
  updateBranchSchema,
} from "@/server/validation/branch";
import {
  createBranch,
  updateBranch,
  deactivateBranch,
  activateBranch,
} from "@/server/services/branch-service";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { logAudit } from "@/server/services/audit-service";

export type BranchActionState = { error: string } | { success: string } | null;

export async function createBranchAction(
  _prevState: BranchActionState,
  formData: FormData
): Promise<BranchActionState> {
  const context = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = createBranchSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    address: formData.get("address"),
    state: formData.get("state"),
    isHeadquarters: formData.get("isHeadquarters"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createBranch(associationId, {
    name: parsed.data.name,
    code: parsed.data.code,
    address: parsed.data.address || null,
    state: parsed.data.state || null,
    isHeadquarters: parsed.data.isHeadquarters,
    status: parsed.data.status,
  });

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "branch.created",
    entityType: "branch",
    entityId: result as string,
    metadata: { entityName: parsed.data.name },
  });

  return { success: "Branch created." };
}

export async function updateBranchAction(
  _prevState: BranchActionState,
  formData: FormData
): Promise<BranchActionState> {
  const context = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updateBranchSchema.safeParse({
    branchId: formData.get("branchId"),
    name: formData.get("name"),
    code: formData.get("code"),
    address: formData.get("address"),
    state: formData.get("state"),
    isHeadquarters: formData.get("isHeadquarters"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateBranch(associationId, parsed.data.branchId, {
    name: parsed.data.name,
    code: parsed.data.code,
    address: parsed.data.address,
    state: parsed.data.state,
    isHeadquarters: parsed.data.isHeadquarters,
    status: parsed.data.status,
  });

  if (!result) {
    return { error: "Branch not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "branch.updated",
    entityType: "branch",
    entityId: parsed.data.branchId,
    metadata: { entityName: parsed.data.name },
  });

  return { success: "Branch updated." };
}

export async function deactivateBranchAction(
  _prevState: BranchActionState,
  formData: FormData
): Promise<BranchActionState> {
  const context = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  const associationId = context.membership.associationId;

  const branchId = formData.get("branchId") as string;
  if (!branchId) return { error: "Branch ID is required." };

  const result = await deactivateBranch(associationId, branchId);

  if (!result) {
    return { error: "Branch not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "branch.deactivated",
    entityType: "branch",
    entityId: branchId,
  });

  return { success: "Branch deactivated." };
}

export async function activateBranchAction(
  _prevState: BranchActionState,
  formData: FormData
): Promise<BranchActionState> {
  const context = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  const associationId = context.membership.associationId;

  const branchId = formData.get("branchId") as string;
  if (!branchId) return { error: "Branch ID is required." };

  const result = await activateBranch(associationId, branchId);

  if (!result) {
    return { error: "Branch not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "branch.activated",
    entityType: "branch",
    entityId: branchId,
  });

  return { success: "Branch activated." };
}
