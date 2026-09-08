import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getPaymentCategories } from "@/server/services/finance-service";
import { CategoriesTable } from "./categories-table";
import { CreateCategoryForm } from "./create-category-form";

export default async function CategoriesPage() {
  const context = await requirePermission(PERMISSIONS.FINANCE_VIEW);
  const associationId = context.membership.associationId;

  const categories = await getPaymentCategories(associationId, { includeInactive: true });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment Categories</h1>
        <p className="text-sm text-muted-foreground">
          Define and manage payment categories for dues, contributions, levies, and more.
        </p>
      </div>

      <CreateCategoryForm />

      <CategoriesTable categories={categories} />
    </div>
  );
}
