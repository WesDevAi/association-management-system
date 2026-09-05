import { z } from "zod";

export const memberStatusFilterSchema = z.object({
  status: z.enum(["ACTIVE", "PENDING", "INACTIVE", "SUSPENDED", "EXPELLED", "ALUMNI"]).optional(),
});

export type MemberStatusFilter = z.infer<typeof memberStatusFilterSchema>;

export const updateMemberRoleSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
