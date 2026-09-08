"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { appointExecutiveAction } from "@/server/services/executive-actions";

interface AppointExecutiveFormProps {
  positionId: string;
  members: { id: string; fullName: string; membershipNumber: string }[];
  associationId: string;
}

export function AppointExecutiveForm({
  positionId,
  members,
  associationId,
}: AppointExecutiveFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await appointExecutiveAction(null, formData);
      if (result && "success" in result) {
        router.push("/executives");
        router.refresh();
        return null;
      }
      return result;
    },
    null
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="executivePositionId" value={positionId} />
          <input type="hidden" name="associationId" value={associationId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="membershipId">Member *</Label>
              <select
                id="membershipId"
                name="membershipId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.membershipNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="appointmentType">Appointment Type *</Label>
              <select
                id="appointmentType"
                name="appointmentType"
                required
                defaultValue="APPOINTED"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ELECTED">Elected</option>
                <option value="APPOINTED">Appointed</option>
                <option value="ACTING">Acting</option>
                <option value="INTERIM">Interim</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Optional notes about this appointment"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {state && "error" in state && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={isPending} className="self-start">
            {isPending ? "Appointing..." : "Appoint Executive"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
