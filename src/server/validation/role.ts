import { z } from "zod";

// ---------------------------------------------------------------------------
// Role & permission management schemas
// ---------------------------------------------------------------------------

export const roleFilterSchema = z.object({
  search: z.string().trim().optional().or(z.literal("")),
  type: z.enum(["ALL", "SYSTEM", "CUSTOM"]).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).optional().or(z.literal("")),
});

export type RoleFilterInput = z.infer<typeof roleFilterSchema>;

export const createRoleSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  permissionIds: z.array(z.string()).min(1, "Select at least one permission").optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const deleteRoleSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
});

export type DeleteRoleInput = z.infer<typeof deleteRoleSchema>;
