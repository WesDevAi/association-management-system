import { requirePermission } from "@/server/permissions/guards";
import { getMembers, getMemberStats } from "@/server/services/member-service";
import { MembersTable } from "./members-table";
import { MembersStats } from "./members-stats";

export default async function MembersPage() {
  const context = await requirePermission("members.view");
  const associationId = context.membership.associationId;

  const [members, stats] = await Promise.all([
    getMembers(associationId),
    getMemberStats(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          Manage association members and their roles.
        </p>
      </div>

      <MembersStats stats={stats} />

      <MembersTable members={members} associationId={associationId} />
    </div>
  );
}
