"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/server/auth/recovery-actions";
import type { RecoveryActionState } from "@/server/auth/recovery-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<RecoveryActionState, FormData>(requestPasswordResetAction, null);
  return <Card>
    <CardHeader><CardTitle>Reset your password</CardTitle><CardDescription>We’ll email a one-time reset link if the account exists.</CardDescription></CardHeader>
    <CardContent>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
        {state?.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-700" role="status">{state.success}</p>}
        <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
      </form>
      <p className="mt-4 text-center text-sm"><Link href="/login" className="text-primary underline-offset-4 hover:underline">Back to sign in</Link></p>
    </CardContent>
  </Card>;
}
