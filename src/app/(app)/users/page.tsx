import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getAssociationUsers, getUserStats } from "@/server/services/user-service";
import { getAssociationRoles } from "@/server/services/role-service";
import { UsersTable } from "./users-table";
import { StatCard } from "@/components/app-shell/stat-card";
import { Users, UserCheck, Link2, Unlink } from "lucide-react";

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: {
    search?: string;
    status?: string;
    roleId?: string;
    linked?: string;
    page?: string;
  };
}) {
  const context = await requirePermission(PERMISSIONS.MEMBERS_MANAGE);
  const associationId = context.membership.associationId;

  const [result, stats, rolesResult] = await Promise.all([
    getAssociationUsers(associationId, {
      search: searchParams?.search,
      status: searchParams?.status,
      roleId: searchParams?.roleId,
      linked: searchParams?.linked,
      page: searchParams?.page ? parseInt(searchParams.page) : 1,
    }),
    getUserStats(associationId),
    getAssociationRoles(associationId, { limit: 100 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage association user access, roles, and account linking.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Members"
          value={stats.totalMemberships}
          icon={Users}
          emptyHint={stats.totalMemberships === 0 ? "No members yet" : undefined}
        />
        <StatCard label="Active" value={stats.active} icon={UserCheck} />
        <StatCard label="Linked Accounts" value={stats.linked} icon={Link2} />
        <StatCard label="Unlinked" value={stats.unlinked} icon={Unlink} />
      </div>

      <UsersTable
        users={result.users}
        roles={rolesResult.roles}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        associationId={associationId}
      />
    </div>
  );
}
