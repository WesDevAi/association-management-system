import { z } from "zod";

/**
 * Server-side validation for authentication. These run again on the
 * server regardless of any client-side React Hook Form validation using
 * the same schema — client validation is a UX convenience only.
 */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
