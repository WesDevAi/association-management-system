import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getPayments, getPaymentCategories } from "@/server/services/finance-service";
import { getMembers } from "@/server/services/member-service";
import { PaymentsTable } from "./payments-table";
import { RecordPaymentForm } from "./record-payment-form";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; method?: string; category?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await requirePermission(PERMISSIONS.FINANCE_VIEW);
  const associationId = context.membership.associationId;

  const [payments, categories, { members }] = await Promise.all([
    getPayments(associationId, {
      status: resolvedSearchParams?.status,
      method: resolvedSearchParams?.method,
      categoryId: resolvedSearchParams?.category,
      search: resolvedSearchParams?.search,
    }),
    getPaymentCategories(associationId),
    getMembers(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Record and manage member payments.
        </p>
      </div>

      <RecordPaymentForm members={members} categories={categories} />

      <PaymentsTable payments={payments} />
    </div>
  );
}
