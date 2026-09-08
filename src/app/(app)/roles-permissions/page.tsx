import Link from "next/link";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getAssociationRoles, getRoleStats } from "@/server/services/role-service";
import { RolesTable } from "./roles-table";
import { StatCard } from "@/components/app-shell/stat-card";
import { ShieldCheck, Shield, ShieldAlert, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function RolesPermissionsPage({
  searchParams,
}: {
  searchParams?: {
    search?: string;
    type?: string;
    page?: string;
  };
}) {
  const context = await requirePermission(PERMISSIONS.ROLES_MANAGE);
  const associationId = context.membership.associationId;

  const [result, stats] = await Promise.all([
    getAssociationRoles(associationId, {
      search: searchParams?.search,
      type: searchParams?.type,
      page: searchParams?.page ? parseInt(searchParams.page) : 1,
    }),
    getRoleStats(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">
            Manage association roles and their permission assignments.
          </p>
        </div>
        <Link href="/roles-permissions/new">
          <Button>
            <Plus className="mr-1.5 size-4" />
            Create Role
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Roles"
          value={stats.totalRoles}
          icon={ShieldCheck}
          emptyHint={stats.totalRoles === 0 ? "No roles yet" : undefined}
        />
        <StatCard label="System Roles" value={stats.systemRoles} icon={ShieldAlert} />
        <StatCard label="Custom Roles" value={stats.customRoles} icon={Shield} />
      </div>

      <RolesTable
        roles={result.roles}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        associationId={associationId}
      />
    </div>
  );
}
