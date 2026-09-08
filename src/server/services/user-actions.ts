"use server";

import {
  updateMembershipRoleSchema,
  updateMembershipStatusSchema,
  linkUserAccountSchema,
  unlinkUserAccountSchema,
} from "@/server/validation/user";
import {
  updateMembershipRole,
  updateMembershipStatus,
  linkUserToMembership,
  unlinkUserFromMembership,
} from "@/server/services/user-service";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";

export type UserActionState = { error: string } | { success: string } | null;

// ---------------------------------------------------------------------------
// User / membership management actions
// ---------------------------------------------------------------------------

export async function updateMembershipRoleAction(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const context = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updateMembershipRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateMembershipRole(associationId, parsed.data.membershipId, parsed.data.roleId);

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  return { success: "Role updated." };
}

export async function updateMembershipStatusAction(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const context = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updateMembershipStatusSchema.safeParse({
    membershipId: formData.get("membershipId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateMembershipStatus(
    associationId,
    parsed.data.membershipId,
    parsed.data.status
  );

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  return { success: "Status updated." };
}

export async function linkUserAccountAction(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const context = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = linkUserAccountSchema.safeParse({
    membershipId: formData.get("membershipId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await linkUserToMembership(
    associationId,
    parsed.data.membershipId,
    parsed.data.userId
  );

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  return { success: "Account linked." };
}

export async function unlinkUserAccountAction(
  _prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const context = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = unlinkUserAccountSchema.safeParse({
    membershipId: formData.get("membershipId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await unlinkUserFromMembership(associationId, parsed.data.membershipId);

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  return { success: "Account unlinked." };
}
