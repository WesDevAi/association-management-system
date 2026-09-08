import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationListItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  readAt: Date | null;
  link: string | null;
  createdAt: Date;
  associationName: string | null;
};

export type NotificationStats = {
  total: number;
  unread: number;
};

// ---------------------------------------------------------------------------
// Queries — all strictly scoped to a single user
// ---------------------------------------------------------------------------

export async function getNotifications(
  userId: string,
  opts?: {
    type?: string;
    associationId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  notifications: NotificationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const where: Prisma.NotificationWhereInput = { userId };

  if (opts?.type && opts.type !== "ALL") {
    where.type = opts.type as "INFO" | "PAYMENT" | "ANNOUNCEMENT" | "MEETING" | "FINE" | "SYSTEM";
  }

  if (opts?.associationId && opts.associationId !== "ALL") {
    where.associationId = opts.associationId;
  }

  if (opts?.search) {
    where.OR = [
      { title: { contains: opts.search, mode: "insensitive" } },
      { body: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  const page = opts?.page ?? 1;
  const pageSize = opts?.limit ?? 20;
  const skip = (page - 1) * pageSize;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        association: { select: { name: true } },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      isRead: n.isRead,
      readAt: n.readAt,
      link: n.link,
      createdAt: n.createdAt,
      associationName: n.association?.name ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUnreadCount(
  userId: string,
  associationId?: string
): Promise<number> {
  const where: Prisma.NotificationWhereInput = {
    userId,
    isRead: false,
  };

  if (associationId) {
    where.associationId = associationId;
  }

  return prisma.notification.count({ where });
}

export async function getNotificationStats(
  userId: string
): Promise<NotificationStats> {
  const [total, unread] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { total, unread };
}

export async function getRecentNotifications(
  userId: string,
  limit = 5
): Promise<NotificationListItem[]> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      association: { select: { name: true } },
    },
  });

  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type,
    isRead: n.isRead,
    readAt: n.readAt,
    link: n.link,
    createdAt: n.createdAt,
    associationName: n.association?.name ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) return false;

  if (notification.isRead) return true;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });

  return true;
}

export async function markAllAsRead(
  userId: string,
  associationId?: string
): Promise<number> {
  const where: Prisma.NotificationWhereInput = {
    userId,
    isRead: false,
  };

  if (associationId) {
    where.associationId = associationId;
  }

  const result = await prisma.notification.updateMany({
    where,
    data: { isRead: true, readAt: new Date() },
  });

  return result.count;
}

// ---------------------------------------------------------------------------
// Notification creation — used by system events
// ---------------------------------------------------------------------------

export type CreateNotificationInput = {
  userId: string;
  associationId?: string;
  title: string;
  body: string;
  type?: "INFO" | "PAYMENT" | "ANNOUNCEMENT" | "MEETING" | "FINE" | "SYSTEM";
  link?: string;
};

/**
 * Creates a single notification. Strictly user-scoped: the userId must
 * point to an existing User with a linked membership in the association.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<string> {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      associationId: input.associationId ?? null,
      title: input.title,
      body: input.body,
      type: input.type ?? "INFO",
      link: input.link ?? null,
    },
    select: { id: true },
  });

  return notification.id;
}

/**
 * Creates notifications for multiple users in one call. Used for
 * broadcasting to association members. Skips users without linked accounts.
 */
export async function createNotifications(
  inputs: CreateNotificationInput[]
): Promise<number> {
  if (inputs.length === 0) return 0;

  const result = await prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      associationId: input.associationId ?? null,
      title: input.title,
      body: input.body,
      type: input.type ?? "INFO",
      link: input.link ?? null,
    })),
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Sends a notification to all active members of an association who have a
 * linked user account. Respects optional branch filtering.
 */
export async function notifyAssociationMembers(opts: {
  associationId: string;
  branchId?: string | null;
  title: string;
  body: string;
  type?: "INFO" | "PAYMENT" | "ANNOUNCEMENT" | "MEETING" | "FINE" | "SYSTEM";
  link?: string;
  excludeUserIds?: string[];
}): Promise<number> {
  const where: Prisma.MembershipWhereInput = {
    associationId: opts.associationId,
    status: "ACTIVE",
    userId: { not: null },
  };

  if (opts.branchId) {
    where.branchId = opts.branchId;
  }

  const memberships = await prisma.membership.findMany({
    where,
    select: { userId: true },
  });

  const userIds = memberships
    .map((m) => m.userId)
    .filter((id): id is string => id !== null);

  const filtered = opts.excludeUserIds
    ? userIds.filter((id) => !opts.excludeUserIds!.includes(id))
    : userIds;

  if (filtered.length === 0) return 0;

  return createNotifications(
    filtered.map((userId) => ({
      userId,
      associationId: opts.associationId,
      title: opts.title,
      body: opts.body,
      type: opts.type ?? "INFO",
      link: opts.link,
    }))
  );
}

/**
 * Sends a notification to a single member (by membershipId). Returns
 * silently if the membership has no linked user account.
 */
export async function notifyMember(opts: {
  membershipId: string;
  associationId: string;
  title: string;
  body: string;
  type?: "INFO" | "PAYMENT" | "ANNOUNCEMENT" | "MEETING" | "FINE" | "SYSTEM";
  link?: string;
}): Promise<string | null> {
  const membership = await prisma.membership.findFirst({
    where: { id: opts.membershipId, associationId: opts.associationId },
    select: { userId: true },
  });

  if (!membership?.userId) return null;

  return createNotification({
    userId: membership.userId,
    associationId: opts.associationId,
    title: opts.title,
    body: opts.body,
    type: opts.type,
    link: opts.link,
  });
}
