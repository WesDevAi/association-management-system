"use client";

import { useActionState } from "react";
import Link from "next/link";
import { acceptMembershipInviteAction } from "@/server/auth/invitation-actions";
import type { InvitationActionState } from "@/server/auth/invitation-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<InvitationActionState, FormData>(acceptMembershipInviteAction, null);
  return <form action={formAction} className="flex flex-col gap-4">
    <input type="hidden" name="token" value={token} />
    <div className="flex flex-col gap-1.5"><Label htmlFor="password">Create password</Label><Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={100} required /></div>
    {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
    {state?.success && <div className="text-sm text-green-700" role="status">{state.success} <Link href="/login" className="underline">Sign in</Link></div>}
    <Button type="submit" disabled={pending || !token}>{pending ? "Creating account…" : "Accept invitation"}</Button>
    {!token && <p className="text-sm text-destructive">This invitation link is missing its token. Ask your association to resend it.</p>}
  </form>;
}
