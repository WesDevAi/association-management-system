import { z } from "zod";

// ---------------------------------------------------------------------------
// Expense Category schemas
// ---------------------------------------------------------------------------

export const createExpenseCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;

export const updateExpenseCategorySchema = z.object({
  categoryId: z.string().min(1, "Category ID is required"),
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;

// ---------------------------------------------------------------------------
// Create Expense schema
// ---------------------------------------------------------------------------

export const createExpenseSchema = z.object({
  expenseCategoryId: z.string().min(1, "Expense category is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  description: z.string().trim().min(2, "Description must be at least 2 characters").max(500),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "USSD", "OTHER"]),
  payeeVendor: z.string().trim().min(1, "Payee/vendor is required").max(200),
  referenceNumber: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  receiptDocumentId: z.string().optional().or(z.literal("")),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// ---------------------------------------------------------------------------
// Update Expense schema
// ---------------------------------------------------------------------------

export const updateExpenseSchema = z.object({
  expenseId: z.string().min(1, "Expense ID is required"),
  expenseCategoryId: z.string().min(1).optional(),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0").optional(),
  date: z.string().min(1).optional(),
  description: z.string().trim().min(2).max(500).optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "USSD", "OTHER"]).optional(),
  payeeVendor: z.string().trim().min(1).max(200).optional(),
  referenceNumber: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  receiptDocumentId: z.string().optional().or(z.literal("")),
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// ---------------------------------------------------------------------------
// Expense Filter schema
// ---------------------------------------------------------------------------

export const expenseFilterSchema = z.object({
  search: z.string().trim().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD", "USSD", "OTHER"]).optional().or(z.literal("")),
  dateFrom: z.string().optional().or(z.literal("")),
  dateTo: z.string().optional().or(z.literal("")),
  sort: z.enum(["date", "amount", "createdAt"]).optional().or(z.literal("")),
  order: z.enum(["asc", "desc"]).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).optional().or(z.literal("")),
});

export type ExpenseFilterInput = z.infer<typeof expenseFilterSchema>;
