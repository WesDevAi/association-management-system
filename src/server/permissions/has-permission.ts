import type { PermissionKey } from "@/lib/constants/permissions";

/**
 * Minimal shape needed to make an authorization decision. Callers pass in
 * a Membership loaded with its Role -> RolePermission -> Permission chain,
 * e.g.:
 *
 *   prisma.membership.findUnique({
 *     where: { associationId_userId: { associationId, userId } },
 *     include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
 *   })
 */
export type MembershipWithPermissions = {
  role: {
    rolePermissions: {
      permission: { key: string };
    }[];
  };
};

/**
 * Checks whether a membership's role grants a given permission.
 * This is the ONLY place permission logic should live — never scatter
 * `role.key === "CHAIRMAN"` checks through pages, actions, or API routes.
 */
export function hasPermission(
  membership: MembershipWithPermissions | null | undefined,
  permission: PermissionKey
): boolean {
  if (!membership) return false;
  return membership.role.rolePermissions.some(
    (rp) => rp.permission.key === permission
  );
}

/** True if the membership's role grants every listed permission. */
export function hasAllPermissions(
  membership: MembershipWithPermissions | null | undefined,
  permissions: PermissionKey[]
): boolean {
  return permissions.every((p) => hasPermission(membership, p));
}

/** True if the membership's role grants at least one listed permission. */
export function hasAnyPermission(
  membership: MembershipWithPermissions | null | undefined,
  permissions: PermissionKey[]
): boolean {
  return permissions.some((p) => hasPermission(membership, p));
}
