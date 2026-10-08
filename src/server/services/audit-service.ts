import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditLogEntry = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
};

export type AuditLogStats = {
  totalEntries: number;
  entriesToday: number;
  entriesThisWeek: number;
  uniqueUsers: number;
  topActions: { action: string; count: number }[];
};

export type AuditAction =
  | "member.created"
  | "member.updated"
  | "member.role_changed"
  | "member.deactivated"
  | "member.reactivated"
  | "member.approved"
  | "member.rejected"
  | "application.approved"
  | "application.rejected"
  | "payment.recorded"
  | "payment_category.created"
  | "payment_category.updated"
  | "payment_category.deactivated"
  | "payment_category.activated"
  | "fine.issued"
  | "fine.waived"
  | "fine.cancelled"
  | "expense.recorded"
  | "expense.updated"
  | "expense_category.created"
  | "expense_category.updated"
  | "event.created"
  | "event.updated"
  | "event.published"
  | "event.cancelled"
  | "event.completed"
  | "event.registered"
  | "event.registration_cancelled"
  | "event.checked_in"
  | "meeting.created"
  | "meeting.updated"
  | "meeting.cancelled"
  | "meeting.status_changed"
  | "attendance.recorded"
  | "announcement.created"
  | "announcement.updated"
  | "announcement.published"
  | "announcement.archived"
  | "announcement.deleted"
  | "announcement.pinned"
  | "document.created"
  | "document.updated"
  | "document.deleted"
  | "branch.created"
  | "branch.updated"
  | "branch.activated"
  | "branch.deactivated"
  | "role.created"
  | "role.updated"
  | "role.deleted"
  | "user.role_changed"
  | "user.status_changed"
  | "user.linked"
  | "user.unlinked"
  | "user.invited"
  | "settings.updated";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function describeAction(action: AuditAction, metadata?: Record<string, unknown>): string {
  const entityLabel = (metadata?.entityName as string) || (metadata?.entityId as string) || "";
  const suffix = entityLabel ? ` "${entityLabel}"` : "";

  const descriptions: Record<string, string> = {
    "member.created": `Member${suffix} created`,
    "member.updated": `Member${suffix} updated`,
    "member.role_changed": `Member role changed for${suffix}`,
    "member.deactivated": `Member${suffix} deactivated`,
    "member.reactivated": `Member${suffix} reactivated`,
    "member.approved": `Application${suffix} approved`,
    "member.rejected": `Application${suffix} rejected`,
    "application.approved": `Application${suffix} approved`,
    "application.rejected": `Application${suffix} rejected`,
    "payment.recorded": `Payment${suffix} recorded`,
    "payment_category.created": `Payment category${suffix} created`,
    "payment_category.updated": `Payment category${suffix} updated`,
    "payment_category.deactivated": `Payment category${suffix} deactivated`,
    "payment_category.activated": `Payment category${suffix} activated`,
    "fine.issued": `Fine${suffix} issued`,
    "fine.waived": `Fine${suffix} waived`,
    "fine.cancelled": `Fine${suffix} cancelled`,
    "expense.recorded": `Expense${suffix} recorded`,
    "expense.updated": `Expense${suffix} updated`,
    "expense_category.created": `Expense category${suffix} created`,
    "expense_category.updated": `Expense category${suffix} updated`,
    "event.created": `Event${suffix} created`,
    "event.updated": `Event${suffix} updated`,
    "event.published": `Event${suffix} published`,
    "event.cancelled": `Event${suffix} cancelled`,
    "event.completed": `Event${suffix} completed`,
    "event.registered": `Event registration${suffix}`,
    "event.registration_cancelled": `Event registration${suffix} cancelled`,
    "event.checked_in": `Event check-in${suffix}`,
    "meeting.created": `Meeting${suffix} created`,
    "meeting.updated": `Meeting${suffix} updated`,
    "meeting.cancelled": `Meeting${suffix} cancelled`,
    "meeting.status_changed": `Meeting status changed for${suffix}`,
    "attendance.recorded": `Attendance recorded for${suffix}`,
    "announcement.created": `Announcement${suffix} created`,
    "announcement.updated": `Announcement${suffix} updated`,
    "announcement.published": `Announcement${suffix} published`,
    "announcement.archived": `Announcement${suffix} archived`,
    "announcement.deleted": `Announcement${suffix} deleted`,
    "announcement.pinned": `Announcement${suffix} pin toggled`,
    "document.created": `Document${suffix} uploaded`,
    "document.updated": `Document${suffix} updated`,
    "document.deleted": `Document${suffix} deleted`,
    "branch.created": `Branch${suffix} created`,
    "branch.updated": `Branch${suffix} updated`,
    "branch.activated": `Branch${suffix} activated`,
    "branch.deactivated": `Branch${suffix} deactivated`,
    "role.created": `Role${suffix} created`,
    "role.updated": `Role${suffix} updated`,
    "role.deleted": `Role${suffix} deleted`,
    "user.role_changed": `User role changed for${suffix}`,
    "user.status_changed": `User status changed for${suffix}`,
    "user.linked": `User account linked to${suffix}`,
    "user.unlinked": `User account unlinked from${suffix}`,
    "user.invited": `Account invitation sent for${suffix}`,
    "settings.updated": "Association settings updated",
  };

  return descriptions[action] ?? action;
}

