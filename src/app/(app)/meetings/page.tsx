import { requirePermission } from "@/server/permissions/guards";
import { getMeetings, getMeetingStats } from "@/server/services/meeting-service";
import { MeetingsTable } from "./meetings-table";
import { MeetingsStats } from "./meetings-stats";
import { CreateMeetingForm } from "./create-meeting-form";

export default async function MeetingsPage() {
  const context = await requirePermission("meetings.manage");
  const associationId = context.membership.associationId;

  const [meetings, stats] = await Promise.all([
    getMeetings(associationId),
    getMeetingStats(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
        <p className="text-sm text-muted-foreground">
          Schedule and manage association meetings.
        </p>
      </div>

      <MeetingsStats stats={stats} />

      <CreateMeetingForm associationId={associationId} />

      <MeetingsTable meetings={meetings} associationId={associationId} />
    </div>
  );
}
