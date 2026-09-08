import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, MapPin, Video, Users, FileText, ListChecks, StickyNote, User } from "lucide-react";
import { format } from "date-fns";
import type { MeetingDetail, AttendanceSummary } from "@/server/services/meeting-service";

interface MeetingDetailCardProps {
  meeting: MeetingDetail;
  attendanceSummary?: AttendanceSummary;
}

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  ONGOING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const typeLabels: Record<string, string> = {
  GENERAL: "General",
  EXECUTIVE: "Executive",
  BRANCH: "Branch",
  COMMITTEE: "Committee",
  EMERGENCY: "Emergency",
};

export function MeetingDetailCard({ meeting, attendanceSummary }: MeetingDetailCardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{meeting.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[meeting.status] ?? "bg-gray-100 text-gray-800"
                }`}
              >
                {meeting.status.charAt(0) + meeting.status.slice(1).toLowerCase()}
              </span>
              <span className="text-sm text-muted-foreground capitalize">
                {typeLabels[meeting.type] ?? meeting.type}
              </span>
              {meeting.meetingNumber && (
                <span className="text-xs text-muted-foreground font-mono">
                  {meeting.meetingNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Scheduled</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              {format(new Date(meeting.scheduledAt), "PPP p")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Duration</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              {meeting.endedAt
                ? `${format(new Date(meeting.scheduledAt), "p")} – ${format(
                    new Date(meeting.endedAt),
                    "p"
                  )}`
                : "TBD"}
            </div>
          </CardContent>
        </Card>
        {meeting.location && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Location</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                {meeting.location}
              </div>
            </CardContent>
          </Card>
        )}
        {meeting.isVirtual && meeting.meetingLink && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Meeting Link</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm">
                <Video className="size-4 shrink-0 text-muted-foreground" />
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Join online
                </a>
              </div>
            </CardContent>
          </Card>
        )}
        {meeting.createdBy && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Created By</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 shrink-0 text-muted-foreground" />
                {meeting.createdBy.name}
              </div>
            </CardContent>
          </Card>
        )}
        {meeting.branchName && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Branch</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm">
                {meeting.branchName}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {meeting.description && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.description}</p>
          </CardContent>
        </Card>
      )}

      {meeting.agenda && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4" />
              Agenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.agenda}</p>
          </CardContent>
        </Card>
      )}

      {meeting.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <StickyNote className="size-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{meeting.notes}</p>
          </CardContent>
        </Card>
      )}

      {attendanceSummary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <p className="text-xs text-muted-foreground">Total Members</p>
                <p className="text-lg font-semibold">{attendanceSummary.totalMembers}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {attendanceSummary.present}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {attendanceSummary.absent}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Excused</p>
                <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {attendanceSummary.excused}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {attendanceSummary.late}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Attendance Rate</p>
                <p className="text-lg font-semibold">{attendanceSummary.attendanceRate}%</p>
              </div>
            </div>
            {attendanceSummary.totalMembers > 0 && (
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${attendanceSummary.attendanceRate}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
