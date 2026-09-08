import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import {
  getMeetingDetail,
  getMeetingAttendances,
  getAttendanceSummary,
  getMembersForAttendance,
} from "@/server/services/meeting-service";
import { MeetingDetailCard } from "../meeting-detail-card";
import { MeetingAttendees } from "../meeting-attendees";

export default async function MeetingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const context = await requirePermission("meetings.manage");
  const associationId = context.membership.associationId;

  const meeting = await getMeetingDetail(associationId, params.id);

  if (!meeting) {
    notFound();
  }

  const [, attendanceSummary, membersForAttendance] = await Promise.all([
    getMeetingAttendances(associationId, meeting.id),
    getAttendanceSummary(associationId, meeting.id),
    getMembersForAttendance(associationId, meeting.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to meetings
      </Link>

      <MeetingDetailCard meeting={meeting} attendanceSummary={attendanceSummary} />

      <MeetingAttendees
        members={membersForAttendance}
        associationId={associationId}
        meetingId={meeting.id}
      />
    </div>
  );
}
