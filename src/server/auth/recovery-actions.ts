"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/auth/password";
import { createAccountToken, hashToken, sendAccountEmail, accountLink } from "@/server/auth/account-token";
import { resetPasswordSchema, requestPasswordResetSchema } from "@/server/validation/auth";

export type RecoveryActionState = { error?: string; success?: string } | null;

export async function requestPasswordResetAction(
  _prevState: RecoveryActionState,
  formData: FormData
): Promise<RecoveryActionState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };

  const genericSuccess = "If an active account uses that email, a reset link will arrive shortly.";
  let resetTokenHash: string | undefined;
  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || user.status !== "ACTIVE" || !user.passwordHash) return { success: genericSuccess };

    const recent = await prisma.accountToken.count({
      where: { type: "PASSWORD_RESET", email: user.email, createdAt: { gt: new Date(Date.now() - 60_000) } },
    });
    if (recent > 0) return { success: genericSuccess };

    const token = await createAccountToken({
      type: "PASSWORD_RESET", email: user.email, userId: user.id, lifetimeMs: 60 * 60 * 1000,
    });
    resetTokenHash = hashToken(token);
    const link = accountLink("/reset-password", token);
    await sendAccountEmail({
      to: user.email,
      subject: "Reset your AMS password",
      text: `Use this one-time link to reset your password. It expires in one hour.\n\n${link}\n\nIf you did not request this, you can ignore this email.`,
    });
  } catch (error) {
    if (resetTokenHash) {
      await prisma.accountToken.updateMany({ where: { tokenHash: resetTokenHash, consumedAt: null }, data: { consumedAt: new Date() } });
    }
    console.error("[ams] password reset email could not be sent", error instanceof Error ? error.message : "unknown error");
  }
  return { success: genericSuccess };
}

export async function resetPasswordAction(
  _prevState: RecoveryActionState,
  formData: FormData
): Promise<RecoveryActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.accountToken.findFirst({
    where: { tokenHash, type: "PASSWORD_RESET", consumedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record?.userId) return { error: "This reset link is invalid or expired. Request a new one." };

  const passwordHash = await hashPassword(parsed.data.password);
  const updated = await prisma.$transaction(async (tx) => {
    const consumed = await tx.accountToken.updateMany({
      where: { id: record.id, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) return false;
    await tx.user.update({ where: { id: record.userId! }, data: { passwordHash } });
    await tx.accountToken.updateMany({
      where: { userId: record.userId!, type: "PASSWORD_RESET", consumedAt: null },
      data: { consumedAt: new Date() },
    });
    return true;
  });
  if (!updated) return { error: "This reset link is invalid or expired. Request a new one." };
  return { success: "Password updated. You can now sign in." };
}
