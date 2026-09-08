"use client";

import { useState, useTransition } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordPaymentAction } from "@/server/services/finance-actions";

interface RecordPaymentFormProps {
  members: { id: string; fullName: string; membershipNumber: string }[];
  categories: { id: string; name: string; type: string }[];
}

export function RecordPaymentForm({ members, categories }: RecordPaymentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await recordPaymentAction(null, formData);
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
        <CardTitle className="text-base font-semibold">Record Payment</CardTitle>
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
                <Label htmlFor="paymentCategoryId">Category *</Label>
                <select
                  id="paymentCategoryId"
                  name="paymentCategoryId"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select a category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="method">Payment Method *</Label>
                <select
                  id="method"
                  name="method"
                  required
                  defaultValue="CASH"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="USSD">USSD</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reference">Reference *</Label>
                <Input
                  id="reference"
                  name="reference"
                  required
                  placeholder="e.g. PAY-2026-001"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="paidAt">Payment Date *</Label>
                <Input id="paidAt" name="paidAt" type="date" required />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="periodStart">Period Start</Label>
                <Input id="periodStart" name="periodStart" type="date" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="periodEnd">Period End</Label>
                <Input id="periodEnd" name="periodEnd" type="date" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fineId">Linked Fine (Optional)</Label>
                <Input
                  id="fineId"
                  name="fineId"
                  placeholder="Fine ID if paying a fine"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  placeholder="Optional payment notes"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              {isPending ? "Recording..." : "Record Payment"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
