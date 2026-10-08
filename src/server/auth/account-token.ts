import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function createRawToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAccountToken(input: {
  type: "PASSWORD_RESET" | "MEMBERSHIP_INVITE";
  email: string;
  membershipId?: string;
  userId?: string;
  lifetimeMs: number;
}) {
  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);
  await prisma.$transaction([
    prisma.accountToken.updateMany({
      where: {
        type: input.type,
        ...(input.membershipId ? { membershipId: input.membershipId } : { email: input.email }),
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    }),
    prisma.accountToken.create({
      data: {
        type: input.type,
        email: input.email,
        tokenHash,
        membershipId: input.membershipId,
        userId: input.userId,
        expiresAt: new Date(Date.now() + input.lifetimeMs),
      },
    }),
  ]);
  return rawToken;
}

export async function sendAccountEmail(input: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, text: input.text }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Email provider returned HTTP ${response.status}.`);
  }
}

export function accountLink(path: string, token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  return `${baseUrl}${path}?token=${encodeURIComponent(token)}`;
}
