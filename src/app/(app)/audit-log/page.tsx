import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import {
  getAuditLogs,
  getAuditLogStats,
  getAuditActors,
  getAuditEntityTypes,
} from "@/server/services/audit-service";
import { AuditLogTable } from "./audit-log-table";
import { StatCard } from "@/components/app-shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Users, CalendarDays, TrendingUp } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Audit Log",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams?: {
    search?: string;
    action?: string;
    entityType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  };
}) {
  const context = await requirePermission(PERMISSIONS.AUDIT_LOG_VIEW);
  const associationId = context.membership.associationId;

  const page = Number(searchParams?.page) || 1;

  const [logsResult, stats, actors, entityTypes] = await Promise.all([
    getAuditLogs(associationId, {
      search: searchParams?.search,
      action: searchParams?.action,
      entityType: searchParams?.entityType,
      userId: searchParams?.userId,
      dateFrom: searchParams?.dateFrom,
      dateTo: searchParams?.dateTo,
      page,
      limit: 20,
    }),
    getAuditLogStats(associationId),
    getAuditActors(associationId),
    getAuditEntityTypes(associationId),
  ]);

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (searchParams?.search) params.set("search", searchParams.search);
    if (searchParams?.action) params.set("action", searchParams.action);
    if (searchParams?.entityType) params.set("entityType", searchParams.entityType);
    if (searchParams?.userId) params.set("userId", searchParams.userId);
    if (searchParams?.dateFrom) params.set("dateFrom", searchParams.dateFrom);
    if (searchParams?.dateTo) params.set("dateTo", searchParams.dateTo);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.delete("page");
    return `/audit-log?${params.toString()}`;
  };

  const uniqueActions = [...new Set(logsResult.logs.map((l) => l.action))].sort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Track all administrative actions and changes across the association.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Entries"
          value={stats.totalEntries}
          icon={Activity}
          emptyHint={stats.totalEntries === 0 ? "No entries yet" : undefined}
        />
        <StatCard label="Today" value={stats.entriesToday} icon={CalendarDays} />
        <StatCard label="This Week" value={stats.entriesThisWeek} icon={TrendingUp} />
        <StatCard label="Active Users" value={stats.uniqueUsers} icon={Users} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                name="search"
                placeholder="Search descriptions..."
                defaultValue={searchParams?.search}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entityType">Entity Type</Label>
              <select
                id="entityType"
                name="entityType"
                defaultValue={searchParams?.entityType}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All entities</option>
                {entityTypes.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="userId">User</Label>
              <select
                id="userId"
                name="userId"
                defaultValue={searchParams?.userId}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All users</option>
                {actors.map((a) => (
                  <option key={a.userId} value={a.userId}>
                    {a.userName ?? a.userId}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="action">Action</Label>
              <select
                id="action"
                name="action"
                defaultValue={searchParams?.action}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All actions</option>
                {uniqueActions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dateFrom">From</Label>
              <Input
                id="dateFrom"
                name="dateFrom"
                type="date"
                defaultValue={searchParams?.dateFrom}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dateTo">To</Label>
              <Input
                id="dateTo"
                name="dateTo"
                type="date"
                defaultValue={searchParams?.dateTo}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm">
                Apply Filters
              </Button>
              <Link href="/audit-log">
                <Button type="button" variant="outline" size="sm">
                  Clear
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <AuditLogTable logs={logsResult.logs} />

      {logsResult.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {logsResult.page} of {logsResult.totalPages} ({logsResult.total} entries)
          </p>
          <div className="flex gap-2">
            {logsResult.page > 1 && (
              <Link href={buildUrl({ page: String(logsResult.page - 1) })}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {logsResult.page < logsResult.totalPages && (
              <Link href={buildUrl({ page: String(logsResult.page + 1) })}>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
