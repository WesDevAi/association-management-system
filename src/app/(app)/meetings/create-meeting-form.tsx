"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMeetingAction } from "@/server/services/meeting-actions";

interface CreateMeetingFormProps {
  associationId: string;
}

export function CreateMeetingForm({ associationId }: CreateMeetingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createMeetingAction(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <CardTitle className="text-base font-semibold">Schedule a Meeting</CardTitle>
        {expanded ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <CardContent className="pt-0">
          <form action={handleSubmit} className="flex flex-col gap-4">
            <input type="hidden" name="associationId" value={associationId} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="e.g. General Assembly"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="meetingNumber">Meeting Number</Label>
                <Input
                  id="meetingNumber"
                  name="meetingNumber"
                  placeholder="e.g. MTG-2026-001"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  name="type"
                  required
                  defaultValue="GENERAL"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="GENERAL">General</option>
                  <option value="EXECUTIVE">Executive</option>
                  <option value="BRANCH">Branch</option>
                  <option value="COMMITTEE">Committee</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scheduledAt">Date & Time *</Label>
                <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="e.g. Conference Hall" />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  placeholder="Brief description of the meeting"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="agenda">Agenda</Label>
                <textarea
                  id="agenda"
                  name="agenda"
                  rows={4}
                  placeholder="List the meeting agenda items"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="Any additional notes"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" name="isVirtual" id="isVirtual" className="size-4 rounded border-input" />
                <Label htmlFor="isVirtual" className="font-normal">
                  Virtual meeting
                </Label>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="meetingLink">Meeting Link</Label>
                <Input id="meetingLink" name="meetingLink" placeholder="https://..." type="url" />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400" role="status">
                {success}
              </p>
            )}

            <Button type="submit" disabled={isPending} className="mt-2 self-start">
              <Plus className="mr-1.5 size-4" />
              {isPending ? "Scheduling…" : "Schedule Meeting"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
