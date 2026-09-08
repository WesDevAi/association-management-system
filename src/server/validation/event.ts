import { z } from "zod";

// ---------------------------------------------------------------------------
// Event schemas
// ---------------------------------------------------------------------------

export const createEventSchema = z
  .object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    startAt: z.string().min(1, "Start date/time is required"),
    endAt: z.string().optional().or(z.literal("")),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    isVirtual: z.coerce.boolean().default(false),
    virtualLink: z.string().trim().max(500).optional().or(z.literal("")),
    capacity: z.coerce.number().int().min(1).optional().or(z.literal("")),
    branchId: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.endAt && data.startAt) {
        return new Date(data.endAt) >= new Date(data.startAt);
      }
      return true;
    },
    { message: "End date must be on or after start date", path: ["endAt"] }
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    eventId: z.string().min(1, "Event ID is required"),
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    startAt: z.string().min(1).optional(),
    endAt: z.string().optional().or(z.literal("")),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    isVirtual: z.coerce.boolean().optional(),
    virtualLink: z.string().trim().max(500).optional().or(z.literal("")),
    capacity: z.coerce.number().int().min(1).optional().or(z.literal("")),
    branchId: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.endAt && data.startAt) {
        return new Date(data.endAt) >= new Date(data.startAt);
      }
      return true;
    },
    { message: "End date must be on or after start date", path: ["endAt"] }
  );

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const eventStatusSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]),
});

export type EventStatusInput = z.infer<typeof eventStatusSchema>;

export const eventFilterSchema = z.object({
  search: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]).optional().or(z.literal("")),
  sort: z.enum(["startAt", "createdAt", "title"]).optional().or(z.literal("")),
  order: z.enum(["asc", "desc"]).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).optional().or(z.literal("")),
});

export type EventFilterInput = z.infer<typeof eventFilterSchema>;

// ---------------------------------------------------------------------------
// Event Registration schemas
// ---------------------------------------------------------------------------

export const registerForEventSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
});

export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;

export const cancelRegistrationSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required"),
});

export type CancelRegistrationInput = z.infer<typeof cancelRegistrationSchema>;

export const checkInAttendeeSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required"),
});

export type CheckInAttendeeInput = z.infer<typeof checkInAttendeeSchema>;

// ---------------------------------------------------------------------------
// Announcement schemas
// ---------------------------------------------------------------------------

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  body: z.string().trim().min(1, "Body is required").max(5000),
  audience: z.enum(["ALL_MEMBERS", "EXECUTIVES_ONLY", "BRANCH_ONLY"]),
  branchId: z.string().optional().or(z.literal("")),
  isPinned: z.coerce.boolean().default(false),
  expiresAt: z.string().optional().or(z.literal("")),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = z.object({
  announcementId: z.string().min(1, "Announcement ID is required"),
  title: z.string().trim().min(2).max(200).optional(),
  body: z.string().trim().min(1).max(5000).optional(),
  audience: z.enum(["ALL_MEMBERS", "EXECUTIVES_ONLY", "BRANCH_ONLY"]).optional(),
  branchId: z.string().optional().or(z.literal("")),
  isPinned: z.coerce.boolean().optional(),
  expiresAt: z.string().optional().or(z.literal("")),
});

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export const announcementStatusSchema = z.object({
  announcementId: z.string().min(1, "Announcement ID is required"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export type AnnouncementStatusInput = z.infer<typeof announcementStatusSchema>;

export const announcementFilterSchema = z.object({
  search: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"]).optional().or(z.literal("")),
  audience: z.enum(["ALL", "ALL_MEMBERS", "EXECUTIVES_ONLY", "BRANCH_ONLY"]).optional().or(z.literal("")),
  sort: z.enum(["createdAt", "publishedAt", "title"]).optional().or(z.literal("")),
  order: z.enum(["asc", "desc"]).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).optional().or(z.literal("")),
});

export type AnnouncementFilterInput = z.infer<typeof announcementFilterSchema>;
