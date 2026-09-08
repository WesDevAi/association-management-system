import { Users, CalendarDays, Crown, Landmark } from "lucide-react";
import Link from "next/link";
import { requireAssociationContext } from "@/server/db/tenant";
import { prisma } from "@/lib/prisma";
import { getUpcomingMeetings } from "@/server/services/meeting-service";
import { getExecutiveStats } from "@/server/services/executive-service";
import { getFinanceStats } from "@/server/services/finance-service";
import { StatCard } from "@/components/app-shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const context = await requireAssociationContext();
  const associationId = context.membership.associationId;

  const [memberCount, upcomingMeetingCount, upcomingMeetings, execStats, financeStats] =
    await Promise.all([
      prisma.membership.count({ where: { associationId, status: "ACTIVE" } }),
      prisma.meeting.count({ where: { associationId, scheduledAt: { gte: new Date() } } }),
      getUpcomingMeetings(associationId),
      getExecutiveStats(associationId),
      getFinanceStats(associationId),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to {context.membership.association.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {context.membership.fullName} · {context.membership.role.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Members" value={memberCount} icon={Users} />
        <StatCard
          label="Active Executives"
          value={execStats.activeExecutives}
          icon={Crown}
          emptyHint={execStats.activeExecutives === 0 ? "No executives yet" : undefined}
        />
        <StatCard
          label="Upcoming Meetings"
          value={upcomingMeetingCount}
          icon={CalendarDays}
          emptyHint={upcomingMeetingCount === 0 ? "Nothing scheduled" : undefined}
        />
        <StatCard
          label="Total Collected"
          value={`₦${Number(financeStats.totalCollected).toLocaleString()}`}
          icon={Landmark}
          emptyHint={financeStats.totalCollected === "0.00" ? "No collections yet" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <Link href="/members" className="text-primary underline-offset-4 hover:underline">Manage Members</Link>
            {` · `}
            <Link href="/executives" className="text-primary underline-offset-4 hover:underline">View Executive</Link>
            {` · `}
            <Link href="/meetings" className="text-primary underline-offset-4 hover:underline">Schedule Meeting</Link>
            {` · `}
            <Link href="/attendance" className="text-primary underline-offset-4 hover:underline">Record Attendance</Link>
            {` · `}
            <Link href="/finance" className="text-primary underline-offset-4 hover:underline">View Finance</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {memberCount > 0
              ? `${memberCount} member(s) onboarded. Activity will appear here as meetings, payments, and other events are recorded.`
              : "Nothing to show yet. Activity will appear here once members, meetings, and payments start being recorded."}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming meetings</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {upcomingMeetings.length === 0
              ? "No meetings scheduled yet."
              : upcomingMeetings.map((m) => (
                  <p key={m.id}>
                    {m.title}
                    {m.meetingNumber ? ` (${m.meetingNumber})` : ""} —{" "}
                    {new Date(m.scheduledAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Announcements</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No announcements yet.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
