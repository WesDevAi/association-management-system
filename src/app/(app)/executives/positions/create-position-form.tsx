"use client";

import { useTransition } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPositionAction } from "@/server/services/executive-actions";

interface CreatePositionFormProps {
  associationId: string;
}

export function CreatePositionForm({ associationId }: CreatePositionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createPositionAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        setSuccess(result.success);
        setExpanded(false);
        window.location.reload();
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
        <CardTitle className="text-base font-semibold">Create Position</CardTitle>
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
                  placeholder="e.g. Chairman, Secretary"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  placeholder="Brief description of this position"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  min="0"
                  defaultValue="0"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maxOccupants">Max Occupants</Label>
                <Input
                  id="maxOccupants"
                  name="maxOccupants"
                  type="number"
                  min="1"
                  max="50"
                  defaultValue="1"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="termLengthMonths">Term Length (months)</Label>
                <Input
                  id="termLengthMonths"
                  name="termLengthMonths"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Optional"
                />
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

            <Button type="submit" disabled={isPending} className="self-start">
              <Plus className="mr-1.5 size-4" />
              {isPending ? "Creating..." : "Create Position"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}

import { useState } from "react";
