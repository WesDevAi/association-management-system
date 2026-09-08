"use server";

import { updateMemberRole } from "@/server/services/member-service";
import { deactivateMember, reactivateMember, approveApplication, rejectApplication } from "@/server/services/member-service";
import { logAudit } from "@/server/services/audit-service";

export type MembersActionState = { error: string } | null;

export async function updateMemberRoleAction(
  formData: FormData
): Promise<MembersActionState> {
  const memberId = formData.get("memberId") as string;
  const associationId = formData.get("associationId") as string;
  const roleId = formData.get("roleId") as string;

  if (!memberId || !associationId || !roleId) {
    return { error: "Missing required fields." };
  }

  const updated = await updateMemberRole(associationId, memberId, roleId);
  if (!updated) {
    return { error: "Member not found." };
  }

  await logAudit({
    associationId,
    action: "member.role_changed",
    entityType: "membership",
    entityId: memberId,
    metadata: { roleId },
  });

  return null;
}

export async function deactivateMemberAction(
  formData: FormData
): Promise<MembersActionState> {
  const memberId = formData.get("memberId") as string;
  const associationId = formData.get("associationId") as string;

  if (!memberId || !associationId) {
    return { error: "Missing required fields." };
  }

  const deactivated = await deactivateMember(associationId, memberId);
  if (!deactivated) {
    return { error: "Member not found or already inactive." };
  }

  await logAudit({
    associationId,
    action: "member.deactivated",
    entityType: "membership",
    entityId: memberId,
  });

  return null;
}

export async function reactivateMemberAction(
  formData: FormData
): Promise<MembersActionState> {
  const memberId = formData.get("memberId") as string;
  const associationId = formData.get("associationId") as string;

  if (!memberId || !associationId) {
    return { error: "Missing required fields." };
  }

  const reactivated = await reactivateMember(associationId, memberId);
  if (!reactivated) {
    return { error: "Member not found." };
  }

  await logAudit({
    associationId,
    action: "member.reactivated",
    entityType: "membership",
    entityId: memberId,
  });

  return null;
}

export async function approveApplicationAction(
  formData: FormData
): Promise<MembersActionState> {
  const applicationId = formData.get("applicationId") as string;
  const associationId = formData.get("associationId") as string;

  if (!applicationId || !associationId) {
    return { error: "Missing required fields." };
  }

  const result = await approveApplication(associationId, applicationId);
  if (!result) {
    return { error: "Could not approve application." };
  }

  await logAudit({
    associationId,
    action: "application.approved",
    entityType: "membershipApplication",
    entityId: applicationId,
  });

  return null;
}

export async function rejectApplicationAction(
  formData: FormData
): Promise<MembersActionState> {
  const applicationId = formData.get("applicationId") as string;
  const associationId = formData.get("associationId") as string;

  if (!applicationId || !associationId) {
    return { error: "Missing required fields." };
  }

  const result = await rejectApplication(associationId, applicationId);
  if (!result) {
    return { error: "Could not reject application." };
  }

  await logAudit({
    associationId,
    action: "application.rejected",
    entityType: "membershipApplication",
    entityId: applicationId,
  });

  return null;
}
