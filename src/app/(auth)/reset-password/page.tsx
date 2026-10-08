import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <Card>
    <CardHeader><CardTitle>Choose a new password</CardTitle><CardDescription>Use at least 8 characters.</CardDescription></CardHeader>
    <CardContent>
      <ResetPasswordForm token={token} />
      <p className="mt-4 text-center text-sm"><Link href="/login" className="text-primary underline-offset-4 hover:underline">Back to sign in</Link></p>
    </CardContent>
  </Card>;
}
