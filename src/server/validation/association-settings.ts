import { z } from "zod";

// ---------------------------------------------------------------------------
// Association settings schemas
// ---------------------------------------------------------------------------

export const updateAssociationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150).optional(),
  type: z
    .enum(["CLUB", "UNION", "PROFESSIONAL_BODY", "ALUMNI", "COMMUNITY", "COOPERATIVE", "RELIGIOUS", "OTHER"])
    .optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().trim().max(100).optional(),
  contactEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  currency: z.string().trim().length(3).optional(),
  logoUrl: z.string().trim().max(2000).url("Must be a valid URL").optional().or(z.literal("")),
});

export type UpdateAssociationInput = z.infer<typeof updateAssociationSchema>;
