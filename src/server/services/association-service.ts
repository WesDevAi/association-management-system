import "server-only";
import { prisma } from "@/lib/prisma";
import { PERMISSION_TIER_KEYS, ASSOCIATION_SCOPED_PERMISSION_TIER_KEYS } from "@/lib/constants/roles";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/constants/default-role-permissions";
import { DEFAULT_EXECUTIVE_POSITIONS } from "@/lib/constants/executive-positions";
import type { CreateAssociationInput } from "@/server/validation/association";

export type CreateAssociationParams = CreateAssociationInput & {
  /** The authenticated user creating the association — becomes its first admin. */
  creatingUserId: string;
  creatingUserName: string;
  creatingUserEmail: string;
};

export type CreateAssociationResult =
  | { success: true; associationId: string }
  | { success: false; error: string };

/**
 * Creates an association and everything required for its creator to
 * immediately administer it, all in one transaction (Phase 3.19): if any
 * step fails, nothing is created — there is no such thing as an
 * association that exists without its initial admin membership.
 *
 * Order within the transaction:
 *   1. Association
 *   2. The 4 association-scoped permission-tier Roles (+ their granted
 *      permissions), reusing DEFAULT_ROLE_PERMISSIONS — the same matrix
 *      prisma/seed.ts uses for the platform-wide Super Admin role.
 *   3. Starter ExecutivePosition rows (Chairman, Treasurer, etc.), each
 *      linked to a sensible default tier — freely renameable/removable by
 *      the association afterwards; this is seed convenience, not a fixed
 *      requirement.
 *   4. A Membership for the creating user, on the ASSOCIATION_ADMIN tier.
 */
export async function createAssociationWithAdmin(
  params: CreateAssociationParams
): Promise<CreateAssociationResult> {
  const existingSlug = await prisma.association.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (existingSlug) {
    return { success: false, error: "That association URL is already taken." };
  }

  try {
    const associationId = await prisma.$transaction(async (tx) => {
      const association = await tx.association.create({
        data: {
          name: params.name,
          slug: params.slug,
          description: params.description || null,
          contactEmail: params.contactEmail || null,
          contactPhone: params.contactPhone || null,
          address: params.address || null,
          state: params.state || null,
          currency: params.currency || "NGN",
        },
      });

      // 2. Seed the 4 association-scoped permission tiers.
      const roleIdByTier = new Map<string, string>();
      for (const tier of ASSOCIATION_SCOPED_PERMISSION_TIER_KEYS) {
        const role = await tx.role.create({
          data: {
            associationId: association.id,
            key: tier,
            name: tierDisplayName(tier),
            isSystem: true,
          },
        });
        roleIdByTier.set(tier, role.id);

        const permissionKeys = DEFAULT_ROLE_PERMISSIONS[tier];
        // Explicit annotation (see tenant.ts / seed.ts for the same
        // pattern): keeps the callback below fully typed regardless of
        // whether `prisma generate` has run yet.
        const permissions: { id: string }[] = await tx.permission.findMany({
          where: { key: { in: permissionKeys } },
          select: { id: true },
        });
        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
          skipDuplicates: true,
        });
      }

      // 3. Starter leadership positions (freely editable afterwards).
      for (const position of DEFAULT_EXECUTIVE_POSITIONS) {
        await tx.executivePosition.create({
          data: {
            associationId: association.id,
            title: position.title,
            order: position.order,
            roleId: roleIdByTier.get(position.defaultTier) ?? null,
          },
        });
      }

      // 4. The creating user becomes the first, ACTIVE, admin-tier member.
      const adminRoleId = roleIdByTier.get(PERMISSION_TIER_KEYS.ASSOCIATION_ADMIN);
      if (!adminRoleId) {
        // Should be unreachable — ASSOCIATION_ADMIN is always in
        // ASSOCIATION_SCOPED_PERMISSION_TIER_KEYS — but never assume a Map
        // lookup silently regardless.
        throw new Error("Association Admin role was not created.");
      }

      await tx.membership.create({
        data: {
          associationId: association.id,
          userId: params.creatingUserId,
          roleId: adminRoleId,
          membershipNumber: "0001",
          fullName: params.creatingUserName,
          email: params.creatingUserEmail,
          status: "ACTIVE",
        },
      });

      return association.id;
    });

    return { success: true, associationId };
  } catch (error) {
    console.error("Failed to create association:", error);
    return { success: false, error: "Something went wrong creating the association. Please try again." };
  }
}

function tierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    [PERMISSION_TIER_KEYS.ASSOCIATION_ADMIN]: "Association Admin",
    [PERMISSION_TIER_KEYS.STAFF]: "Staff",
    [PERMISSION_TIER_KEYS.AUDITOR]: "Auditor",
    [PERMISSION_TIER_KEYS.MEMBER]: "Member",
  };
  return names[tier] ?? tier;
}
