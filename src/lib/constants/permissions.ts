/**
 * Canonical permission keys. These map 1:1 to rows seeded in the
 * `Permission` table and are attached to roles via `RolePermission`.
 *
 * Authorization checks anywhere in the app should call
 * `hasPermission(membership, PERMISSIONS.MEMBERS_MANAGE)` (see
 * src/server/permissions) rather than checking role names directly. This
 * keeps role → permission mapping data-driven and editable per association
 * without code changes.
 */
export const PERMISSIONS = {
  // Members
  MEMBERS_VIEW: "members.view",
  MEMBERS_MANAGE: "members.manage",
  APPLICATIONS_REVIEW: "applications.review",

  // Executives & roles
  EXECUTIVES_MANAGE: "executives.manage",
  ROLES_MANAGE: "roles.manage",

  // Branches
  BRANCHES_MANAGE: "branches.manage",

  // Meetings & attendance
  MEETINGS_MANAGE: "meetings.manage",
  ATTENDANCE_RECORD: "attendance.record",

  // Finance
  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE: "finance.manage",
  PAYMENTS_RECORD: "payments.record",
  FINES_MANAGE: "fines.manage",
  EXPENSES_VIEW: "expenses.view",
  EXPENSES_MANAGE: "expenses.manage",
  FINANCE_REPORTS_VIEW: "finance_reports.view",

  // Events & announcements
  EVENTS_MANAGE: "events.manage",
  ANNOUNCEMENTS_MANAGE: "announcements.manage",

  // Documents
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_MANAGE: "documents.manage",

  // Reports & admin
  REPORTS_VIEW: "reports.view",
  ASSOCIATION_SETTINGS_MANAGE: "association.settings.manage",
  AUDIT_LOG_VIEW: "audit_log.view",

  // Platform (Super Admin only)
  PLATFORM_MANAGE_ASSOCIATIONS: "platform.associations.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
