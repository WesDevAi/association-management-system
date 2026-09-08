import { z } from "zod";

export const meetingStatusFilterSchema = z.object({
  status: z.enum(["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
});

export type MeetingStatusFilter = z.infer<typeof meetingStatusFilterSchema>;

export const createMeetingSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  meetingNumber: z.string().trim().max(50).optional().or(z.literal("")),
  agenda: z.string().trim().max(5000).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  type: z.enum(["GENERAL", "EXECUTIVE", "BRANCH", "COMMITTEE", "EMERGENCY"]),
  scheduledAt: z.string().datetime({ offset: true }).refine((val) => new Date(val) > new Date(), "Meeting must be scheduled for a future time"),
  endedAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  location: z.string().trim().max(300).optional().or(z.literal("")),
  isVirtual: z.boolean().default(false),
  meetingLink: z.string().url().optional().or(z.literal("")),
  branchId: z.string().optional(),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

export const updateMeetingSchema = z.object({
  meetingId: z.string().min(1),
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  meetingNumber: z.string().trim().max(50).optional().or(z.literal("")),
  agenda: z.string().trim().max(5000).optional().or(z.literal("")),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),
  type: z.enum(["GENERAL", "EXECUTIVE", "BRANCH", "COMMITTEE", "EMERGENCY"]).optional(),
  status: z.enum(["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  endedAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  location: z.string().trim().max(300).optional().or(z.literal("")),
  meetingLink: z.string().url().optional().or(z.literal("")),
});

export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;

export const attendanceRecordSchema = z.object({
  meetingId: z.string().min(1),
  membershipId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "LATE"]),
  remarks: z.string().trim().max(500).optional().or(z.literal("")),
});

export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;

export const bulkAttendanceSchema = z.object({
  meetingId: z.string().min(1),
  attendance: z.array(
    z.object({
      membershipId: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "LATE"]),
      remarks: z.string().trim().max(500).optional().or(z.literal("")),
    })
  ),
});

export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
