"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/auth/password";
import { hashToken } from "@/server/auth/account-token";
import { acceptMembershipInviteSchema } from "@/server/validation/auth";

export type InvitationActionState = { error?: string; success?: string } | null;

export async function acceptMembershipInviteAction(
  _prevState: InvitationActionState,
  formData: FormData
): Promise<InvitationActionState> {
  const parsed = acceptMembershipInviteSchema.safeParse({ token: formData.get("token"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };

  const now = new Date();
  const tokenHash = hashToken(parsed.data.token);
  const invite = await prisma.accountToken.findFirst({
    where: { tokenHash, type: "MEMBERSHIP_INVITE", consumedAt: null, expiresAt: { gt: now } },
    include: { membership: true },
  });
  if (!invite?.membership || !invite.membershipId) return { error: "This invitation is invalid or expired. Ask your association to send another." };
  if (invite.membership.userId) return { error: "This membership already has an account. Sign in or contact your association." };
  if (invite.membership.email?.trim().toLowerCase() !== invite.email) return { error: "The membership email changed. Ask your association to send a new invitation." };
  if (await prisma.user.findUnique({ where: { email: invite.email }, select: { id: true } })) {
    return { error: "An account already uses this email. Sign in and ask your association to link it." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const consumed = await tx.accountToken.updateMany({
        where: { id: invite.id, consumedAt: null, expiresAt: { gt: new Date() } },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) return false;
      const user = await tx.user.create({
        data: { name: invite.membership!.fullName, email: invite.email, passwordHash, status: "ACTIVE" },
        select: { id: true },
      });
      const linked = await tx.membership.updateMany({
        where: { id: invite.membershipId!, userId: null, associationId: invite.membership!.associationId },
        data: { userId: user.id },
      });
      if (linked.count !== 1) throw new Error("Membership could not be linked.");
      return true;
    });
    return result ? { success: "Account created. You can now sign in." } : { error: "This invitation is invalid or expired. Ask your association to send another." };
  } catch (error) {
    console.error("[ams] membership invitation acceptance failed", error instanceof Error ? error.message : "unknown error");
    return { error: "We could not create your account. Please try again or contact your association." };
  }
}