// ---------------------------------------------------------------------------
// Create audit log entry
// ---------------------------------------------------------------------------

export async function logAudit(opts: {
  associationId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}): Promise<void> {
  const description = describeAction(opts.action, opts.metadata);

  const metadataWithDesc = {
    ...(opts.metadata ?? {}),
    _description: description,
  };

  await prisma.auditLog.create({
    data: {
      associationId: opts.associationId,
      userId: opts.userId ?? null,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ?? null,
      metadata: metadataWithDesc as unknown as Prisma.InputJsonValue,
      ipAddress: opts.ipAddress ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Query audit logs
// ---------------------------------------------------------------------------

export async function getAuditLogs(
  associationId: string,
  opts?: {
    search?: string;
    action?: string;
    entityType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  logs: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const where: Prisma.AuditLogWhereInput = { associationId };

  if (opts?.search) {
    where.OR = [
      { action: { contains: opts.search, mode: "insensitive" } },
      { entityType: { contains: opts.search, mode: "insensitive" } },
      { entityId: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  if (opts?.action && opts.action !== "ALL") {
    where.action = opts.action;
  }

  if (opts?.entityType && opts.entityType !== "ALL") {
    where.entityType = opts.entityType;
  }

  if (opts?.userId && opts.userId !== "ALL") {
    where.userId = opts.userId;
  }

  if (opts?.dateFrom || opts?.dateTo) {
    where.createdAt = {};
    if (opts.dateFrom) where.createdAt.gte = new Date(opts.dateFrom);
    if (opts.dateTo) {
      const to = new Date(opts.dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  const page = opts?.page ?? 1;
  const pageSize = opts?.limit ?? 20;
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((l) => {
      const meta = (l.metadata as Record<string, unknown>) ?? null;
      const description = (meta?._description as string) ?? describeAction(l.action as AuditAction, meta ?? undefined);
      return {
        id: l.id,
        userId: l.userId,
        userName: l.user?.name ?? null,
        userEmail: l.user?.email ?? null,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        description,
        metadata: meta,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      };
    }),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Audit log stats
// ---------------------------------------------------------------------------

export async function getAuditLogStats(associationId: string): Promise<AuditLogStats> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [totalEntries, entriesToday, entriesThisWeek, uniqueUsersResult, topActions] =
    await Promise.all([
      prisma.auditLog.count({ where: { associationId } }),
      prisma.auditLog.count({
        where: { associationId, createdAt: { gte: startOfDay } },
      }),
      prisma.auditLog.count({
        where: { associationId, createdAt: { gte: startOfWeek } },
      }),
      prisma.auditLog.groupBy({
        by: ["userId"],
        where: { associationId, userId: { not: null } },
      }),
      prisma.auditLog.groupBy({
        by: ["action"],
        where: { associationId },
        _count: true,
        orderBy: { _count: { action: "desc" } },
        take: 5,
      }),
    ]);

  return {
    totalEntries,
    entriesToday,
    entriesThisWeek,
    uniqueUsers: uniqueUsersResult.length,
    topActions: topActions.map((a) => ({ action: a.action, count: a._count })),
  };
}

// ---------------------------------------------------------------------------
// Get recent activity for dashboard
// ---------------------------------------------------------------------------

export type RecentActivity = {
  id: string;
  description: string;
  userName: string | null;
  action: string;
  entityType: string;
  createdAt: Date;
};

export async function getRecentActivity(
  associationId: string,
  limit = 10
): Promise<RecentActivity[]> {
  const logs = await prisma.auditLog.findMany({
    where: { associationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true } },
    },
  });

  return logs.map((l) => {
    const meta = (l.metadata as Record<string, unknown>) ?? null;
    const description = (meta?._description as string) ?? describeAction(l.action as AuditAction, meta ?? undefined);
    return {
      id: l.id,
      description,
      userName: l.user?.name ?? "System",
      action: l.action,
      entityType: l.entityType,
      createdAt: l.createdAt,
    };
  });
}

// ---------------------------------------------------------------------------
// Get distinct users who have audit entries (for filter dropdown)
// ---------------------------------------------------------------------------

export async function getAuditActors(
  associationId: string
): Promise<{ userId: string; userName: string | null }[]> {
  const actors = await prisma.auditLog.groupBy({
    by: ["userId"],
    where: { associationId, userId: { not: null } },
    _count: true,
    orderBy: { _count: { userId: "desc" } },
  });

  if (actors.length === 0) return [];

  const userIds = actors.map((a) => a.userId).filter((id): id is string => id !== null);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return actors
    .filter((a) => a.userId !== null)
    .map((a) => ({
      userId: a.userId!,
      userName: userMap.get(a.userId!) ?? null,
    }));
}

// ---------------------------------------------------------------------------
// Get distinct entity types (for filter dropdown)
// ---------------------------------------------------------------------------

export async function getAuditEntityTypes(
  associationId: string
): Promise<string[]> {
  const result = await prisma.auditLog.groupBy({
    by: ["entityType"],
    where: { associationId },
    orderBy: { entityType: "asc" },
  });

  return result.map((r) => r.entityType);
}
