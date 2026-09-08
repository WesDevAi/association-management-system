import { z } from "zod";

// ---------------------------------------------------------------------------
// User / membership management schemas
// ---------------------------------------------------------------------------

export const userFilterSchema = z.object({
  search: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ALL", "PENDING", "ACTIVE", "INACTIVE", "SUSPENDED", "EXPELLED", "ALUMNI"]).optional().or(z.literal("")),
  roleId: z.string().optional().or(z.literal("")),
  linked: z.enum(["ALL", "LINKED", "UNLINKED"]).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).optional().or(z.literal("")),
});

export type UserFilterInput = z.infer<typeof userFilterSchema>;

export const updateMembershipRoleSchema = z.object({
  membershipId: z.string().min(1, "Membership ID is required"),
  roleId: z.string().min(1, "Role is required"),
});

export type UpdateMembershipRoleInput = z.infer<typeof updateMembershipRoleSchema>;

export const updateMembershipStatusSchema = z.object({
  membershipId: z.string().min(1, "Membership ID is required"),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED", "EXPELLED", "ALUMNI"]),
});

export type UpdateMembershipStatusInput = z.infer<typeof updateMembershipStatusSchema>;

export const linkUserAccountSchema = z.object({
  membershipId: z.string().min(1, "Membership ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export type LinkUserAccountInput = z.infer<typeof linkUserAccountSchema>;

export const unlinkUserAccountSchema = z.object({
  membershipId: z.string().min(1, "Membership ID is required"),
});

export type UnlinkUserAccountInput = z.infer<typeof unlinkUserAccountSchema>;
