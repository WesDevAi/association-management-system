"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEventAction } from "@/server/services/event-actions";
import Link from "next/link";

export function CreateEventForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createEventAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        router.push("/events");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link href="/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <CardTitle className="text-base">Event Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Event title"
                minLength={2}
                maxLength={200}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Event description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startAt">Start Date/Time *</Label>
              <Input id="startAt" name="startAt" type="datetime-local" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endAt">End Date/Time</Label>
              <Input id="endAt" name="endAt" type="datetime-local" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Physical location" maxLength={200} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                placeholder="Unlimited"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isVirtual"
                name="isVirtual"
                type="checkbox"
                className="size-4 rounded border-input"
              />
              <Label htmlFor="isVirtual" className="font-normal">
                Virtual event
              </Label>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="virtualLink">Virtual Link</Label>
              <Input
                id="virtualLink"
                name="virtualLink"
                placeholder="https://..."
                maxLength={500}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              <Save className="mr-1.5 size-4" />
              {isPending ? "Creating..." : "Create Event"}
            </Button>
            <Link href="/events">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
