import Link from "next/link";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getBranches, getBranchStats } from "@/server/services/branch-service";
import { BranchesTable } from "./branches-table";
import { StatCard } from "@/components/app-shell/stat-card";
import { GitBranch, Building, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function BranchesPage({
  searchParams,
}: {
  searchParams?: {
    search?: string;
    status?: string;
    page?: string;
  };
}) {
  const context = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  const associationId = context.membership.associationId;

  const [result, stats] = await Promise.all([
    getBranches(associationId, {
      search: searchParams?.search,
      status: searchParams?.status,
      page: searchParams?.page ? parseInt(searchParams.page) : 1,
    }),
    getBranchStats(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Branches</h1>
          <p className="text-sm text-muted-foreground">
            Manage association branches and regional offices.
          </p>
        </div>
        <Link href="/settings/branches/new">
          <Button>
            <Plus className="mr-1.5 size-4" />
            Add Branch
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Branches"
          value={stats.total}
          icon={GitBranch}
          emptyHint={stats.total === 0 ? "No branches yet" : undefined}
        />
        <StatCard label="Active" value={stats.active} icon={Building} />
        <StatCard label="Inactive" value={stats.inactive} icon={MapPin} />
        <StatCard
          label="Headquarters"
          value={stats.headquartersId ? "1" : "—"}
          icon={Building}
        />
      </div>

      <BranchesTable
        branches={result.branches}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
