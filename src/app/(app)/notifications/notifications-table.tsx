"use client";

import { useTransition, useState, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CheckCheck, Bell, Megaphone, Calendar, CreditCard, Gavel, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/server/services/notification-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NotificationListItem } from "@/server/services/notification-service";

interface NotificationsTableProps {
  notifications: NotificationListItem[];
  total: number;
  page: number;
  totalPages: number;
  associations: { associationId: string; associationName: string; roleName: string }[];
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  INFO: Info,
  PAYMENT: CreditCard,
  ANNOUNCEMENT: Megaphone,
  MEETING: Calendar,
  FINE: Gavel,
  SYSTEM: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  PAYMENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  ANNOUNCEMENT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  MEETING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  FINE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  SYSTEM: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationsTable({
  notifications,
  total,
  page,
  totalPages,
  associations,
}: NotificationsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filtered = useMemo(() => {
    if (!search) return notifications;
    const q = search.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q)
    );
  }, [notifications, search]);

  function handleMarkRead(notificationId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("notificationId", notificationId);
      await markNotificationAsReadAction(null, formData);
      router.refresh();
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsAsReadAction(null, new FormData());
      router.refresh();
    });
  }

  function buildUrl(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    return `${pathname}?${sp.toString()}`;
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {total} notification{total !== 1 ? "s" : ""}
          </span>
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <CheckCheck className="mr-1.5 size-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          defaultValue={searchParams?.get("type") ?? "ALL"}
          onChange={(e) => router.push(buildUrl({ type: e.target.value, page: "1" }))}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="ALL">All types</option>
          <option value="INFO">Info</option>
          <option value="PAYMENT">Payment</option>
          <option value="ANNOUNCEMENT">Announcement</option>
          <option value="MEETING">Meeting</option>
          <option value="FINE">Fine</option>
          <option value="SYSTEM">System</option>
        </select>

        {associations.length > 1 && (
          <select
            defaultValue={searchParams?.get("associationId") ?? "ALL"}
            onChange={(e) => router.push(buildUrl({ associationId: e.target.value, page: "1" }))}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="ALL">All associations</option>
            {associations.map((a) => (
              <option key={a.associationId} value={a.associationId}>
                {a.associationName}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium w-8"></th>
              <th className="px-4 py-3 text-left font-medium">Notification</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">When</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No notifications found.
                </td>
              </tr>
            ) : (
              filtered.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                return (
                  <tr
                    key={n.id}
                    className={cn(
                      "border-b last:border-b-0",
                      !n.isRead && "bg-muted/30"
                    )}
                  >
                    <td className="px-4 py-3">
                      {!n.isRead && (
                        <span className="block size-2 rounded-full bg-blue-500" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div>
                          <div
                            className={cn(
                              "font-medium",
                              !n.isRead && "text-foreground"
                            )}
                          >
                            {n.link ? (
                              <a href={n.link} className="hover:underline">
                                {n.title}
                              </a>
                            ) : (
                              n.title
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {n.body}
                          </div>
                          {n.associationName && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {n.associationName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[n.type] ?? ""}`}
                      >
                        {n.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {timeAgo(n.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!n.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkRead(n.id)}
                          disabled={isPending}
                          title="Mark as read"
                        >
                          <CheckCheck className="size-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(buildUrl({ page: String(page - 1) }))}
              >
                Previous
              </Button>
            )}
            {page < totalPages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(buildUrl({ page: String(page + 1) }))}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
