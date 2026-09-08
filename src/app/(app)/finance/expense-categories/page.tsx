import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getExpenseCategories } from "@/server/services/expense-service";
import { ExpenseCategoriesTable } from "./expense-categories-table";
import { CreateExpenseCategoryForm } from "./create-expense-category-form";

export default async function ExpenseCategoriesPage() {
  const context = await requirePermission(PERMISSIONS.EXPENSES_VIEW);
  const associationId = context.membership.associationId;

  const categories = await getExpenseCategories(associationId, { includeInactive: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Expense Categories</h1>
        <p className="text-sm text-muted-foreground">
          Define and manage categories for recording expenses.
        </p>
      </div>

      <CreateExpenseCategoryForm />

      <ExpenseCategoriesTable categories={categories} />
    </div>
  );
}
