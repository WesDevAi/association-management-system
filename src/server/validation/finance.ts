import { z } from "zod";

// ---------------------------------------------------------------------------
// Payment Category schemas
// ---------------------------------------------------------------------------

export const createPaymentCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  type: z.enum(["DUES", "CONTRIBUTION", "LEVY", "EVENT", "DONATION", "FINE", "OTHER"]),
  defaultAmount: z.coerce.number().min(0, "Amount must be positive").optional().or(z.literal("")),
  isRecurring: z.coerce.boolean().default(false),
  frequency: z.enum(["ONE_OFF", "MONTHLY", "QUARTERLY", "ANNUALLY"]).optional().or(z.literal("")),
});

export type CreatePaymentCategoryInput = z.infer<typeof createPaymentCategorySchema>;

export const updatePaymentCategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  type: z.enum(["DUES", "CONTRIBUTION", "LEVY", "EVENT", "DONATION", "FINE", "OTHER"]).optional(),
  defaultAmount: z.coerce.number().min(0).optional().or(z.literal("")),
  isRecurring: z.coerce.boolean().optional(),
  frequency: z.enum(["ONE_OFF", "MONTHLY", "QUARTERLY", "ANNUALLY"]).optional().or(z.literal("")),
});

export type UpdatePaymentCategoryInput = z.infer<typeof updatePaymentCategorySchema>;

// ---------------------------------------------------------------------------
// Record Payment schema
// ---------------------------------------------------------------------------

export const recordPaymentSchema = z
  .object({
    membershipId: z.string().min(1, "Member is required"),
    paymentCategoryId: z.string().min(1, "Payment category is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "USSD", "OTHER"]),
    reference: z.string().trim().min(1, "Reference is required").max(100),
    paidAt: z.string().min(1, "Payment date is required"),
    dueDate: z.string().optional().or(z.literal("")),
    periodStart: z.string().optional().or(z.literal("")),
    periodEnd: z.string().optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    fineId: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.periodEnd && data.periodStart) {
        return new Date(data.periodEnd) >= new Date(data.periodStart);
      }
      return true;
    },
    { message: "Period end must be on or after period start", path: ["periodEnd"] }
  );

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

// ---------------------------------------------------------------------------
// Update Payment Status schema
// ---------------------------------------------------------------------------

export const updatePaymentStatusSchema = z.object({
  paymentId: z.string().min(1),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]),
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;

// ---------------------------------------------------------------------------
// Issue Fine schema
// ---------------------------------------------------------------------------

export const issueFineSchema = z.object({
  membershipId: z.string().min(1, "Member is required"),
  reason: z.string().trim().min(2, "Reason must be at least 2 characters").max(500),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.string().optional().or(z.literal("")),
});

export type IssueFineInput = z.infer<typeof issueFineSchema>;

// ---------------------------------------------------------------------------
// Pay Fine schema (record a payment against a fine)
// ---------------------------------------------------------------------------

export const payFineSchema = z.object({
  fineId: z.string().min(1),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "USSD", "OTHER"]),
  reference: z.string().trim().min(1, "Reference is required").max(100),
});

export type PayFineInput = z.infer<typeof payFineSchema>;

// ---------------------------------------------------------------------------
// Waive Fine schema
// ---------------------------------------------------------------------------

export const waiveFineSchema = z.object({
  fineId: z.string().min(1),
  waivedReason: z.string().trim().min(2, "Reason must be at least 2 characters").max(500),
});

export type WaiveFineInput = z.infer<typeof waiveFineSchema>;

// ---------------------------------------------------------------------------
// Cancel Fine schema
// ---------------------------------------------------------------------------

export const cancelFineSchema = z.object({
  fineId: z.string().min(1),
});

export type CancelFineInput = z.infer<typeof cancelFineSchema>;
