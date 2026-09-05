/**
 * Pure tenant-membership-selection logic — deliberately has NO imports of
 * `"server-only"`, Prisma, or `next/headers`, so it can be unit-tested
 * directly with `node:test` without needing a database, a request, or
 * Next.js's bundler (which is what makes the `server-only` marker package
 * a no-op in the first place — outside that bundler it just throws, which
 * would break plain test runs). The impure wrapper in `tenant.ts` (real
 * cookies/Prisma calls) is what's actually restricted to server-side use.
 */

/**
 * Given everything a user is actually a member of, and what association
 * they asked for (e.g. from a cookie), decides which membership should be
 * "active" for page-load context resolution. A stale/missing/mismatched
 * request should NOT lock the user out — it silently falls back to their
 * first membership. This never leaks another tenant's data: the fallback
 * only ever selects from `memberships`, which the caller already scoped to
 * the authenticated user.
 */
export function resolveActiveMembership<M extends { associationId: string }>(
  memberships: M[],
  requestedAssociationId: string | null
): M | null {
  if (memberships.length === 0) return null;
  if (requestedAssociationId) {
    const match = memberships.find((m) => m.associationId === requestedAssociationId);
    if (match) return match;
  }
  return memberships[0];
}

/**
 * Verification for an EXPLICIT switch request (the association switcher).
 * Unlike resolveActiveMembership, this must NOT fall back to a different
 * association on mismatch — a user asking to switch to an association they
 * don't belong to must be rejected outright. This directly enforces
 * Phase 3.8's "never accept a client-supplied associationId as proof of
 * authorization."
 */
export function verifyMembershipOwnership<M extends { associationId: string }>(
  memberships: M[],
  requestedAssociationId: string
): M | null {
  return memberships.find((m) => m.associationId === requestedAssociationId) ?? null;
}
