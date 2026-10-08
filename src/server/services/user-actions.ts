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
import { logAudit } from "@/server/services/audit-service";
import { prisma } from "@/lib/prisma";
import { accountLink, createAccountToken, hashToken, sendAccountEmail } from "@/server/auth/account-token";

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

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "user.role_changed",
    entityType: "membership",
    entityId: parsed.data.membershipId,
    metadata: { roleId: parsed.data.roleId },
  });

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

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "user.status_changed",
    entityType: "membership",
    entityId: parsed.data.membershipId,
    metadata: { status: parsed.data.status },
  });

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

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "user.linked",
    entityType: "membership",
    entityId: parsed.data.membershipId,
  });

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

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "user.unlinked",
    entityType: "membership",
    entityId: parsed.data.membershipId,
  });

  return { success: "Account unlinked." };
}

export async function inviteMembershipAccountAction(membershipId: string): Promise<{ error: string } | { success: string }> {
  const context = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  const associationId = context.membership.associationId;
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, associationId },
    include: { association: { select: { name: true } } },
  });
  if (!membership) return { error: "Membership not found." };
  if (membership.userId) return { error: "This membership already has an account." };
  const email = membership.email?.trim().toLowerCase();
  if (!email) return { error: "Add an email address to this membership before inviting them." };
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "An account already uses this email. Use Link account to connect it." };
  }

  const token = await createAccountToken({
    type: "MEMBERSHIP_INVITE", email, membershipId: membership.id, lifetimeMs: 7 * 24 * 60 * 60 * 1000,
  });
  const link = accountLink("/accept-invitation", token);
  try {
    await sendAccountEmail({
      to: email,
      subject: `Your ${membership.association.name} account invitation`,
      text: `You have been invited to access ${membership.association.name}. Set your password using this one-time link. It expires in 7 days.\n\n${link}`,
    });
  } catch (error) {
    await prisma.accountToken.updateMany({ where: { tokenHash: hashToken(token), consumedAt: null }, data: { consumedAt: new Date() } });
    return { error: error instanceof Error ? error.message : "Email could not be sent." };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "user.invited",
    entityType: "membership",
    entityId: membership.id,
    metadata: { email },
  });
  return { success: `Invitation sent to ${email}.` };
}
