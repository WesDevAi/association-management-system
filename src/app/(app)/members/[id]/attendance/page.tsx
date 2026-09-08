import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, XCircle, Ban, Clock } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import { getMemberDetail } from "@/server/services/member-service";
import {
  getMemberAttendanceHistory,
  getMeetings,
} from "@/server/services/meeting-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MemberAttendanceHistoryPage({
  params,
}: {
  params: { id: string };
}) {
  const context = await requirePermission("members.view");
  const associationId = context.membership.associationId;

  const member = await getMemberDetail(associationId, params.id);
  if (!member) notFound();

  const [history, allMeetings] = await Promise.all([
    getMemberAttendanceHistory(associationId, params.id),
    getMeetings(associationId),
  ]);

  if (!history) notFound();

  // Get meetings that have been completed or ongoing (attendance-relevant)
  const completedMeetings = allMeetings.filter(
    (m) => m.status === "COMPLETED" || m.status === "ONGOING"
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to members
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {history.fullName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Attendance history · {history.membershipNumber}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-start justify-between gap-4 pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Meetings</p>
              <p className="mt-1 text-2xl font-semibold">{history.totalMeetings}</p>
            </div>
            <CalendarDays className="size-9 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between gap-4 pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Attended</p>
              <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                {history.attended}
              </p>
            </div>
            <CheckCircle2 className="size-9 shrink-0 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between gap-4 pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Missed</p>
              <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
                {history.missed}
              </p>
            </div>
            <XCircle className="size-9 shrink-0 text-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between gap-4 pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Excused</p>
              <p className="mt-1 text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                {history.excused}
              </p>
            </div>
            <Ban className="size-9 shrink-0 text-yellow-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start justify-between gap-4 pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <p className="mt-1 text-2xl font-semibold">{history.attendanceRate}%</p>
            </div>
            <Clock className="size-9 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {history.totalMeetings > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${history.attendanceRate}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {history.attended} of {history.totalMeetings} meetings attended
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meeting History</CardTitle>
        </CardHeader>
        <CardContent>
          {completedMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <CalendarDays className="size-8 text-muted-foreground/50" />
              No completed meetings yet.
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Meeting</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedMeetings.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        <a
                          href={`/meetings/${m.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {m.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(m.scheduledAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
