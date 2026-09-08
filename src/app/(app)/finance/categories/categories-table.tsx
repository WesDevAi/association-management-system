"use client";

import { useTransition } from "react";
import { Power, PowerOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { deactivatePaymentCategoryAction, activatePaymentCategoryAction } from "@/server/services/finance-actions";
import type { PaymentCategoryListItem } from "@/server/services/finance-service";

interface CategoriesTableProps {
  categories: PaymentCategoryListItem[];
}

const typeLabels: Record<string, string> = {
  DUES: "Dues",
  CONTRIBUTION: "Contribution",
  LEVY: "Levy",
  EVENT: "Event",
  DONATION: "Donation",
  FINE: "Fine",
  OTHER: "Other",
};

const typeBadgeColors: Record<string, string> = {
  DUES: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  CONTRIBUTION: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  LEVY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  EVENT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  DONATION: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100",
  FINE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const [isPending, startTransition] = useTransition();

  function handleDeactivate(categoryId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("categoryId", categoryId);
      await deactivatePaymentCategoryAction(formData);
      window.location.reload();
    });
  }

  function handleActivate(categoryId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("categoryId", categoryId);
      await activatePaymentCategoryAction(formData);
      window.location.reload();
    });
  }

  return (
    <div className="rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Default Amount</th>
            <th className="px-4 py-3 text-left font-medium">Frequency</th>
            <th className="px-4 py-3 text-left font-medium">Payments</th>
            <th className="px-4 py-3 text-left font-medium">Collected</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium">{cat.name}</div>
                {cat.description && (
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {cat.description}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    typeBadgeColors[cat.type] ?? "bg-gray-100 text-gray-800"
                  )}
                >
                  {typeLabels[cat.type] ?? cat.type}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {cat.defaultAmount ? `₦${Number(cat.defaultAmount).toLocaleString()}` : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {cat.isRecurring ? (cat.frequency?.replace("_", " ") ?? "Recurring") : "One-off"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{cat.paymentCount}</td>
              <td className="px-4 py-3 text-muted-foreground">
                ₦{Number(cat.totalCollected).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    cat.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                  )}
                >
                  {cat.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  {cat.isActive ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeactivate(cat.id)}
                      disabled={isPending}
                      title="Deactivate"
                    >
                      <PowerOff className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleActivate(cat.id)}
                      disabled={isPending}
                      title="Activate"
                    >
                      <Power className="size-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {categories.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No payment categories yet. Create one above to get started.
        </div>
      )}
    </div>
  );
}
