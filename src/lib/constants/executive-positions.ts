import { PERMISSION_TIER_KEYS, type PermissionTierKey } from "@/lib/constants/roles";

/**
 * Reference data for the starter set of `ExecutivePosition` rows a newly
 * provisioned association is seeded with (by the association-provisioning
 * service in Phase 3 — this file is config data, not something inserted by
 * `prisma/seed.ts` directly, since positions belong to a specific
 * Association and none exists yet at global-seed time).
 *
 * These are titles, not roles: an association can rename, remove, or add
 * to this list freely after provisioning (e.g. "Chief Whip", "Director of
 * Socials" — examples explicitly called out in the Phase 2 audit as things
 * this list must NOT hardcode as permanent system roles). `defaultTier`
 * only decides what permission tier a newly created position starts with;
 * it is not itself a constraint.
 */
export type DefaultExecutivePosition = {
  title: string;
  defaultTier: PermissionTierKey;
  order: number;
};

export const DEFAULT_EXECUTIVE_POSITIONS: DefaultExecutivePosition[] = [
  { title: "Chairman", defaultTier: PERMISSION_TIER_KEYS.ASSOCIATION_ADMIN, order: 1 },
  { title: "Vice Chairman", defaultTier: PERMISSION_TIER_KEYS.STAFF, order: 2 },
  { title: "Secretary", defaultTier: PERMISSION_TIER_KEYS.STAFF, order: 3 },
  { title: "Assistant Secretary", defaultTier: PERMISSION_TIER_KEYS.STAFF, order: 4 },
  { title: "Treasurer", defaultTier: PERMISSION_TIER_KEYS.STAFF, order: 5 },
  { title: "Financial Secretary", defaultTier: PERMISSION_TIER_KEYS.STAFF, order: 6 },
  { title: "Auditor", defaultTier: PERMISSION_TIER_KEYS.AUDITOR, order: 7 },
  { title: "Public Relations Officer", defaultTier: PERMISSION_TIER_KEYS.STAFF, order: 8 },
];
