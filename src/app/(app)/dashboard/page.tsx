import {
  Users, CalendarDays, Landmark, PartyPopper,
  FolderOpen, Bell, GitBranch, FileText, Activity
} from "lucide-react";
import Link from "next/link";
import { requireAssociationContext } from "@/server/db/tenant";
import { prisma } from "@/lib/prisma";
import { getUpcomingMeetings } from "@/server/services/meeting-service";
import { getFinanceStats } from "@/server/services/finance-service";
import { getUpcomingEvents } from "@/server/services/event-service";
import { getRecentActivity } from "@/server/services/audit-service";
import { getPublishedAnnouncements } from "@/server/services/announcement-service";
import { StatCard } from "@/components/app-shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const context = await requireAssociationContext();
  const associationId = context.membership.associationId;

  const [
    memberStats,
    upcomingMeetingCount,
    upcomingMeetings,
    financeStats,
    upcomingEvents,
    pendingApplications,
    branchCount,
    documentCount,
    unreadNotifications,
    recentActivity,
    publishedAnnouncements,
  ] = await Promise.all([
    prisma.membership.groupBy({
      by: ["status"],
      where: { associationId },
      _count: true,
    }),
    prisma.meeting.count({ where: { associationId, scheduledAt: { gte: new Date() } } }),
    getUpcomingMeetings(associationId),
    getFinanceStats(associationId),
    getUpcomingEvents(associationId, 3),
    prisma.membershipApplication.count({ where: { associationId, status: "PENDING" } }),
    prisma.branch.count({ where: { associationId } }),
    prisma.document.count({ where: { associationId } }),
    prisma.notification.count({ where: { userId: context.user.id, isRead: false } }),
    getRecentActivity(associationId, 8),
    getPublishedAnnouncements(associationId, 3),
  ]);

  const statusCounts = Object.fromEntries(memberStats.map((s) => [s.status, s._count]));
  const totalMembers = memberStats.reduce((sum, s) => sum + s._count, 0);
  const activeMembers = statusCounts["ACTIVE"] ?? 0;
  const pendingMembers = statusCounts["PENDING"] ?? 0;

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
        <Link href="/members">
          <StatCard label="Total Members" value={totalMembers} icon={Users} />
        </Link>
        <Link href="/finance">
          <StatCard
            label="Total Collected"
            value={`₦${Number(financeStats.totalCollected).toLocaleString()}`}
            icon={Landmark}
            emptyHint={financeStats.totalCollected === "0.00" ? "No collections yet" : undefined}
          />
        </Link>
        <Link href="/meetings">
          <StatCard
            label="Upcoming Meetings"
            value={upcomingMeetingCount}
            icon={CalendarDays}
            emptyHint={upcomingMeetingCount === 0 ? "Nothing scheduled" : undefined}
          />
        </Link>
        <Link href="/events">
          <StatCard
            label="Upcoming Events"
            value={upcomingEvents.length}
            icon={PartyPopper}
            emptyHint={upcomingEvents.length === 0 ? "No upcoming events" : undefined}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/applications">
          <StatCard
            label="Pending Applications"
            value={pendingApplications}
            icon={FileText}
            emptyHint={pendingApplications === 0 ? "No pending applications" : undefined}
          />
        </Link>
        <Link href="/settings/branches">
          <StatCard label="Branches" value={branchCount} icon={GitBranch} />
        </Link>
        <Link href="/documents">
          <StatCard label="Documents" value={documentCount} icon={FolderOpen} />
        </Link>
        <Link href="/notifications">
          <StatCard
            label="Unread Notifications"
            value={unreadNotifications}
            icon={Bell}
            emptyHint={unreadNotifications === 0 ? "All caught up" : undefined}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link href="/audit-log" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Actions will appear here as members, payments, meetings, and other events are recorded.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground mt-0.5">
                      <Activity className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.userName} ·{" "}
                        {new Date(activity.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Link href="/members" className="text-primary underline-offset-4 hover:underline">Manage Members</Link>
            <Link href="/meetings" className="text-primary underline-offset-4 hover:underline">Schedule Meeting</Link>
            <Link href="/attendance" className="text-primary underline-offset-4 hover:underline">Record Attendance</Link>
            <Link href="/finance/payments" className="text-primary underline-offset-4 hover:underline">Record Payment</Link>
            <Link href="/announcements" className="text-primary underline-offset-4 hover:underline">Create Announcement</Link>
            <Link href="/documents" className="text-primary underline-offset-4 hover:underline">Upload Document</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Meetings</CardTitle>
            <Link href="/meetings" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {upcomingMeetings.length === 0
              ? "No meetings scheduled yet."
              : upcomingMeetings.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-1">
                    <span>
                      {m.title}
                      {m.meetingNumber ? ` (${m.meetingNumber})` : ""}
                    </span>
                    <span className="text-xs whitespace-nowrap ml-4">
                      {new Date(m.scheduledAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Announcements</CardTitle>
            <Link href="/announcements" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {publishedAnnouncements.length === 0
              ? "No announcements yet."
              : publishedAnnouncements.map((a) => (
                  <div key={a.id} className="py-1">
                    <span className="font-medium">{a.title}</span>
                    {a.authorName && (
                      <span className="ml-2 text-xs">by {a.authorName}</span>
                    )}
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Membership Overview</CardTitle>
            <Link href="/members" className="text-xs text-primary hover:underline">
              Details
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold">{activeMembers}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{pendingMembers}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {totalMembers - activeMembers - pendingMembers}
                </p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Finance Summary</CardTitle>
            <Link href="/finance/reports" className="text-xs text-primary hover:underline">
              Reports
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Collected this month</span>
                <span className="font-medium">₦{Number(financeStats.collectedThisMonth).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Collected this year</span>
                <span className="font-medium">₦{Number(financeStats.collectedThisYear).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending payments</span>
                <span className="font-medium">{financeStats.pendingPaymentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Collection rate</span>
                <span className="font-medium">{financeStats.collectionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
