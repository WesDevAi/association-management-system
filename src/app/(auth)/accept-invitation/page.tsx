import Link from "next/link";
import { AcceptInvitationForm } from "./accept-invitation-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <Card>
    <CardHeader><CardTitle>Accept your invitation</CardTitle><CardDescription>Create a password to access your association account.</CardDescription></CardHeader>
    <CardContent>
      <AcceptInvitationForm token={token} />
      <p className="mt-4 text-center text-sm"><Link href="/login" className="text-primary underline-offset-4 hover:underline">Already have an account? Sign in</Link></p>
    </CardContent>
  </Card>;
}
