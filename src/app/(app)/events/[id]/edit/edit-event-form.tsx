"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateEventAction } from "@/server/services/event-actions";
import type { EventDetail } from "@/server/services/event-service";

interface EditEventFormProps {
  event: EventDetail;
}

export function EditEventForm({ event }: EditEventFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      formData.set("eventId", event.id);
      const result = await updateEventAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        router.push(`/events/${event.id}`);
      }
    });
  }

  const startAtValue = new Date(event.startAt).toISOString().slice(0, 16);
  const endAtValue = event.endAt
    ? new Date(event.endAt).toISOString().slice(0, 16)
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit Event</CardTitle>
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
                defaultValue={event.title}
                minLength={2}
                maxLength={200}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startAt">Start Date & Time *</Label>
              <Input
                id="startAt"
                name="startAt"
                type="datetime-local"
                required
                defaultValue={startAtValue}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endAt">End Date & Time</Label>
              <Input
                id="endAt"
                name="endAt"
                type="datetime-local"
                defaultValue={endAtValue}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={event.location ?? ""}
                placeholder="e.g. Conference Hall"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                defaultValue={event.capacity ?? ""}
                placeholder="Unlimited"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={event.description ?? ""}
                placeholder="Brief description of the event"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isVirtual"
                id="isVirtual"
                defaultChecked={event.isVirtual}
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
                type="url"
                defaultValue={event.virtualLink ?? ""}
                placeholder="https://..."
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
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/events/${event.id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
