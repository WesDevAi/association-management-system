/**
 * Stable role keys seeded for every association (except SUPER_ADMIN, which
 * is a single platform-wide role with associationId = null).
 *
 * These keys are the contract between the seed script, the permission
 * matrix, and any UI that needs to special-case a role (e.g. showing a
 * "Chairman" badge). Actual authorization decisions should check
 * PERMISSIONS via a user's RolePermission set — never `role.key === "..."`
 * scattered through the app.
 */
export const SYSTEM_ROLE_KEYS = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ASSOCIATION_ADMIN: "ASSOCIATION_ADMIN",
  CHAIRMAN: "CHAIRMAN",
  VICE_CHAIRMAN: "VICE_CHAIRMAN",
  SECRETARY: "SECRETARY",
  ASSISTANT_SECRETARY: "ASSISTANT_SECRETARY",
  TREASURER: "TREASURER",
  FINANCIAL_SECRETARY: "FINANCIAL_SECRETARY",
  AUDITOR: "AUDITOR",
  PRO: "PRO",
  MEMBER: "MEMBER",
} as const;

export type SystemRoleKey = (typeof SYSTEM_ROLE_KEYS)[keyof typeof SYSTEM_ROLE_KEYS];

/** Roles seeded per-association (everything except the platform-wide Super Admin). */
export const ASSOCIATION_SCOPED_ROLE_KEYS: SystemRoleKey[] = [
  SYSTEM_ROLE_KEYS.ASSOCIATION_ADMIN,
  SYSTEM_ROLE_KEYS.CHAIRMAN,
  SYSTEM_ROLE_KEYS.VICE_CHAIRMAN,
  SYSTEM_ROLE_KEYS.SECRETARY,
  SYSTEM_ROLE_KEYS.ASSISTANT_SECRETARY,
  SYSTEM_ROLE_KEYS.TREASURER,
  SYSTEM_ROLE_KEYS.FINANCIAL_SECRETARY,
  SYSTEM_ROLE_KEYS.AUDITOR,
  SYSTEM_ROLE_KEYS.PRO,
  SYSTEM_ROLE_KEYS.MEMBER,
];
