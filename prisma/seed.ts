/**
 * Seeds reference data required for the RBAC system to function:
 *   - the global Permission catalog
 *   - the platform-wide SUPER_ADMIN role
 *   - the default permission matrix for the small set of PERMISSION TIERS
 *     every new association gets seeded with (see src/lib/constants/roles.ts)
 *
 * Corrected per the Phase 2 audit / Phase 2.1 approved fix: leadership
 * titles (Chairman, Treasurer, Secretary, etc.) are NOT seeded here as
 * separate permission-bearing roles. They belong to the `ExecutivePosition`
 * table instead — a per-association, freely-nameable list (see
 * src/lib/constants/executive-positions.ts for the starter titles an
 * association-provisioning service should create) — each optionally linked
 * to one of the permission tiers below via `ExecutivePosition.roleId`.
 *
 * This is config/reference data, not fake demo content — no associations,
 * users, or members are created here. Per-association Role rows (and
 * starter ExecutivePosition rows) are created when an association is
 * provisioned (Phase 3+), reusing DEFAULT_ROLE_PERMISSIONS from this file
 * as the starting permission matrix.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, type PermissionKey } from "../src/lib/constants/permissions";
import { PERMISSION_TIER_KEYS } from "../src/lib/constants/roles";
import { DEFAULT_ROLE_PERMISSIONS } from "../src/lib/constants/default-role-permissions";

const prisma = new PrismaClient();

const PERMISSION_CATALOG: { key: PermissionKey; category: string; description: string }[] = [
  { key: PERMISSIONS.MEMBERS_VIEW, category: "Members", description: "View member records" },
  { key: PERMISSIONS.MEMBERS_MANAGE, category: "Members", description: "Create, edit, and remove members" },
  { key: PERMISSIONS.APPLICATIONS_REVIEW, category: "Members", description: "Approve or reject membership applications" },
  { key: PERMISSIONS.EXECUTIVES_MANAGE, category: "Executives", description: "Appoint or remove executives" },
  { key: PERMISSIONS.ROLES_MANAGE, category: "Executives", description: "Manage roles and permission assignments" },
  { key: PERMISSIONS.BRANCHES_MANAGE, category: "Branches", description: "Create and manage branches" },
  { key: PERMISSIONS.MEETINGS_MANAGE, category: "Meetings", description: "Schedule and manage meetings" },
  { key: PERMISSIONS.ATTENDANCE_RECORD, category: "Meetings", description: "Record meeting attendance" },
  { key: PERMISSIONS.FINANCE_VIEW, category: "Finance", description: "View financial records and reports" },
  { key: PERMISSIONS.FINANCE_MANAGE, category: "Finance", description: "Manage income, expenses, and financial settings" },
  { key: PERMISSIONS.PAYMENTS_RECORD, category: "Finance", description: "Record member payments" },
  { key: PERMISSIONS.FINES_MANAGE, category: "Finance", description: "Issue, waive, or cancel fines" },
  { key: PERMISSIONS.EVENTS_MANAGE, category: "Events", description: "Create and manage events" },
  { key: PERMISSIONS.ANNOUNCEMENTS_MANAGE, category: "Communication", description: "Publish announcements" },
  { key: PERMISSIONS.DOCUMENTS_VIEW, category: "Documents", description: "View shared documents" },
  { key: PERMISSIONS.DOCUMENTS_MANAGE, category: "Documents", description: "Upload and manage documents" },
  { key: PERMISSIONS.REPORTS_VIEW, category: "Reports", description: "View association reports" },
  { key: PERMISSIONS.ASSOCIATION_SETTINGS_MANAGE, category: "Administration", description: "Manage association settings" },
  { key: PERMISSIONS.AUDIT_LOG_VIEW, category: "Administration", description: "View the audit log" },
  { key: PERMISSIONS.PLATFORM_MANAGE_ASSOCIATIONS, category: "Platform", description: "Create and manage associations across the platform" },
];

async function main() {
  console.log("Seeding permission catalog...");
  for (const permission of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { category: permission.category, description: permission.description },
      create: permission,
    });
  }

  console.log("Seeding platform-wide SUPER_ADMIN role...");
  // Note: Role's @@unique([associationId, key]) can't be used in a Prisma
  // upsert `where` when associationId is null (Postgres treats each NULL as
  // distinct, so a compound-unique lookup on a null column isn't reliable).
  // Find-or-create explicitly instead.
  let superAdminRole = await prisma.role.findFirst({
    where: { associationId: null, key: PERMISSION_TIER_KEYS.SUPER_ADMIN },
  });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        associationId: null,
        key: PERMISSION_TIER_KEYS.SUPER_ADMIN,
        name: "Super Admin",
        description: "Platform-wide administrator with access across all associations.",
        isSystem: true,
      },
    });
  }

  await grantPermissions(superAdminRole.id, DEFAULT_ROLE_PERMISSIONS[PERMISSION_TIER_KEYS.SUPER_ADMIN]);

  console.log(
    "Done. Per-association permission-tier roles (Association Admin, Staff, " +
      "Auditor, Member) and starter leadership positions (Chairman, Treasurer, " +
      "etc. — see src/lib/constants/executive-positions.ts) are created when " +
      "each association is provisioned, using DEFAULT_ROLE_PERMISSIONS from " +
      "this file as the starting permission matrix for the tiers."
  );
}

async function grantPermissions(roleId: string, keys: PermissionKey[]) {
  // Explicit return-shape annotation rather than relying on inference from
  // `prisma.permission.findMany`'s generated return type. This keeps the
  // callback below fully typed (no implicit `any`) regardless of whether
  // `prisma generate` has been run yet, and stays structurally compatible
  // with the real generated `Permission[]` type once it has (Permission
  // always includes `id: string`, so the real return type satisfies this
  // narrower annotation).
  const permissions: { id: string }[] = await prisma.permission.findMany({
    where: { key: { in: keys } },
  });
  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
