import { z } from "zod";

// ---------------------------------------------------------------------------
// Branch schemas
// ---------------------------------------------------------------------------

export const createBranchSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(20)
    .transform((v) => v.toUpperCase()),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  isHeadquarters: z.coerce.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = z.object({
  branchId: z.string().min(1, "Branch ID is required"),
  name: z.string().trim().min(2).max(100).optional(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .transform((v) => v.toUpperCase())
    .optional(),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  isHeadquarters: z.coerce.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

export const branchFilterSchema = z.object({
  search: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ALL", "ACTIVE", "INACTIVE"]).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).optional().or(z.literal("")),
});

export type BranchFilterInput = z.infer<typeof branchFilterSchema>;

export const deleteBranchSchema = z.object({
  branchId: z.string().min(1, "Branch ID is required"),
});

export type DeleteBranchInput = z.infer<typeof deleteBranchSchema>;
