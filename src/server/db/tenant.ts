import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth, type CurrentUser } from "@/server/auth/session";
import { resolveActiveMembership, verifyMembershipOwnership } from "@/server/db/tenant-logic";

export { resolveActiveMembership, verifyMembershipOwnership };

export const ACTIVE_ASSOCIATION_COOKIE = "ams_active_association";

/**
 * A membership loaded with everything needed to establish tenant + RBAC
 * context in one query: which association, and (via role -> rolePermissions
 * -> permission) exactly what that membership is allowed to do.
 *
 * Hand-written rather than inferred from Prisma's generated types: in this
 * sandbox `prisma generate` can't run (see tenant.md / prior phase notes),
 * so `prisma.membership.findMany(...)`'s real return type doesn't exist
 * yet and collapses to `any`. Without an explicit return type here,
 * TypeScript's generic inference in resolveActiveMembership() falls back
 * to that function's bare constraint type instead of `any`, which is a
 * worse failure mode (a wrong-but-plausible-looking type) than being
 * explicit. This type is a structural subset of the real Prisma query
 * result (matching the `include` below) — once `prisma generate` succeeds
 * in a real environment, the actual result stays assignable to it with no
 * further change needed here.
 */
export type MembershipWithContext = {
  associationId: string;
  fullName: string;
  association: { id: string; name: string };
  role: {
    name: string;
    key: string;
    rolePermissions: { permission: { key: string } }[];
  };
};

async function getUserMembershipsWithContext(userId: string): Promise<MembershipWithContext[]> {
  return prisma.membership.findMany({
    // Only ACTIVE memberships establish a usable session context — a
    // PENDING or SUSPENDED membership should not silently grant access.
    where: { userId, status: "ACTIVE" },
    include: {
      association: true,
      role: { include: { rolePermissions: { include: { permission: true } } } },
    },
  });
}

export type AssociationContext = {
  user: CurrentUser;
  membership: MembershipWithContext;
  permissionKeys: string[];
};

/**
 * The central tenant-context resolver described in the Phase 3 brief:
 * currentUser -> currentAssociation -> currentMembership -> permissions,
 * in one call, so this logic is never duplicated across pages/actions.
 *
 * Redirects to /login if unauthenticated (via requireAuth), or to
 * /onboarding if the user has no usable membership anywhere yet.
 */
export async function requireAssociationContext(): Promise<AssociationContext> {
  const user = await requireAuth();
  const memberships = await getUserMembershipsWithContext(user.id);

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const requestedAssociationId = cookieStore.get(ACTIVE_ASSOCIATION_COOKIE)?.value ?? null;
  const active = resolveActiveMembership(memberships, requestedAssociationId);

  if (!active) {
    // Defensive only — memberships.length > 0 guarantees resolveActiveMembership
    // returns non-null, but never assume that invariant silently.
    redirect("/onboarding");
  }

  const permissionKeys = active.role.rolePermissions.map((rp) => rp.permission.key);
  return { user, membership: active, permissionKeys };
}

/**
 * Returns every association the current user belongs to, for rendering the
 * association switcher. Does not establish which one is active.
 */
export async function getUserAssociations(userId: string) {
  const memberships = await getUserMembershipsWithContext(userId);
  return memberships.map((m) => ({
    associationId: m.associationId,
    associationName: m.association.name,
    roleName: m.role.name,
  }));
}
