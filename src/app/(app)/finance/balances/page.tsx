import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getMemberBalances } from "@/server/services/finance-service";
import { BalancesTable } from "./balances-table";

export default async function BalancesPage() {
  const context = await requirePermission(PERMISSIONS.FINANCE_VIEW);
  const associationId = context.membership.associationId;

  const balances = await getMemberBalances(associationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Member Balances</h1>
        <p className="text-sm text-muted-foreground">
          View payment history and outstanding balances for all members.
        </p>
      </div>

      <BalancesTable balances={balances} />
    </div>
  );
}
