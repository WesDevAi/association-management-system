"use server";

import {
  createPositionSchema,
  updatePositionSchema,
  createAppointmentSchema,
  endAppointmentSchema,
} from "@/server/validation/executive";
import {
  createExecutivePosition,
  updateExecutivePosition,
  deactivateExecutivePosition,
  activateExecutivePosition,
  appointExecutive,
  endAppointment,
  replaceExecutive,
} from "@/server/services/executive-service";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";

export type ExecutiveActionState = { error: string } | { success: string } | null;

// ---------------------------------------------------------------------------
// Position actions
// ---------------------------------------------------------------------------

export async function createPositionAction(
  _prevState: ExecutiveActionState,
  formData: FormData
): Promise<ExecutiveActionState> {
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = createPositionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    order: formData.get("order"),
    maxOccupants: formData.get("maxOccupants"),
    termLengthMonths: formData.get("termLengthMonths"),
    branchId: formData.get("branchId"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await createExecutivePosition(associationId, {
      title: parsed.data.title,
      description: parsed.data.description,
      order: parsed.data.order,
      maxOccupants: parsed.data.maxOccupants,
      termLengthMonths: parsed.data.termLengthMonths || null,
      branchId: parsed.data.branchId || null,
      roleId: parsed.data.roleId || null,
    });
    return { success: `Position "${parsed.data.title}" created.` };
  } catch {
    return { error: "Failed to create position." };
  }
}

export async function updatePositionAction(
  _prevState: ExecutiveActionState,
  formData: FormData
): Promise<ExecutiveActionState> {
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updatePositionSchema.safeParse({
    positionId: formData.get("positionId"),
    title: formData.get("title"),
    description: formData.get("description"),
    order: formData.get("order"),
    maxOccupants: formData.get("maxOccupants"),
    termLengthMonths: formData.get("termLengthMonths"),
    branchId: formData.get("branchId"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const updated = await updateExecutivePosition(associationId, parsed.data.positionId, {
    title: parsed.data.title,
    description: parsed.data.description,
    order: parsed.data.order,
    maxOccupants: parsed.data.maxOccupants,
    termLengthMonths: parsed.data.termLengthMonths || null,
    branchId: parsed.data.branchId || null,
    roleId: parsed.data.roleId || null,
  });

  if (!updated) {
    return { error: "Position not found." };
  }

  return { success: "Position updated." };
}

export async function deactivatePositionAction(
  formData: FormData
): Promise<ExecutiveActionState> {
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const positionId = formData.get("positionId") as string;
  if (!positionId) return { error: "Missing position ID." };

  const deactivated = await deactivateExecutivePosition(associationId, positionId);
  if (!deactivated) return { error: "Position not found." };

  return { success: "Position deactivated." };
}

export async function activatePositionAction(
  formData: FormData
): Promise<ExecutiveActionState> {
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const positionId = formData.get("positionId") as string;
  if (!positionId) return { error: "Missing position ID." };

  const activated = await activateExecutivePosition(associationId, positionId);
  if (!activated) return { error: "Position not found." };

  return { success: "Position activated." };
}

// ---------------------------------------------------------------------------
// Appointment actions
// ---------------------------------------------------------------------------

export async function appointExecutiveAction(
  _prevState: ExecutiveActionState,
  formData: FormData
): Promise<ExecutiveActionState> {
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = createAppointmentSchema.safeParse({
    executivePositionId: formData.get("executivePositionId"),
    membershipId: formData.get("membershipId"),
    appointmentType: formData.get("appointmentType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await appointExecutive(associationId, {
    executivePositionId: parsed.data.executivePositionId,
    membershipId: parsed.data.membershipId,
    appointmentType: parsed.data.appointmentType,
    startDate: new Date(parsed.data.startDate),
    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    notes: parsed.data.notes,
    appointedById: context.user.id,
  });

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  return { success: "Executive appointed successfully." };
}

export async function endAppointmentAction(
  _prevState: ExecutiveActionState,
  formData: FormData
): Promise<ExecutiveActionState> {
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = endAppointmentSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    status: formData.get("status"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ended = await endAppointment(
    associationId,
    parsed.data.appointmentId,
    parsed.data.status,
    parsed.data.endDate ? new Date(parsed.data.endDate) : undefined
  );

  if (!ended) {
    return { error: "Appointment not found." };
  }

  return { success: "Appointment ended." };
}

export async function replaceExecutiveAction(
  _prevState: ExecutiveActionState,
  formData: FormData
): Promise<ExecutiveActionState> {
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const appointmentId = formData.get("appointmentId") as string;
  const newMembershipId = formData.get("newMembershipId") as string;

  if (!appointmentId || !newMembershipId) {
    return { error: "Missing required fields." };
  }

  const result = await replaceExecutive(associationId, appointmentId, newMembershipId);

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  return { success: "Executive replaced successfully." };
}
