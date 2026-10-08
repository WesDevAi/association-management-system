import Link from "next/link";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getEvents, getEventStats } from "@/server/services/event-service";
import { EventsTable } from "./events-table";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/app-shell/stat-card";
import { CalendarDays, Users, CheckCircle, XCircle } from "lucide-react";

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await requirePermission(PERMISSIONS.EVENTS_MANAGE);
  const associationId = context.membership.associationId;

  const [result, stats] = await Promise.all([
    getEvents(associationId, {
      search: resolvedSearchParams?.search,
      status: resolvedSearchParams?.status,
      sort: resolvedSearchParams?.sort,
      order: resolvedSearchParams?.order,
      page: resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page) : 1,
    }),
    getEventStats(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground">
            Manage association events, registrations, and attendance.
          </p>
        </div>
        <Link href="/events/new">
          <Button>Create Event</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Events"
          value={stats.totalEvents}
          icon={CalendarDays}
          emptyHint={stats.totalEvents === 0 ? "No events yet" : undefined}
        />
        <StatCard
          label="Published"
          value={stats.publishedEvents}
          icon={CheckCircle}
        />
        <StatCard
          label="Drafts"
          value={stats.draftEvents}
          icon={XCircle}
        />
        <StatCard
          label="Total Registrations"
          value={stats.totalRegistrations}
          icon={Users}
        />
      </div>

      <EventsTable
        events={result.events}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
