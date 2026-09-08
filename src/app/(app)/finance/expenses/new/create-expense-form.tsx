"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExpenseAction } from "@/server/services/expense-actions";
import type { ExpenseCategoryListItem } from "@/server/services/expense-service";
import Link from "next/link";

interface CreateExpenseFormProps {
  categories: ExpenseCategoryListItem[];
}

export function CreateExpenseForm({ categories }: CreateExpenseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createExpenseAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        router.push("/finance/expenses");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link href="/finance/expenses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <CardTitle className="text-base">Expense Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expenseCategoryId">Category *</Label>
              <select
                id="expenseCategoryId"
                name="expenseCategoryId"
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
              <Label htmlFor="date">Date *</Label>
              <Input id="date" name="date" type="date" required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <select
                id="paymentMethod"
                name="paymentMethod"
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

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                name="description"
                required
                placeholder="What was this expense for?"
                minLength={2}
                maxLength={500}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payeeVendor">Payee/Vendor *</Label>
              <Input
                id="payeeVendor"
                name="payeeVendor"
                required
                placeholder="Who was paid?"
                maxLength={200}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                name="referenceNumber"
                placeholder="Invoice #, receipt #, etc."
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="receiptDocumentId">Receipt Document ID</Label>
              <Input
                id="receiptDocumentId"
                name="receiptDocumentId"
                placeholder="Optional document ID"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Optional notes about this expense"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              {isPending ? "Recording..." : "Record Expense"}
            </Button>
            <Link href="/finance/expenses">
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
