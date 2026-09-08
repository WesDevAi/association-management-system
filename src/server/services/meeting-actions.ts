"use server";

import { createMeetingSchema } from "@/server/validation/meeting";
import {
  createMeeting,
  updateMeeting,
  updateMeetingStatus,
  cancelMeeting,
  recordAttendance,
  recordBulkAttendance,
} from "@/server/services/meeting-service";
import { logAudit } from "@/server/services/audit-service";

export type MeetingActionState = { error: string } | { success: string } | null;

export async function createMeetingAction(
  formData: FormData
): Promise<MeetingActionState> {
  const associationId = formData.get("associationId") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const meetingNumber = (formData.get("meetingNumber") as string) || null;
  const agenda = (formData.get("agenda") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const type = formData.get("type") as string;
  const scheduledAt = formData.get("scheduledAt") as string;
  const endedAt = (formData.get("endedAt") as string) || null;
  const location = (formData.get("location") as string) || null;
  const isVirtual = formData.get("isVirtual") === "on";
  const meetingLink = (formData.get("meetingLink") as string) || null;
  const branchId = (formData.get("branchId") as string) || null;

  const parsed = createMeetingSchema.safeParse({
    title,
    description,
    meetingNumber,
    agenda,
    notes,
    type,
    scheduledAt,
    endedAt,
    location,
    isVirtual,
    meetingLink,
    branchId,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const data = {
    ...parsed.data,
    scheduledAt: new Date(parsed.data.scheduledAt),
    endedAt: parsed.data.endedAt ? new Date(parsed.data.endedAt) : null,
    description: parsed.data.description ?? null,
    meetingNumber: parsed.data.meetingNumber ?? null,
    agenda: parsed.data.agenda ?? null,
    notes: parsed.data.notes ?? null,
    location: parsed.data.location ?? null,
    meetingLink: parsed.data.meetingLink ?? null,
    branchId: parsed.data.branchId ?? null,
  };

  try {
    await createMeeting(associationId, data);

    await logAudit({
      associationId,
      action: "meeting.created",
      entityType: "meeting",
      metadata: { entityName: parsed.data.title },
    });

    return { success: "Meeting scheduled successfully." };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return { error: "A meeting with this reference number already exists." };
    }
    return { error: "Failed to create meeting. Please try again." };
  }
}

export async function updateMeetingAction(
  formData: FormData
): Promise<MeetingActionState> {
  const meetingId = formData.get("meetingId") as string;
  const associationId = formData.get("associationId") as string;
  const title = (formData.get("title") as string) || undefined;
  const description = (formData.get("description") as string) || undefined;
  const meetingNumber = (formData.get("meetingNumber") as string) || undefined;
  const agenda = (formData.get("agenda") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;
  const type = (formData.get("type") as string) || undefined;
  const location = (formData.get("location") as string) || undefined;
  const meetingLink = (formData.get("meetingLink") as string) || undefined;

  if (!meetingId || !associationId) {
    return { error: "Missing required fields." };
  }

  const result = await updateMeeting(associationId, meetingId, {
    title,
    description,
    meetingNumber,
    agenda,
    notes,
    type,
    location,
    meetingLink,
  });

  if (!result) {
    return { error: "Meeting not found." };
  }

  await logAudit({
    associationId,
    action: "meeting.updated",
    entityType: "meeting",
    entityId: meetingId,
  });

  return { success: "Meeting updated successfully." };
}

export async function cancelMeetingAction(
  formData: FormData
): Promise<MeetingActionState> {
  const meetingId = formData.get("meetingId") as string;
  const associationId = formData.get("associationId") as string;

  if (!meetingId || !associationId) {
    return { error: "Missing required fields." };
  }

  const cancelled = await cancelMeeting(associationId, meetingId);
  if (!cancelled) {
    return { error: "Meeting not found." };
  }

  await logAudit({
    associationId,
    action: "meeting.cancelled",
    entityType: "meeting",
    entityId: meetingId,
  });

  return { success: "Meeting cancelled." };
}

export async function updateMeetingStatusAction(
  formData: FormData
): Promise<MeetingActionState> {
  const meetingId = formData.get("meetingId") as string;
  const associationId = formData.get("associationId") as string;
  const status = formData.get("status") as string;
  const endedAt = formData.get("endedAt") as string | undefined;

  if (!meetingId || !associationId || !status) {
    return { error: "Missing required fields." };
  }

  const result = await updateMeetingStatus(
    associationId,
    meetingId,
    status,
    endedAt ? new Date(endedAt) : undefined
  );
  if (!result) {
    return { error: "Meeting not found." };
  }

  await logAudit({
    associationId,
    action: "meeting.status_changed",
    entityType: "meeting",
    entityId: meetingId,
    metadata: { status },
  });

  return { success: "Meeting status updated." };
}

export async function recordAttendanceAction(
  formData: FormData
): Promise<MeetingActionState> {
  const meetingId = formData.get("meetingId") as string;
  const associationId = formData.get("associationId") as string;
  const membershipId = formData.get("membershipId") as string;
  const status = formData.get("status") as string;
  const remarks = (formData.get("remarks") as string) || undefined;

  if (!meetingId || !associationId || !membershipId || !status) {
    return { error: "Missing required fields." };
  }

  const result = await recordAttendance(
    associationId,
    meetingId,
    membershipId,
    status,
    remarks
  );
  if (!result) {
    return { error: "Meeting not found. Attendance could not be recorded." };
  }

  await logAudit({
    associationId,
    action: "attendance.recorded",
    entityType: "attendance",
    metadata: { meetingId, membershipId, status },
  });

  return { success: "Attendance recorded." };
}

export async function recordBulkAttendanceAction(
  formData: FormData
): Promise<MeetingActionState> {
  const meetingId = formData.get("meetingId") as string;
  const associationId = formData.get("associationId") as string;
  const attendanceJson = formData.get("attendance") as string;

  if (!meetingId || !associationId || !attendanceJson) {
    return { error: "Missing required fields." };
  }

  let entries: { membershipId: string; status: string; remarks?: string }[];
  try {
    entries = JSON.parse(attendanceJson);
  } catch {
    return { error: "Invalid attendance data." };
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return { error: "No attendance entries provided." };
  }

  const result = await recordBulkAttendance(associationId, meetingId, entries);
  if (!result) {
    return { error: "Meeting not found. Attendance could not be recorded." };
  }

  await logAudit({
    associationId,
    action: "attendance.recorded",
    entityType: "attendance",
    metadata: { meetingId, count: entries.length },
  });

  return { success: "Attendance saved successfully." };
}
