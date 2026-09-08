import { requirePermission } from "@/server/permissions/guards";
import Link from "next/link";
import {
  getMeetings,
  getMeetingDetail,
  getAttendanceSummary,
  getMembersForAttendance,
} from "@/server/services/meeting-service";
import { MeetingDetailCard } from "../meetings/meeting-detail-card";
import { MeetingAttendees } from "../meetings/meeting-attendees";
import { AttendanceMeetingSelector } from "./attendance-meeting-selector";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams?: { meetingId?: string };
}) {
  const context = await requirePermission("attendance.record");
  const associationId = context.membership.associationId;

  // Get all meetings (scheduled + ongoing + completed) for the selector
  const allMeetings = await getMeetings(associationId);

  // Determine which meeting to show
  let meetingId = searchParams?.meetingId;

  // If no meetingId specified, find the next upcoming meeting
  if (!meetingId) {
    const upcoming = allMeetings.find(
      (m) => m.status === "SCHEDULED" || m.status === "ONGOING"
    );
    meetingId = upcoming?.id;
  }

  const meeting = meetingId ? await getMeetingDetail(associationId, meetingId) : null;
  const attendanceSummary = meeting
    ? await getAttendanceSummary(associationId, meeting.id)
    : undefined;
  const membersForAttendance = meeting
    ? await getMembersForAttendance(associationId, meeting.id)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Record and manage attendance for meetings.
        </p>
      </div>

      <AttendanceMeetingSelector
        meetings={allMeetings}
        selectedMeetingId={meetingId}
      />

      {!meeting ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
          <p>No meetings available to record attendance for.</p>
          <Link
            href="/meetings"
            className="text-primary underline-offset-4 hover:underline"
          >
            Schedule a meeting
          </Link>
        </div>
      ) : (
        <>
          <MeetingDetailCard meeting={meeting} attendanceSummary={attendanceSummary} />
          <MeetingAttendees
            members={membersForAttendance}
            associationId={associationId}
            meetingId={meeting.id}
          />
        </>
      )}
    </div>
  );
}
