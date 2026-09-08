import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventListItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
  isVirtual: boolean;
  virtualLink: string | null;
  capacity: number | null;
  status: string;
  branchName: string | null;
  createdByName: string | null;
  registeredCount: number;
  createdAt: Date;
};

export type EventDetail = EventListItem & {
  branchId: string | null;
  createdById: string | null;
  coverImageUrl: string | null;
  requiresPayment: boolean;
  paymentCategoryId: string | null;
  registrations: EventRegistrationListItem[];
};

export type EventRegistrationListItem = {
  id: string;
  membershipId: string;
  memberName: string;
  membershipNumber: string;
  status: string;
  registeredAt: Date;
};

export type EventStats = {
  totalEvents: number;
  upcomingEvents: number;
  publishedEvents: number;
  draftEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalRegistrations: number;
};

export type UpcomingEvent = {
  id: string;
  title: string;
  startAt: Date;
  location: string | null;
  isVirtual: boolean;
  status: string;
  registeredCount: number;
  capacity: number | null;
};

// ---------------------------------------------------------------------------
// Queries — Events
// ---------------------------------------------------------------------------

export async function getEvents(
  associationId: string,
  opts?: {
    search?: string;
    status?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ events: EventListItem[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const where: Prisma.EventWhereInput = { associationId };

  if (opts?.search) {
    where.OR = [
      { title: { contains: opts.search, mode: "insensitive" } },
      { description: { contains: opts.search, mode: "insensitive" } },
      { location: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  if (opts?.status && opts.status !== "ALL") {
    where.status = opts.status as "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  }

  const sortField = opts?.sort === "title" ? "title" : opts?.sort === "createdAt" ? "createdAt" : "startAt";
  const sortOrder = opts?.order === "asc" ? "asc" : "desc";
  const page = opts?.page ?? 1;
  const pageSize = opts?.limit ?? 20;
  const skip = (page - 1) * pageSize;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: pageSize,
      include: {
        branch: { select: { name: true } },
        createdBy: { select: { name: true } },
        _count: { select: { registrations: { where: { status: { in: ["REGISTERED", "ATTENDED"] } } } } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startAt: e.startAt,
      endAt: e.endAt,
      location: e.location,
      isVirtual: e.isVirtual,
      virtualLink: e.virtualLink,
      capacity: e.capacity,
      status: e.status,
      branchName: e.branch?.name ?? null,
      createdByName: e.createdBy?.name ?? null,
      registeredCount: e._count.registrations,
      createdAt: e.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getEvent(
  associationId: string,
  eventId: string
): Promise<EventDetail | null> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, associationId },
    include: {
      branch: { select: { name: true } },
      createdBy: { select: { name: true } },
      registrations: {
        orderBy: { registeredAt: "asc" },
        include: {
          membership: { select: { fullName: true, membershipNumber: true } },
        },
      },
      _count: { select: { registrations: { where: { status: { in: ["REGISTERED", "ATTENDED"] } } } } },
    },
  });

  if (!event) return null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt,
    location: event.location,
    isVirtual: event.isVirtual,
    virtualLink: event.virtualLink,
    capacity: event.capacity,
    status: event.status,
    branchName: event.branch?.name ?? null,
    createdByName: event.createdBy?.name ?? null,
    registeredCount: event._count.registrations,
    createdAt: event.createdAt,
    branchId: event.branchId,
    createdById: event.createdById,
    coverImageUrl: event.coverImageUrl,
    requiresPayment: event.requiresPayment,
    paymentCategoryId: event.paymentCategoryId,
    registrations: event.registrations.map((r) => ({
      id: r.id,
      membershipId: r.membershipId,
      memberName: r.membership.fullName,
      membershipNumber: r.membership.membershipNumber,
      status: r.status,
      registeredAt: r.registeredAt,
    })),
  };
}

export async function getEventStats(associationId: string): Promise<EventStats> {
  const [totalEvents, statusCounts, totalRegistrations] = await Promise.all([
    prisma.event.count({ where: { associationId } }),
    prisma.event.groupBy({
      by: ["status"],
      where: { associationId },
      _count: true,
    }),
    prisma.eventRegistration.count({
      where: { associationId, status: { in: ["REGISTERED", "ATTENDED"] } },
    }),
  ]);

  const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));

  return {
    totalEvents,
    upcomingEvents: counts["PUBLISHED"] ?? 0,
    publishedEvents: counts["PUBLISHED"] ?? 0,
    draftEvents: counts["DRAFT"] ?? 0,
    completedEvents: counts["COMPLETED"] ?? 0,
    cancelledEvents: counts["CANCELLED"] ?? 0,
    totalRegistrations,
  };
}

export async function getUpcomingEvents(
  associationId: string,
  limit?: number
): Promise<UpcomingEvent[]> {
  const events = await prisma.event.findMany({
    where: {
      associationId,
      status: "PUBLISHED",
      startAt: { gte: new Date() },
    },
    orderBy: { startAt: "asc" },
    take: limit ?? 5,
    include: {
      _count: { select: { registrations: { where: { status: { in: ["REGISTERED", "ATTENDED"] } } } } },
    },
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    startAt: e.startAt,
    location: e.location,
    isVirtual: e.isVirtual,
    status: e.status,
    registeredCount: e._count.registrations,
    capacity: e.capacity,
  }));
}

// ---------------------------------------------------------------------------
// Queries — Registrations
// ---------------------------------------------------------------------------

export async function getEventRegistrations(
  associationId: string,
  eventId: string,
  opts?: { status?: string }
): Promise<EventRegistrationListItem[]> {
  const where: Prisma.EventRegistrationWhereInput = { associationId, eventId };

  if (opts?.status && opts.status !== "ALL") {
    where.status = opts.status as "REGISTERED" | "WAITLISTED" | "CANCELLED" | "ATTENDED";
  }

  const registrations = await prisma.eventRegistration.findMany({
    where,
    orderBy: { registeredAt: "asc" },
    include: {
      membership: { select: { fullName: true, membershipNumber: true } },
    },
  });

  return registrations.map((r) => ({
    id: r.id,
    membershipId: r.membershipId,
    memberName: r.membership.fullName,
    membershipNumber: r.membership.membershipNumber,
    status: r.status,
    registeredAt: r.registeredAt,
  }));
}

// ---------------------------------------------------------------------------
// Mutations — Events
// ---------------------------------------------------------------------------

export async function createEvent(
  associationId: string,
  data: {
    title: string;
    description?: string | null;
    startAt: Date;
    endAt?: Date | null;
    location?: string | null;
    isVirtual?: boolean;
    virtualLink?: string | null;
    capacity?: number | null;
    branchId?: string | null;
    createdById?: string | null;
  }
): Promise<string | { error: string }> {
  if (data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, associationId },
    });
    if (!branch) return { error: "Branch not found." };
  }

  const event = await prisma.event.create({
    data: {
      associationId,
      title: data.title,
      description: data.description ?? null,
      startAt: data.startAt,
      endAt: data.endAt ?? null,
      location: data.location ?? null,
      isVirtual: data.isVirtual ?? false,
      virtualLink: data.virtualLink ?? null,
      capacity: data.capacity ?? null,
      branchId: data.branchId ?? null,
      createdById: data.createdById ?? null,
      status: "DRAFT",
    },
    select: { id: true },
  });

  return event.id;
}

