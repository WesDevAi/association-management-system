"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/server/auth/recovery-actions";
import type { RecoveryActionState } from "@/server/auth/recovery-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<RecoveryActionState, FormData>(resetPasswordAction, null);
  return <form action={formAction} className="flex flex-col gap-4">
    <input type="hidden" name="token" value={token} />
    <div className="flex flex-col gap-1.5"><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={100} required /></div>
    {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
    {state?.success && <div className="text-sm text-green-700" role="status">{state.success} <Link href="/login" className="underline">Sign in</Link></div>}
    <Button type="submit" disabled={pending || !token}>{pending ? "Updating…" : "Update password"}</Button>
    {!token && <p className="text-sm text-destructive">This link is missing its reset token. Request a new one.</p>}
  </form>;
}
