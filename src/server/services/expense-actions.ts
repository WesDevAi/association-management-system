"use server";

import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  createExpenseSchema,
  updateExpenseSchema,
} from "@/server/validation/expense";
import {
  createExpenseCategory,
  updateExpenseCategory,
  deactivateExpenseCategory,
  activateExpenseCategory,
  createExpense,
  updateExpense,
} from "@/server/services/expense-service";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { logAudit } from "@/server/services/audit-service";

export type ExpenseActionState = { error: string } | { success: string } | null;

// ---------------------------------------------------------------------------
// Expense Category actions
// ---------------------------------------------------------------------------

export async function createExpenseCategoryAction(
  _prevState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const context = await requirePermission(PERMISSIONS.EXPENSES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = createExpenseCategorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createExpenseCategory(associationId, {
    name: parsed.data.name,
    description: parsed.data.description || null,
  });

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "expense_category.created",
    entityType: "expenseCategory",
    metadata: { entityName: parsed.data.name },
  });

  return { success: `Category "${parsed.data.name}" created.` };
}

export async function updateExpenseCategoryAction(
  _prevState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const context = await requirePermission(PERMISSIONS.EXPENSES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updateExpenseCategorySchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateExpenseCategory(
    associationId,
    parsed.data.categoryId,
    {
      name: parsed.data.name,
      description: parsed.data.description || null,
    }
  );

  if (!result) {
    return { error: "Category not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "expense_category.updated",
    entityType: "expenseCategory",
    entityId: parsed.data.categoryId,
    metadata: { entityName: parsed.data.name },
  });

  return { success: "Category updated." };
}

export async function deactivateExpenseCategoryAction(
  formData: FormData
): Promise<ExpenseActionState> {
  const context = await requirePermission(PERMISSIONS.EXPENSES_MANAGE);
  const associationId = context.membership.associationId;

  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) return { error: "Missing category ID." };

  const deactivated = await deactivateExpenseCategory(associationId, categoryId);
  if (!deactivated) return { error: "Category not found." };

  return { success: "Category deactivated." };
}

export async function activateExpenseCategoryAction(
  formData: FormData
): Promise<ExpenseActionState> {
  const context = await requirePermission(PERMISSIONS.EXPENSES_MANAGE);
  const associationId = context.membership.associationId;

  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) return { error: "Missing category ID." };

  const activated = await activateExpenseCategory(associationId, categoryId);
  if (!activated) return { error: "Category not found." };

  return { success: "Category activated." };
}

// ---------------------------------------------------------------------------
// Expense actions
// ---------------------------------------------------------------------------

export async function createExpenseAction(
  _prevState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const context = await requirePermission(PERMISSIONS.EXPENSES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = createExpenseSchema.safeParse({
    expenseCategoryId: formData.get("expenseCategoryId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
    paymentMethod: formData.get("paymentMethod"),
    payeeVendor: formData.get("payeeVendor"),
    referenceNumber: formData.get("referenceNumber"),
    notes: formData.get("notes"),
    receiptDocumentId: formData.get("receiptDocumentId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createExpense(associationId, {
    expenseCategoryId: parsed.data.expenseCategoryId,
    amount: parsed.data.amount,
    date: new Date(parsed.data.date),
    description: parsed.data.description,
    paymentMethod: parsed.data.paymentMethod,
    payeeVendor: parsed.data.payeeVendor,
    referenceNumber: parsed.data.referenceNumber || null,
    notes: parsed.data.notes || null,
    receiptDocumentId: parsed.data.receiptDocumentId || null,
    recordedById: context.user.id,
  });

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "expense.recorded",
    entityType: "expense",
    entityId: result as string,
    metadata: { amount: parsed.data.amount },
  });

  return { success: "Expense recorded successfully." };
}

export async function updateExpenseAction(
  _prevState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const context = await requirePermission(PERMISSIONS.EXPENSES_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updateExpenseSchema.safeParse({
    expenseId: formData.get("expenseId"),
    expenseCategoryId: formData.get("expenseCategoryId"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    description: formData.get("description"),
    paymentMethod: formData.get("paymentMethod"),
    payeeVendor: formData.get("payeeVendor"),
    referenceNumber: formData.get("referenceNumber"),
    notes: formData.get("notes"),
    receiptDocumentId: formData.get("receiptDocumentId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateExpense(associationId, parsed.data.expenseId, {
    expenseCategoryId: parsed.data.expenseCategoryId,
    amount: parsed.data.amount,
    date: parsed.data.date ? new Date(parsed.data.date) : undefined,
    description: parsed.data.description,
    paymentMethod: parsed.data.paymentMethod,
    payeeVendor: parsed.data.payeeVendor,
    referenceNumber: parsed.data.referenceNumber,
    notes: parsed.data.notes,
    receiptDocumentId: parsed.data.receiptDocumentId,
  });

  if (!result) {
    return { error: "Expense not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "expense.updated",
    entityType: "expense",
    entityId: parsed.data.expenseId,
  });

  return { success: "Expense updated." };
}
