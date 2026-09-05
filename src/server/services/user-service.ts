import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/auth/password";
import type { RegisterInput } from "@/server/validation/auth";

export type RegisterUserResult =
  | { success: true; userId: string }
  | { success: false; error: string };

export async function registerUser(input: RegisterInput): Promise<RegisterUserResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    // Deliberately generic — do not confirm/deny which emails have accounts.
    return { success: false, error: "Could not create account with those details." };
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return { success: true, userId: user.id };
}
