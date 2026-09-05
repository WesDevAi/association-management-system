import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireAuth();

  // If this user already has an active membership somewhere, they've
  // already onboarded — don't show the "create an association" form again.
  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (existingMembership) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Set up your association</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;ll become this association&apos;s administrator.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
