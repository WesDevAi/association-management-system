import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getEvent } from "@/server/services/event-service";
import { EditEventForm } from "./edit-event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const context = await requirePermission(PERMISSIONS.EVENTS_MANAGE);
  const associationId = context.membership.associationId;

  const event = await getEvent(associationId, resolvedParams.id);

  if (!event) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/events/${resolvedParams.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to event
      </Link>

      <EditEventForm event={event} />
    </div>
  );
}
