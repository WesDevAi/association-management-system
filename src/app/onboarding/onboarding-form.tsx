"use client";

import { useActionState } from "react";
import { createAssociationAction } from "@/server/services/association-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(createAssociationAction, null);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="name">Association name</Label>
              <Input id="name" name="name" required placeholder="Lagos Alumni Association" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="slug">Association URL</Label>
              <Input id="slug" name="slug" required placeholder="lagos-alumni" />
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Optional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input id="contactEmail" name="contactEmail" type="email" placeholder="Optional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input id="contactPhone" name="contactPhone" placeholder="Optional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="Optional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" placeholder="Optional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue="NGN" maxLength={3} />
            </div>
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={isPending} className="mt-2 self-start">
            {isPending ? "Creating association…" : "Create association"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
