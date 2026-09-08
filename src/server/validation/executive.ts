import { z } from "zod";

// ---------------------------------------------------------------------------
// Position schemas
// ---------------------------------------------------------------------------

export const createPositionSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
  maxOccupants: z.coerce.number().int().min(1).max(50).default(1),
  termLengthMonths: z.coerce.number().int().min(1).max(120).optional().or(z.literal("")),
  branchId: z.string().optional(),
  roleId: z.string().optional(),
});

export type CreatePositionInput = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = z.object({
  positionId: z.string().min(1),
  title: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).optional(),
  maxOccupants: z.coerce.number().int().min(1).max(50).optional(),
  termLengthMonths: z.coerce.number().int().min(1).max(120).optional().or(z.literal("")),
  branchId: z.string().optional().or(z.literal("")),
  roleId: z.string().optional().or(z.literal("")),
});

export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;

// ---------------------------------------------------------------------------
// Appointment schemas
// ---------------------------------------------------------------------------

export const createAppointmentSchema = z
  .object({
    executivePositionId: z.string().min(1, "Position is required"),
    membershipId: z.string().min(1, "Member is required"),
    appointmentType: z.enum(["ELECTED", "APPOINTED", "ACTING", "INTERIM"]),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: "End date must be on or after start date", path: ["endDate"] }
  );

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentSchema = z
  .object({
    appointmentId: z.string().min(1),
    appointmentType: z.enum(["ELECTED", "APPOINTED", "ACTING", "INTERIM"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    { message: "End date must be on or after start date", path: ["endDate"] }
  );

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

export const endAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(["COMPLETED", "REMOVED", "RESIGNED", "SUSPENDED"]),
  endDate: z.string().optional(),
});

export type EndAppointmentInput = z.infer<typeof endAppointmentSchema>;
