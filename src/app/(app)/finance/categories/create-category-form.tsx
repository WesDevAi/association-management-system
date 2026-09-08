"use client";

import { useState, useTransition } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPaymentCategoryAction } from "@/server/services/finance-actions";

export function CreateCategoryForm() {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createPaymentCategoryAction(null, formData);
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
        <CardTitle className="text-base font-semibold">Create Payment Category</CardTitle>
        {expanded ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <CardContent className="pt-0">
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Monthly Dues, Annual Levy"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  placeholder="Brief description of this category"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  name="type"
                  required
                  defaultValue="OTHER"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="DUES">Dues</option>
                  <option value="CONTRIBUTION">Contribution</option>
                  <option value="LEVY">Levy</option>
                  <option value="EVENT">Event</option>
                  <option value="DONATION">Donation</option>
                  <option value="FINE">Fine</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="defaultAmount">Default Amount (₦)</Label>
                <Input
                  id="defaultAmount"
                  name="defaultAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="frequency">Frequency</Label>
                <select
                  id="frequency"
                  name="frequency"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Not set</option>
                  <option value="ONE_OFF">One-off</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUALLY">Annually</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isRecurring"
                  name="isRecurring"
                  className="size-4 rounded border-input"
                />
                <Label htmlFor="isRecurring" className="font-normal">
                  Recurring
                </Label>
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
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
