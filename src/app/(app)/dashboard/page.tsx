import { Users, Wallet, CreditCard, CalendarDays, ClipboardCheck, Gavel } from "lucide-react";
import { requireAssociationContext } from "@/server/db/tenant";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/app-shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const context = await requireAssociationContext();
  const associationId = context.membership.associationId;

  // Every number below is a genuine query result, scoped to the current
  // association — Phase 3.20 explicitly forbids fake statistics. Counts
  // are naturally zero/near-zero this early since Members/Meetings/
  // Payments/Fines modules haven't been built yet (later phases); that's
  // shown as a real empty state, not simulated.
  const [memberCount, upcomingMeetingCount] = await Promise.all([
    prisma.membership.count({ where: { associationId, status: "ACTIVE" } }),
    prisma.meeting.count({ where: { associationId, scheduledAt: { gte: new Date() } } }),
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Members" value={memberCount} icon={Users} />
        <StatCard
          label="Outstanding Dues"
          value="—"
          icon={Wallet}
          emptyHint="Dues tracking hasn't been set up yet"
        />
        <StatCard
          label="Payments This Month"
          value="—"
          icon={CreditCard}
          emptyHint="No payment module yet"
        />
        <StatCard label="Upcoming Meetings" value={upcomingMeetingCount} icon={CalendarDays} emptyHint={upcomingMeetingCount === 0 ? "Nothing scheduled" : undefined} />
        <StatCard
          label="Attendance Rate"
          value="—"
          icon={ClipboardCheck}
          emptyHint="No meetings recorded yet"
        />
        <StatCard
          label="Outstanding Fines"
          value="—"
          icon={Gavel}
          emptyHint="No fines module yet"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Member management, meetings, and finance tools will appear here as those modules are built.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Nothing to show yet. Activity will appear here once members, meetings, and payments start being recorded.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming meetings</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {upcomingMeetingCount === 0
              ? "No meetings scheduled yet."
              : `${upcomingMeetingCount} meeting(s) scheduled.`}
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
