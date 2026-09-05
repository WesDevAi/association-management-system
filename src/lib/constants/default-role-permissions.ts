import { PERMISSIONS, type PermissionKey } from "@/lib/constants/permissions";
import { PERMISSION_TIER_KEYS, type PermissionTierKey } from "@/lib/constants/roles";

/**
 * Default permission grants for each PERMISSION TIER (not per leadership
 * title — Role = permission tier, ExecutivePosition = leadership title;
 * see src/server/db/tenant.md). STAFF is the broad day-to-day operational
 * tier most executive positions (Secretary, Treasurer, PRO, etc.) should
 * carry; finer per-position tuning, if an association ever needs it, is
 * done via a custom Role (isSystem: false) scoped to that association —
 * the schema already supports that without any change here.
 *
 * Used by both `prisma/seed.ts` (seeds the platform-wide SUPER_ADMIN role)
 * and `src/server/services/association-service.ts` (seeds the 4
 * association-scoped tiers when a new association is provisioned).
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<PermissionTierKey, PermissionKey[]> = {
  [PERMISSION_TIER_KEYS.SUPER_ADMIN]: Object.values(PERMISSIONS) as PermissionKey[],
  [PERMISSION_TIER_KEYS.ASSOCIATION_ADMIN]: Object.values(PERMISSIONS).filter(
    (p) => p !== PERMISSIONS.PLATFORM_MANAGE_ASSOCIATIONS
  ) as PermissionKey[],
  [PERMISSION_TIER_KEYS.STAFF]: [
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.MEMBERS_MANAGE,
    PERMISSIONS.APPLICATIONS_REVIEW,
    PERMISSIONS.BRANCHES_MANAGE,
    PERMISSIONS.MEETINGS_MANAGE,
    PERMISSIONS.ATTENDANCE_RECORD,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.PAYMENTS_RECORD,
    PERMISSIONS.FINES_MANAGE,
    PERMISSIONS.EVENTS_MANAGE,
    PERMISSIONS.ANNOUNCEMENTS_MANAGE,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [PERMISSION_TIER_KEYS.AUDITOR]: [
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
  ],
  [PERMISSION_TIER_KEYS.MEMBER]: [
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};
