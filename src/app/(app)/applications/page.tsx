import { requirePermission } from "@/server/permissions/guards";
import { getMembershipApplications } from "@/server/services/member-service";
import { ApplicationsTable } from "./applications-table";

export default async function ApplicationsPage() {
  const context = await requirePermission("applications.review");
  const associationId = context.membership.associationId;

  const applications = await getMembershipApplications(associationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Membership Applications</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve pending membership applications.
        </p>
      </div>

      <ApplicationsTable applications={applications} associationId={associationId} />
    </div>
  );
}
