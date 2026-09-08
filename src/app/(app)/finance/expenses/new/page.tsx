import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getExpenseCategories } from "@/server/services/expense-service";
import { CreateExpenseForm } from "./create-expense-form";

export default async function NewExpensePage() {
  const context = await requirePermission(PERMISSIONS.EXPENSES_MANAGE);
  const associationId = context.membership.associationId;

  const categories = await getExpenseCategories(associationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Record Expense</h1>
        <p className="text-sm text-muted-foreground">
          Record a new expense for the association.
        </p>
      </div>

      <CreateExpenseForm categories={categories} />
    </div>
  );
}
