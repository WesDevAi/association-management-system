import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { CreateEventForm } from "./create-event-form";

export default async function NewEventPage() {
  await requirePermission(PERMISSIONS.EVENTS_MANAGE);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Event</h1>
        <p className="text-sm text-muted-foreground">
          Schedule a new event for the association.
        </p>
      </div>

      <CreateEventForm />
    </div>
  );
}
