"use server";

import { z } from "zod";
import {
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "@/server/services/notification-service";
import { requireAuth } from "@/server/auth/session";

export type NotificationActionState = { error: string } | { success: string } | null;

const markReadSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
});

export async function markNotificationAsReadAction(
  _prevState: NotificationActionState,
  formData: FormData
): Promise<NotificationActionState> {
  const user = await requireAuth();

  const parsed = markReadSchema.safeParse({
    notificationId: formData.get("notificationId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await markAsRead(user.id, parsed.data.notificationId);

  if (!result) {
    return { error: "Notification not found." };
  }

  return { success: "Marked as read." };
}

export async function markAllNotificationsAsReadAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: NotificationActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData
): Promise<NotificationActionState> {
  const user = await requireAuth();

  const count = await markAllAsRead(user.id);

  return { success: `${count} notification(s) marked as read.` };
}

export async function getUnreadCountAction(
  associationId?: string
): Promise<number> {
  const user = await requireAuth();
  return getUnreadCount(user.id, associationId);
}
