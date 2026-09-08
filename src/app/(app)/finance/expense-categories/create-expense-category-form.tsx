"use client";

import { useState, useTransition } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExpenseCategoryAction } from "@/server/services/expense-actions";

export function CreateExpenseCategoryForm() {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createExpenseCategoryAction(null, formData);
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
        <CardTitle className="text-base font-semibold">Create Expense Category</CardTitle>
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
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. Office Supplies"
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Optional description"
                  maxLength={500}
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
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
