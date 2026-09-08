"use server";

import {
  createEventSchema,
  updateEventSchema,
  eventStatusSchema,
  registerForEventSchema,
  cancelRegistrationSchema,
  checkInAttendeeSchema,
} from "@/server/validation/event";
import {
  createEvent,
  updateEvent,
  updateEventStatus,
  registerForEvent,
  cancelRegistration,
  checkInAttendee,
} from "@/server/services/event-service";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { notifyAssociationMembers, notifyMember } from "@/server/services/notification-service";
import { prisma } from "@/lib/prisma";

export type EventActionState = { error: string } | { success: string } | null;

// ---------------------------------------------------------------------------
// Event CRUD actions
// ---------------------------------------------------------------------------

export async function createEventAction(
  _prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const context = await requirePermission(PERMISSIONS.EVENTS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = createEventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    location: formData.get("location"),
    isVirtual: formData.get("isVirtual"),
    virtualLink: formData.get("virtualLink"),
    capacity: formData.get("capacity"),
    branchId: formData.get("branchId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createEvent(associationId, {
    title: parsed.data.title,
    description: parsed.data.description || null,
    startAt: new Date(parsed.data.startAt),
    endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
    location: parsed.data.location || null,
    isVirtual: parsed.data.isVirtual,
    virtualLink: parsed.data.virtualLink || null,
    capacity: parsed.data.capacity || null,
    branchId: parsed.data.branchId || null,
    createdById: context.user.id,
  });

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  return { success: "Event created successfully." };
}

export async function updateEventAction(
  _prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const context = await requirePermission(PERMISSIONS.EVENTS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updateEventSchema.safeParse({
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    description: formData.get("description"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
    location: formData.get("location"),
    isVirtual: formData.get("isVirtual"),
    virtualLink: formData.get("virtualLink"),
    capacity: formData.get("capacity"),
    branchId: formData.get("branchId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateEvent(associationId, parsed.data.eventId, {
    title: parsed.data.title,
    description: parsed.data.description,
    startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
    endAt: parsed.data.endAt !== undefined ? (parsed.data.endAt ? new Date(parsed.data.endAt) : null) : undefined,
    location: parsed.data.location,
    isVirtual: parsed.data.isVirtual,
    virtualLink: parsed.data.virtualLink,
    capacity: typeof parsed.data.capacity === "number" ? parsed.data.capacity : null,
    branchId: parsed.data.branchId,
  });

  if (!result) {
    return { error: "Event not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  return { success: "Event updated." };
}

export async function updateEventStatusAction(
  _prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const context = await requirePermission(PERMISSIONS.EVENTS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = eventStatusSchema.safeParse({
    eventId: formData.get("eventId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const updated = await updateEventStatus(associationId, parsed.data.eventId, parsed.data.status);
  if (!updated) return { error: "Event not found." };

  if (parsed.data.status === "PUBLISHED") {
    const event = await prisma.event.findUnique({
      where: { id: parsed.data.eventId },
      select: { title: true, branchId: true },
    });
    if (event) {
      await notifyAssociationMembers({
        associationId,
        branchId: event.branchId,
        title: "New Event Published",
        body: `A new event "${event.title}" has been published.`,
        type: "MEETING",
        link: `/events/${parsed.data.eventId}`,
      });
    }
  }

  return { success: `Event ${parsed.data.status.toLowerCase()}.` };
}

// ---------------------------------------------------------------------------
// Registration actions
// ---------------------------------------------------------------------------

export async function registerForEventAction(
  _prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const context = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
  const associationId = context.membership.associationId;

  const parsed = registerForEventSchema.safeParse({
    eventId: formData.get("eventId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const membershipId = formData.get("membershipId") as string;
  if (!membershipId) {
    return { error: "Member ID is required." };
  }

  const result = await registerForEvent(associationId, parsed.data.eventId, membershipId);

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await notifyMember({
    membershipId,
    associationId,
    title: "Event Registration Confirmed",
    body: `Your registration for the event has been confirmed.`,
    type: "MEETING",
    link: `/events/${parsed.data.eventId}`,
  });

  return { success: "Registration successful." };
}

export async function cancelRegistrationAction(
  _prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const context = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
  const associationId = context.membership.associationId;

  const parsed = cancelRegistrationSchema.safeParse({
    registrationId: formData.get("registrationId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await cancelRegistration(associationId, parsed.data.registrationId);

  if (!result) {
    return { error: "Registration not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { id: parsed.data.registrationId },
    select: { membershipId: true, eventId: true },
  });
  if (registration) {
    await notifyMember({
      membershipId: registration.membershipId,
      associationId,
      title: "Event Registration Cancelled",
      body: `Your event registration has been cancelled.`,
      type: "MEETING",
      link: `/events/${registration.eventId}`,
    });
  }

  return { success: "Registration cancelled." };
}

export async function checkInAttendeeAction(
  _prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const context = await requirePermission(PERMISSIONS.EVENTS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = checkInAttendeeSchema.safeParse({
    registrationId: formData.get("registrationId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await checkInAttendee(associationId, parsed.data.registrationId);

  if (!result) {
    return { error: "Registration not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  const reg = await prisma.eventRegistration.findUnique({
    where: { id: parsed.data.registrationId },
    select: { membershipId: true, eventId: true },
  });
  if (reg) {
    await notifyMember({
      membershipId: reg.membershipId,
      associationId,
      title: "Checked In to Event",
      body: `You have been checked in to the event.`,
      type: "MEETING",
      link: `/events/${reg.eventId}`,
    });
  }

  return { success: "Attendee checked in." };
}
