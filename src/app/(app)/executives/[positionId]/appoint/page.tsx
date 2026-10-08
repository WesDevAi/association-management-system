import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getExecutivePosition } from "@/server/services/executive-service";
import { getMembers } from "@/server/services/member-service";
import { AppointExecutiveForm } from "./appoint-form";

export default async function AppointPage({
  params,
}: {
  params: Promise<{ positionId: string }>;
}) {
  const resolvedParams = await params;
  const context = await requirePermission(PERMISSIONS.EXECUTIVES_MANAGE);
  const associationId = context.membership.associationId;

  const [position, { members }] = await Promise.all([
    getExecutivePosition(associationId, resolvedParams.positionId),
    getMembers(associationId),
  ]);

  if (!position) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/executives/positions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to positions
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Appoint to {position.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Current occupants: {position.currentOccupants} / {position.maxOccupants}
        </p>
      </div>

      <AppointExecutiveForm
        positionId={position.id}
        members={members.map((m) => ({
          id: m.id,
          fullName: m.fullName,
          membershipNumber: m.membershipNumber,
        }))}
        associationId={associationId}
      />
    </div>
  );
}
