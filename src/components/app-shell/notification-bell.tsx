"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Megaphone, Calendar, CreditCard, Gavel, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/server/services/notification-actions";
import { Button } from "@/components/ui/button";
import type { NotificationListItem } from "@/server/services/notification-service";

interface NotificationBellProps {
  userId: string;
  associationId: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  INFO: Info,
  PAYMENT: CreditCard,
  ANNOUNCEMENT: Megaphone,
  MEETING: Calendar,
  FINE: Gavel,
  SYSTEM: Bell,
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

export function NotificationBell({ associationId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  function fetchNotifications() {
    fetch(`/api/notifications/recent?associationId=${associationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
        if (typeof data.unreadCount === "number") setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [associationId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleMarkRead(notificationId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("notificationId", notificationId);
      await markNotificationAsReadAction(null, formData);
      fetchNotifications();
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsAsReadAction(null, new FormData());
      fetchNotifications();
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-medium">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="h-7 text-xs"
                >
                  <CheckCheck className="mr-1 size-3" />
                  Mark all read
                </Button>
              )}
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-muted-foreground hover:underline"
              >
                View all
              </Link>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0",
                      !n.isRead && "bg-muted/30"
                    )}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight line-clamp-1">
                          {n.link ? (
                            <a
                              href={n.link}
                              onClick={() => {
                                setIsOpen(false);
                                if (!n.isRead) handleMarkRead(n.id);
                              }}
                              className="hover:underline"
                            >
                              {n.title}
                            </a>
                          ) : (
                            n.title
                          )}
                        </p>
                        {!n.isRead && (
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {n.body}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
