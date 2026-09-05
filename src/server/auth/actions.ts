"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginSchema, registerSchema } from "@/server/validation/auth";
import { registerUser } from "@/server/services/user-service";

export type AuthActionState = { error: string } | null;

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return null;
  } catch (error) {
    // next-auth v5 + Server Actions gotcha: signIn's internal redirect on
    // success throws a special Next.js redirect signal that is NOT an
    // AuthError and MUST be re-thrown so Next can actually navigate.
    // Only an AuthError here means the credentials were genuinely rejected.
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await registerUser(parsed.data);
  if (!result.success) {
    return { error: result.error };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/onboarding",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      // Extremely unlikely right after successful registration, but don't
      // silently swallow it if it happens.
      return { error: "Account created, but sign-in failed. Please log in." };
    }
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
