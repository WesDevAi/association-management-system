"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/server/auth/session";
import { ACTIVE_ASSOCIATION_COOKIE, verifyMembershipOwnership } from "@/server/db/tenant";

export type SwitchAssociationResult = { success: true } | { success: false; error: string };

/**
 * The only way the "active association" cookie is ever written. Per
 * Phase 3.8: the requested associationId is NEVER trusted on its own —
 * it's checked against the caller's real, ACTIVE memberships first.
 */
export async function setActiveAssociation(
  requestedAssociationId: string
): Promise<SwitchAssociationResult> {
  const user = await requireAuth();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    select: { associationId: true },
  });

  const verified = verifyMembershipOwnership(memberships, requestedAssociationId);
  if (!verified) {
    // Do not reveal whether the association exists at all — same response
    // shape whether it's a typo, a stale link, or a deliberate probe.
    return { success: false, error: "You don't have access to that association." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ASSOCIATION_COOKIE, verified.associationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days — a preference pointer, re-verified every request regardless
  });

  revalidatePath("/", "layout");
  return { success: true };
}
