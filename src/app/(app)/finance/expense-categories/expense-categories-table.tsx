"use client";

import { useState, useTransition } from "react";
import { Search, Filter, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ExpenseCategoryListItem } from "@/server/services/expense-service";
import {
  deactivateExpenseCategoryAction,
  activateExpenseCategoryAction,
} from "@/server/services/expense-actions";

interface ExpenseCategoriesTableProps {
  categories: ExpenseCategoryListItem[];
}

export function ExpenseCategoriesTable({ categories }: ExpenseCategoriesTableProps) {
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = categories.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesActive = showInactive || c.isActive;
    return matchesSearch && matchesActive;
  });

  function handleToggleActive(categoryId: string, currentlyActive: boolean) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("categoryId", categoryId);
      if (currentlyActive) {
        await deactivateExpenseCategoryAction(formData);
      } else {
        await activateExpenseCategoryAction(formData);
      }
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowInactive(!showInactive)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Filter className="size-4" />
          {showInactive ? "Hide inactive" : "Show inactive"}
        </button>
      </div>

      <div className="rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Expenses</th>
              <th className="px-4 py-3 text-left font-medium">Total Amount</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((category) => (
              <tr
                key={category.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-4 py-3 font-medium">{category.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {category.description ?? "—"}
                </td>
                <td className="px-4 py-3">{category.expenseCount}</td>
                <td className="px-4 py-3">
                  ₦{Number(category.totalAmount).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      category.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                    )}
                  >
                    {category.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(category.createdAt, "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggleActive(category.id, category.isActive)}
                  >
                    {category.isActive ? (
                      <XCircle className="size-4 text-muted-foreground" />
                    ) : (
                      <CheckCircle className="size-4 text-green-600" />
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            {categories.length === 0
              ? "No expense categories yet. Create one above."
              : "No categories match your search."}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {categories.length} category(ies)
      </p>
    </div>
  );
}
