/**
 * Shared, hand-written TypeScript types that aren't already covered by
 * generated Prisma types (`import type { Association, Membership } from
 * "@prisma/client"`). Add view-model / DTO / API-response shapes here as
 * features are built in later phases.
 */

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
