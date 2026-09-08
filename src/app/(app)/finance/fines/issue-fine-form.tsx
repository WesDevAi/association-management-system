"use client";

import { useState, useTransition } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { issueFineAction } from "@/server/services/finance-actions";

interface IssueFineFormProps {
  members: { id: string; fullName: string; membershipNumber: string }[];
}

export function IssueFineForm({ members }: IssueFineFormProps) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await issueFineAction(null, formData);
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
        <CardTitle className="text-base font-semibold">Issue Fine</CardTitle>
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
                <Label htmlFor="amount">Amount (₦) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="reason">Reason *</Label>
                <textarea
                  id="reason"
                  name="reason"
                  rows={2}
                  required
                  placeholder="Reason for issuing this fine"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" />
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
              {isPending ? "Issuing..." : "Issue Fine"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
