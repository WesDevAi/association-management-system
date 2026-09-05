import { z } from "zod";

/**
 * Pure, unit-testable slug normalization — no I/O. Uniqueness itself must
 * still be checked against the database (see association-service.ts); this
 * function only guarantees the *shape* is safe and URL-friendly:
 * lowercase, ASCII letters/digits/hyphens only, no leading/trailing/
 * duplicate hyphens.
 */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const slugField = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .transform((val) => normalizeSlug(val))
  .refine((val) => val.length >= 3, "Slug must be at least 3 characters after normalization")
  .refine((val) => /^[a-z0-9-]+$/.test(val), "Slug can only contain lowercase letters, numbers, and hyphens");

export const createAssociationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  slug: slugField,
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  contactEmail: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  currency: z.string().trim().length(3).default("NGN"),
});

export type CreateAssociationInput = z.infer<typeof createAssociationSchema>;
