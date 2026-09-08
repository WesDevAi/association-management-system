"use server";

import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementStatusSchema,
} from "@/server/validation/event";
import {
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  toggleAnnouncementPin,
  deleteAnnouncement,
} from "@/server/services/announcement-service";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";

export type AnnouncementActionState = { error: string } | { success: string } | null;

// ---------------------------------------------------------------------------
// Announcement CRUD actions
// ---------------------------------------------------------------------------

export async function createAnnouncementAction(
  _prevState: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const context = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = createAnnouncementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    audience: formData.get("audience"),
    branchId: formData.get("branchId"),
    isPinned: formData.get("isPinned"),
    expiresAt: formData.get("expiresAt"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createAnnouncement(associationId, {
    title: parsed.data.title,
    body: parsed.data.body,
    audience: parsed.data.audience,
    branchId: parsed.data.branchId || null,
    isPinned: parsed.data.isPinned,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    authorId: context.user.id,
  });

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  return { success: "Announcement created successfully." };
}

export async function updateAnnouncementAction(
  _prevState: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const context = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updateAnnouncementSchema.safeParse({
    announcementId: formData.get("announcementId"),
    title: formData.get("title"),
    body: formData.get("body"),
    audience: formData.get("audience"),
    branchId: formData.get("branchId"),
    isPinned: formData.get("isPinned"),
    expiresAt: formData.get("expiresAt"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateAnnouncement(associationId, parsed.data.announcementId, {
    title: parsed.data.title,
    body: parsed.data.body,
    audience: parsed.data.audience,
    branchId: parsed.data.branchId,
    isPinned: parsed.data.isPinned,
    expiresAt: parsed.data.expiresAt !== undefined
      ? (parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null)
      : undefined,
  });

  if (!result) {
    return { error: "Announcement not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  return { success: "Announcement updated." };
}

export async function updateAnnouncementStatusAction(
  _prevState: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const context = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = announcementStatusSchema.safeParse({
    announcementId: formData.get("announcementId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const updated = await updateAnnouncementStatus(
    associationId,
    parsed.data.announcementId,
    parsed.data.status
  );

  if (!updated) return { error: "Announcement not found." };

  return { success: `Announcement ${parsed.data.status.toLowerCase()}.` };
}

export async function toggleAnnouncementPinAction(
  formData: FormData
): Promise<AnnouncementActionState> {
  const context = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const announcementId = formData.get("announcementId") as string;
  if (!announcementId) return { error: "Missing announcement ID." };

  const toggled = await toggleAnnouncementPin(associationId, announcementId);
  if (!toggled) return { error: "Announcement not found." };

  return { success: "Pin status updated." };
}

export async function deleteAnnouncementAction(
  formData: FormData
): Promise<AnnouncementActionState> {
  const context = await requirePermission(PERMISSIONS.ANNOUNCEMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const announcementId = formData.get("announcementId") as string;
  if (!announcementId) return { error: "Missing announcement ID." };

  const deleted = await deleteAnnouncement(associationId, announcementId);
  if (!deleted) return { error: "Announcement not found." };

  return { success: "Announcement deleted." };
}
