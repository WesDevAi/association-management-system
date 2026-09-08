import { requireAuth } from "@/server/auth/session";
import { getNotifications, getNotificationStats } from "@/server/services/notification-service";
import { getUserAssociations } from "@/server/db/tenant";
import { NotificationsTable } from "./notifications-table";
import { StatCard } from "@/components/app-shell/stat-card";
import { Bell, BellOff, CheckCircle } from "lucide-react";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: {
    type?: string;
    associationId?: string;
    search?: string;
    page?: string;
  };
}) {
  const user = await requireAuth();

  const [result, stats, associations] = await Promise.all([
    getNotifications(user.id, {
      type: searchParams?.type,
      associationId: searchParams?.associationId,
      search: searchParams?.search,
      page: searchParams?.page ? parseInt(searchParams.page) : 1,
    }),
    getNotificationStats(user.id),
    getUserAssociations(user.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={Bell}
          emptyHint={stats.total === 0 ? "No notifications yet" : undefined}
        />
        <StatCard label="Unread" value={stats.unread} icon={BellOff} />
        <StatCard label="Read" value={stats.total - stats.unread} icon={CheckCircle} />
      </div>

      <NotificationsTable
        notifications={result.notifications}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        associations={associations}
      />
    </div>
  );
}
