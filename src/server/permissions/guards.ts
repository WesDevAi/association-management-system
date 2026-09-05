import "server-only";
import { requireAssociationContext, type AssociationContext } from "@/server/db/tenant";
import { hasPermission } from "@/server/permissions/has-permission";
import type { PermissionKey } from "@/lib/constants/permissions";
import { PERMISSION_TIER_KEYS, type PermissionTierKey } from "@/lib/constants/roles";

/**
 * Thrown when an authenticated user with a valid association context still
 * lacks the specific permission/role required for an operation. Distinct
 * from "not authenticated" (handled by requireAuth's redirect to /login)
 * and from "no association context at all" (handled by requireAssociationContext's
 * redirect to /onboarding). Caught by the (app) route group's error
 * boundary and shown as a clean, generic "you don't have permission"
 * message — never a raw stack trace or database error (see 3.21).
 */
export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Resolves the full tenant + RBAC context (redirecting to /login or
 * /onboarding as needed — see requireAssociationContext) AND asserts the
 * resolved membership's role grants the given permission. Throws
 * ForbiddenError otherwise. This is the primary guard every business
 * module (Members, Meetings, Finance, etc. — built in later phases) should
 * call at the top of a Server Action or data-loading function.
 */
export async function requirePermission(
  permission: PermissionKey
): Promise<AssociationContext> {
  const context = await requireAssociationContext();
  if (!hasPermission(context.membership, permission)) {
    throw new ForbiddenError();
  }
  return context;
}

/**
 * Asserts the resolved membership's Role.key matches one of the given
 * permission tiers. Prefer requirePermission() for almost everything —
 * this exists for the rare case that genuinely needs to know the tier
 * itself rather than a specific capability (e.g. "only an Association
 * Admin may delete the association").
 */
export async function requireRole(
  ...tiers: PermissionTierKey[]
): Promise<AssociationContext> {
  const context = await requireAssociationContext();
  if (!tiers.includes(context.membership.role.key as PermissionTierKey)) {
    throw new ForbiddenError();
  }
  return context;
}

/** Convenience: is the current user the platform-wide Super Admin? */
export async function requireSuperAdmin(): Promise<void> {
  // Super Admin is a platform-wide concept (Role.associationId = null),
  // deliberately NOT resolved via requireAssociationContext (which
  // requires an association membership and would redirect a pure
  // platform admin with no memberships to /onboarding).
  const { requireAuth } = await import("@/server/auth/session");
  const { prisma } = await import("@/lib/prisma");
  const user = await requireAuth();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.isSuperAdmin) {
    throw new ForbiddenError("Super Admin access required.");
  }
}

export { PERMISSION_TIER_KEYS };
