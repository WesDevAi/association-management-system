"use server";

import {
  createPaymentCategorySchema,
  updatePaymentCategorySchema,
  recordPaymentSchema,
  issueFineSchema,
  waiveFineSchema,
  cancelFineSchema,
} from "@/server/validation/finance";
import {
  createPaymentCategory,
  updatePaymentCategory,
  deactivatePaymentCategory,
  activatePaymentCategory,
  recordPayment,
  issueFine,
  waiveFine,
  cancelFine,
} from "@/server/services/finance-service";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { notifyMember } from "@/server/services/notification-service";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/services/audit-service";

export type FinanceActionState = { error: string } | { success: string } | null;

// ---------------------------------------------------------------------------
// Payment Category actions
// ---------------------------------------------------------------------------

export async function createPaymentCategoryAction(
  _prevState: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const context = await requirePermission(PERMISSIONS.FINANCE_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = createPaymentCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
    defaultAmount: formData.get("defaultAmount"),
    isRecurring: formData.get("isRecurring") === "on" || formData.get("isRecurring") === "true",
    frequency: formData.get("frequency"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const rawDefaultAmount = formData.get("defaultAmount");
    const defaultAmount =
      rawDefaultAmount && rawDefaultAmount !== "" ? Number(rawDefaultAmount) : null;

    await createPaymentCategory(associationId, {
      name: parsed.data.name,
      description: parsed.data.description || null,
      type: parsed.data.type,
      defaultAmount,
      isRecurring: parsed.data.isRecurring,
      frequency: parsed.data.frequency || null,
    });

    await logAudit({
      associationId,
      action: "payment_category.created",
      entityType: "paymentCategory",
      metadata: { entityName: parsed.data.name },
    });

    return { success: `Category "${parsed.data.name}" created.` };
  } catch {
    return { error: "Failed to create payment category." };
  }
}

export async function updatePaymentCategoryAction(
  _prevState: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const context = await requirePermission(PERMISSIONS.FINANCE_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updatePaymentCategorySchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
    defaultAmount: formData.get("defaultAmount"),
    isRecurring: formData.get("isRecurring") === "on" || formData.get("isRecurring") === "true",
    frequency: formData.get("frequency"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const rawDefaultAmount = formData.get("defaultAmount");
  const defaultAmount =
    rawDefaultAmount && rawDefaultAmount !== "" ? Number(rawDefaultAmount) : null;

  const updated = await updatePaymentCategory(
    associationId,
    parsed.data.categoryId,
    {
      name: parsed.data.name,
      description: parsed.data.description || null,
      type: parsed.data.type,
      defaultAmount,
      isRecurring: parsed.data.isRecurring,
      frequency: parsed.data.frequency || null,
    }
  );

  if (!updated) {
    return { error: "Category not found." };
  }

  await logAudit({
    associationId,
    action: "payment_category.updated",
    entityType: "paymentCategory",
    entityId: parsed.data.categoryId,
    metadata: { entityName: parsed.data.name },
  });

  return { success: "Category updated." };
}

export async function deactivatePaymentCategoryAction(
  formData: FormData
): Promise<FinanceActionState> {
  const context = await requirePermission(PERMISSIONS.FINANCE_MANAGE);
  const associationId = context.membership.associationId;

  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) return { error: "Missing category ID." };

  const deactivated = await deactivatePaymentCategory(associationId, categoryId);
  if (!deactivated) return { error: "Category not found." };

  await logAudit({
    associationId,
    action: "payment_category.deactivated",
    entityType: "paymentCategory",
    entityId: categoryId,
  });

  return { success: "Category deactivated." };
}

export async function activatePaymentCategoryAction(
  formData: FormData
): Promise<FinanceActionState> {
  const context = await requirePermission(PERMISSIONS.FINANCE_MANAGE);
  const associationId = context.membership.associationId;

  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) return { error: "Missing category ID." };

  const activated = await activatePaymentCategory(associationId, categoryId);
  if (!activated) return { error: "Category not found." };

  await logAudit({
    associationId,
    action: "payment_category.activated",
    entityType: "paymentCategory",
    entityId: categoryId,
  });

  return { success: "Category activated." };
}

// ---------------------------------------------------------------------------
// Payment actions
// ---------------------------------------------------------------------------

export async function recordPaymentAction(
  _prevState: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const context = await requirePermission(PERMISSIONS.PAYMENTS_RECORD);
  const associationId = context.membership.associationId;

  const parsed = recordPaymentSchema.safeParse({
    membershipId: formData.get("membershipId"),
    paymentCategoryId: formData.get("paymentCategoryId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    reference: formData.get("reference"),
    paidAt: formData.get("paidAt"),
    dueDate: formData.get("dueDate"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    notes: formData.get("notes"),
    fineId: formData.get("fineId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await recordPayment(associationId, {
    membershipId: parsed.data.membershipId,
    paymentCategoryId: parsed.data.paymentCategoryId,
    amount: parsed.data.amount,
    method: parsed.data.method,
    reference: parsed.data.reference,
    paidAt: new Date(parsed.data.paidAt),
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    periodStart: parsed.data.periodStart ? new Date(parsed.data.periodStart) : null,
    periodEnd: parsed.data.periodEnd ? new Date(parsed.data.periodEnd) : null,
    notes: parsed.data.notes || null,
    fineId: parsed.data.fineId || null,
    recordedById: context.user.id,
  });

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  const category = await prisma.paymentCategory.findUnique({
    where: { id: parsed.data.paymentCategoryId },
    select: { name: true },
  });
  await notifyMember({
    membershipId: parsed.data.membershipId,
    associationId,
    title: "Payment Recorded",
    body: `A payment of ${parsed.data.amount} for "${category?.name ?? "Unknown"}" has been recorded.`,
    type: "PAYMENT",
    link: "/finance/payments",
  });

  await logAudit({
    associationId,
    action: "payment.recorded",
    entityType: "payment",
    entityId: result as string,
    metadata: { amount: parsed.data.amount, category: category?.name },
  });

  return { success: "Payment recorded successfully." };
}

// ---------------------------------------------------------------------------
// Fine actions
// ---------------------------------------------------------------------------

export async function issueFineAction(
  _prevState: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const context = await requirePermission(PERMISSIONS.FINES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = issueFineSchema.safeParse({
    membershipId: formData.get("membershipId"),
    reason: formData.get("reason"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await issueFine(associationId, {
    membershipId: parsed.data.membershipId,
    reason: parsed.data.reason,
    amount: parsed.data.amount,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    issuedById: context.user.id,
  });

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await notifyMember({
    membershipId: parsed.data.membershipId,
    associationId,
    title: "Fine Issued",
    body: `A fine of ${parsed.data.amount} has been issued: ${parsed.data.reason}`,
    type: "FINE",
    link: "/finance/fines",
  });

  await logAudit({
    associationId,
    action: "fine.issued",
    entityType: "fine",
    entityId: result as string,
    metadata: { amount: parsed.data.amount, reason: parsed.data.reason },
  });

  return { success: "Fine issued successfully." };
}

export async function waiveFineAction(
  _prevState: FinanceActionState,
  formData: FormData
): Promise<FinanceActionState> {
  const context = await requirePermission(PERMISSIONS.FINES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = waiveFineSchema.safeParse({
    fineId: formData.get("fineId"),
    waivedReason: formData.get("waivedReason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const waived = await waiveFine(
    associationId,
    parsed.data.fineId,
    context.user.id,
    parsed.data.waivedReason
  );

  if (!waived) {
    return { error: "Fine not found or already settled." };
  }

  const fine = await prisma.fine.findUnique({
    where: { id: parsed.data.fineId },
    select: { membershipId: true, reason: true },
  });
  if (fine) {
    await notifyMember({
      membershipId: fine.membershipId,
      associationId,
      title: "Fine Waived",
      body: `Your fine "${fine.reason}" has been waived.`,
      type: "FINE",
      link: "/finance/fines",
    });
  }

  await logAudit({
    associationId,
    action: "fine.waived",
    entityType: "fine",
    entityId: parsed.data.fineId,
    metadata: { reason: parsed.data.waivedReason },
  });

  return { success: "Fine waived." };
}

export async function cancelFineAction(
  formData: FormData
): Promise<FinanceActionState> {
  const context = await requirePermission(PERMISSIONS.FINES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = cancelFineSchema.safeParse({
    fineId: formData.get("fineId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const cancelled = await cancelFine(associationId, parsed.data.fineId);

  if (!cancelled) {
    return { error: "Fine not found or already settled." };
  }

  await logAudit({
    associationId,
    action: "fine.cancelled",
    entityType: "fine",
    entityId: parsed.data.fineId,
  });

  return { success: "Fine cancelled." };
}
