/**
 * `Role` = a stable PERMISSION TIER — what someone is allowed to do.
 *
 * This is deliberately a small, fixed set. It is NOT where leadership
 * titles like "Chairman" or "Treasurer" live — those are association-
 * configurable ExecutivePosition titles instead (see
 * src/lib/constants/executive-positions.ts), each optionally linked to one
 * of these tiers via ExecutivePosition.roleId. An association renaming or
 * adding a leadership title never touches this file or the Role table.
 *
 * Actual authorization decisions should check PERMISSIONS via a user's
 * RolePermission set (see src/server/permissions/has-permission.ts) —
 * never `role.key === "..."` scattered through the app.
 */
export const PERMISSION_TIER_KEYS = {
  /** Platform-wide, cross-association. associationId = null on this Role. */
  SUPER_ADMIN: "SUPER_ADMIN",
  /** Full control within one association (except platform administration). */
  ASSOCIATION_ADMIN: "ASSOCIATION_ADMIN",
  /** Day-to-day operational tier most executive positions should carry. */
  STAFF: "STAFF",
  /** Read-only oversight tier (finance, reports, audit log). */
  AUDITOR: "AUDITOR",
  /** Baseline tier every ordinary member holds. */
  MEMBER: "MEMBER",
} as const;

export type PermissionTierKey =
  (typeof PERMISSION_TIER_KEYS)[keyof typeof PERMISSION_TIER_KEYS];

/** Permission tiers seeded per-association (everything except the platform-wide Super Admin). */
export const ASSOCIATION_SCOPED_PERMISSION_TIER_KEYS: PermissionTierKey[] = [
  PERMISSION_TIER_KEYS.ASSOCIATION_ADMIN,
  PERMISSION_TIER_KEYS.STAFF,
  PERMISSION_TIER_KEYS.AUDITOR,
  PERMISSION_TIER_KEYS.MEMBER,
];