export async function updateEvent(
  associationId: string,
  eventId: string,
  data: {
    title?: string;
    description?: string | null;
    startAt?: Date;
    endAt?: Date | null;
    location?: string | null;
    isVirtual?: boolean;
    virtualLink?: string | null;
    capacity?: number | null;
    branchId?: string | null;
  }
): Promise<boolean | { error: string }> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, associationId },
  });

  if (!event) return false;

  if (data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, associationId },
    });
    if (!branch) return { error: "Branch not found." };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.startAt !== undefined && { startAt: data.startAt }),
      ...(data.endAt !== undefined && { endAt: data.endAt ?? null }),
      ...(data.location !== undefined && { location: data.location || null }),
      ...(data.isVirtual !== undefined && { isVirtual: data.isVirtual }),
      ...(data.virtualLink !== undefined && { virtualLink: data.virtualLink || null }),
      ...(data.capacity !== undefined && { capacity: data.capacity ?? null }),
      ...(data.branchId !== undefined && { branchId: data.branchId || null }),
    },
  });

  return true;
}

export async function updateEventStatus(
  associationId: string,
  eventId: string,
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED"
): Promise<boolean> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, associationId },
  });

  if (!event) return false;

  await prisma.event.update({
    where: { id: eventId },
    data: { status },
  });

  return true;
}

