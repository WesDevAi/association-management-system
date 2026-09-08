import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnnouncementListItem = {
  id: string;
  title: string;
  body: string;
  audience: string;
  isPinned: boolean;
  status: string;
  publishedAt: Date | null;
  expiresAt: Date | null;
  authorName: string | null;
  branchName: string | null;
  createdAt: Date;
};

export type AnnouncementDetail = AnnouncementListItem & {
  branchId: string | null;
  authorId: string | null;
};

export type AnnouncementStats = {
  total: number;
  published: number;
  draft: number;
  archived: number;
  pinned: number;
};

export type PublishedAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  isPinned: boolean;
  publishedAt: Date | null;
  authorName: string | null;
};

// ---------------------------------------------------------------------------
// Queries — Announcements
// ---------------------------------------------------------------------------

export async function getAnnouncements(
  associationId: string,
  opts?: {
    search?: string;
    status?: string;
    audience?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ announcements: AnnouncementListItem[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const where: Prisma.AnnouncementWhereInput = { associationId };

  if (opts?.search) {
    where.OR = [
      { title: { contains: opts.search, mode: "insensitive" } },
      { body: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  if (opts?.status && opts.status !== "ALL") {
    where.status = opts.status as "DRAFT" | "PUBLISHED" | "ARCHIVED";
  }

  if (opts?.audience && opts.audience !== "ALL") {
    where.audience = opts.audience as "ALL_MEMBERS" | "EXECUTIVES_ONLY" | "BRANCH_ONLY";
  }

  const sortField = opts?.sort === "publishedAt" ? "publishedAt" : opts?.sort === "title" ? "title" : "createdAt";
  const sortOrder = opts?.order === "asc" ? "asc" : "desc";
  const page = opts?.page ?? 1;
  const pageSize = opts?.limit ?? 20;
  const skip = (page - 1) * pageSize;

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { [sortField]: sortOrder }],
      skip,
      take: pageSize,
      include: {
        author: { select: { name: true } },
        branch: { select: { name: true } },
      },
    }),
    prisma.announcement.count({ where }),
  ]);

  return {
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      audience: a.audience,
      isPinned: a.isPinned,
      status: a.status,
      publishedAt: a.publishedAt,
      expiresAt: a.expiresAt,
      authorName: a.author?.name ?? null,
      branchName: a.branch?.name ?? null,
      createdAt: a.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAnnouncement(
  associationId: string,
  announcementId: string
): Promise<AnnouncementDetail | null> {
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, associationId },
    include: {
      author: { select: { name: true } },
      branch: { select: { name: true } },
    },
  });

  if (!announcement) return null;

  return {
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    audience: announcement.audience,
    isPinned: announcement.isPinned,
    status: announcement.status,
    publishedAt: announcement.publishedAt,
    expiresAt: announcement.expiresAt,
    authorName: announcement.author?.name ?? null,
    branchName: announcement.branch?.name ?? null,
    createdAt: announcement.createdAt,
    branchId: announcement.branchId,
    authorId: announcement.authorId,
  };
}

export async function getAnnouncementStats(associationId: string): Promise<AnnouncementStats> {
  const [total, statusCounts, pinnedCount] = await Promise.all([
    prisma.announcement.count({ where: { associationId } }),
    prisma.announcement.groupBy({
      by: ["status"],
      where: { associationId },
      _count: true,
    }),
    prisma.announcement.count({
      where: { associationId, isPinned: true },
    }),
  ]);

  const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));

  return {
    total,
    published: counts["PUBLISHED"] ?? 0,
    draft: counts["DRAFT"] ?? 0,
    archived: counts["ARCHIVED"] ?? 0,
    pinned: pinnedCount,
  };
}

export async function getPublishedAnnouncements(
  associationId: string,
  limit?: number
): Promise<PublishedAnnouncement[]> {
  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    where: {
      associationId,
      status: "PUBLISHED",
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ],
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: limit ?? 5,
    include: {
      author: { select: { name: true } },
    },
  });

  return announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    audience: a.audience,
    isPinned: a.isPinned,
    publishedAt: a.publishedAt,
    authorName: a.author?.name ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Mutations — Announcements
// ---------------------------------------------------------------------------

export async function createAnnouncement(
  associationId: string,
  data: {
    title: string;
    body: string;
    audience: string;
    branchId?: string | null;
    isPinned?: boolean;
    expiresAt?: Date | null;
    authorId?: string | null;
  }
): Promise<string | { error: string }> {
  if (data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, associationId },
    });
    if (!branch) return { error: "Branch not found." };
  }

  if (data.audience === "BRANCH_ONLY" && !data.branchId) {
    return { error: "Branch is required for branch-only announcements." };
  }

  const announcement = await prisma.announcement.create({
    data: {
      associationId,
      title: data.title,
      body: data.body,
      audience: data.audience as "ALL_MEMBERS" | "EXECUTIVES_ONLY" | "BRANCH_ONLY",
      branchId: data.branchId ?? null,
      isPinned: data.isPinned ?? false,
      expiresAt: data.expiresAt ?? null,
      authorId: data.authorId ?? null,
      status: "DRAFT",
    },
    select: { id: true },
  });

  return announcement.id;
}

export async function updateAnnouncement(
  associationId: string,
  announcementId: string,
  data: {
    title?: string;
    body?: string;
    audience?: string;
    branchId?: string | null;
    isPinned?: boolean;
    expiresAt?: Date | null;
  }
): Promise<boolean | { error: string }> {
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, associationId },
  });

  if (!announcement) return false;

  if (data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, associationId },
    });
    if (!branch) return { error: "Branch not found." };
  }

  if (data.audience === "BRANCH_ONLY" && !data.branchId && !announcement.branchId) {
    return { error: "Branch is required for branch-only announcements." };
  }

  await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.body !== undefined && { body: data.body }),
      ...(data.audience !== undefined && { audience: data.audience as "ALL_MEMBERS" | "EXECUTIVES_ONLY" | "BRANCH_ONLY" }),
      ...(data.branchId !== undefined && { branchId: data.branchId || null }),
      ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ?? null }),
    },
  });

  return true;
}

export async function updateAnnouncementStatus(
  associationId: string,
  announcementId: string,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
): Promise<boolean> {
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, associationId },
  });

  if (!announcement) return false;

  const updateData: Prisma.AnnouncementUpdateInput = { status };

  if (status === "PUBLISHED" && !announcement.publishedAt) {
    updateData.publishedAt = new Date();
  }

  await prisma.announcement.update({
    where: { id: announcementId },
    data: updateData,
  });

  return true;
}

export async function toggleAnnouncementPin(
  associationId: string,
  announcementId: string
): Promise<boolean> {
  const announcement = await prisma.announcement.findFirst({
    where: { id: announcementId, associationId },
  });

  if (!announcement) return false;

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { isPinned: !announcement.isPinned },
  });

  return true;
}