// ---------------------------------------------------------------------------
// Mutations — Registrations
// ---------------------------------------------------------------------------

export async function registerForEvent(
  associationId: string,
  eventId: string,
  membershipId: string
): Promise<string | { error: string }> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, associationId },
    include: {
      _count: { select: { registrations: { where: { status: { in: ["REGISTERED", "WAITLISTED"] } } } } },
    },
  });

  if (!event) return { error: "Event not found." };
  if (event.status !== "PUBLISHED") return { error: "Event is not open for registration." };

  const member = await prisma.membership.findFirst({
    where: { id: membershipId, associationId, status: "ACTIVE" },
  });
  if (!member) return { error: "Member not found." };

  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_membershipId: { eventId, membershipId } },
  });

  if (existing) {
    if (existing.status === "CANCELLED") {
      const isFull = event.capacity !== null && event._count.registrations >= event.capacity;
      const newStatus = isFull ? "WAITLISTED" : "REGISTERED";
      await prisma.eventRegistration.update({
        where: { id: existing.id },
        data: { status: newStatus as "REGISTERED" | "WAITLISTED" },
      });
      return existing.id;
    }
    return { error: "Already registered for this event." };
  }

  const isFull = event.capacity !== null && event._count.registrations >= event.capacity;
  const registrationStatus = isFull ? "WAITLISTED" : "REGISTERED";

  const registration = await prisma.eventRegistration.create({
    data: {
      associationId,
      eventId,
      membershipId,
      status: registrationStatus as "REGISTERED" | "WAITLISTED",
    },
    select: { id: true },
  });

  return registration.id;
}

export async function cancelRegistration(
  associationId: string,
  registrationId: string
): Promise<boolean | { error: string }> {
  const registration = await prisma.eventRegistration.findFirst({
    where: { id: registrationId, associationId },
    include: { event: true },
  });

  if (!registration) return false;
  if (registration.status === "CANCELLED" || registration.status === "ATTENDED") {
    return { error: "Cannot cancel this registration." };
  }

  await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { status: "CANCELLED" },
  });

  if (registration.event.capacity !== null) {
    const waitlisted = await prisma.eventRegistration.findFirst({
      where: {
        eventId: registration.eventId,
        status: "WAITLISTED",
      },
      orderBy: { registeredAt: "asc" },
    });

    if (waitlisted) {
      await prisma.eventRegistration.update({
        where: { id: waitlisted.id },
        data: { status: "REGISTERED" },
      });
    }
  }

  return true;
}

export async function checkInAttendee(
  associationId: string,
  registrationId: string
): Promise<boolean | { error: string }> {
  const registration = await prisma.eventRegistration.findFirst({
    where: { id: registrationId, associationId },
  });

  if (!registration) return false;
  if (registration.status !== "REGISTERED") {
    return { error: "Only registered attendees can be checked in." };
  }

  await prisma.eventRegistration.update({
    where: { id: registrationId },
    data: { status: "ATTENDED" },
  });

  return true;
}
