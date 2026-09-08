import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoleListItem = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  associationId: string | null;
  permissionCount: number;
  memberCount: number;
  executiveCount: number;
};

export type RoleDetail = RoleListItem & {
  permissions: { id: string; key: string; category: string; description: string | null }[];
};

export type PermissionCatalogItem = {
  id: string;
  key: string;
  category: string;
  description: string | null;
};

export type RoleStats = {
  totalRoles: number;
  systemRoles: number;
  customRoles: number;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getAssociationRoles(
  associationId: string,
  opts?: {
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  roles: RoleListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const where: Prisma.RoleWhereInput = {
    OR: [
      { associationId },
      { associationId: null },
    ],
  };

  if (opts?.search) {
    where.AND = [
      {
        OR: [
          { name: { contains: opts.search, mode: "insensitive" } },
          { key: { contains: opts.search, mode: "insensitive" } },
          { description: { contains: opts.search, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (opts?.type === "SYSTEM") {
    where.isSystem = true;
  } else if (opts?.type === "CUSTOM") {
    where.isSystem = false;
    where.associationId = associationId;
  }

  const page = opts?.page ?? 1;
  const pageSize = opts?.limit ?? 20;
  const skip = (page - 1) * pageSize;

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      skip,
      take: pageSize,
      include: {
        _count: {
          select: {
            rolePermissions: true,
            memberships: true,
            executivePositions: true,
          },
        },
      },
    }),
    prisma.role.count({ where }),
  ]);

  return {
    roles: roles.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      associationId: r.associationId,
      permissionCount: r._count.rolePermissions,
      memberCount: r._count.memberships,
      executiveCount: r._count.executivePositions,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getRoleDetail(
  associationId: string,
  roleId: string
): Promise<RoleDetail | null> {
  const role = await prisma.role.findFirst({
    where: {
      id: roleId,
      OR: [
        { associationId },
        { associationId: null },
      ],
    },
    include: {
      rolePermissions: {
        include: { permission: { select: { id: true, key: true, category: true, description: true } } },
      },
      _count: {
        select: {
          memberships: true,
          executivePositions: true,
        },
      },
    },
  });

  if (!role) return null;

  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    associationId: role.associationId,
    permissionCount: role.rolePermissions.length,
    memberCount: role._count.memberships,
    executiveCount: role._count.executivePositions,
    permissions: role.rolePermissions.map((rp) => rp.permission),
  };
}

export async function getRoleStats(associationId: string): Promise<RoleStats> {
  const [totalRoles, systemRoles, customRoles] = await Promise.all([
    prisma.role.count({
      where: { OR: [{ associationId }, { associationId: null }] },
    }),
    prisma.role.count({
      where: { isSystem: true, OR: [{ associationId }, { associationId: null }] },
    }),
    prisma.role.count({
      where: { isSystem: false, associationId },
    }),
  ]);

  return { totalRoles, systemRoles, customRoles };
}

export async function getPermissionCatalog(): Promise<PermissionCatalogItem[]> {
  return prisma.permission.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
    select: { id: true, key: true, category: true, description: true },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createRole(
  associationId: string,
  data: {
    name: string;
    description?: string | null;
    permissionIds: string[];
  }
): Promise<string | { error: string }> {
  const key = data.name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const existingKey = await prisma.role.findFirst({
    where: {
      OR: [
        { associationId, key },
        { associationId: null, key },
      ],
    },
  });

  if (existingKey) {
    return { error: "A role with a similar name already exists." };
  }

  const role = await prisma.role.create({
    data: {
      associationId,
      key,
      name: data.name,
      description: data.description || null,
      isSystem: false,
      rolePermissions: {
        create: data.permissionIds.map((permissionId) => ({
          permissionId,
        })),
      },
    },
    select: { id: true },
  });

  return role.id;
}

export async function updateRole(
  associationId: string,
  roleId: string,
  data: {
    name?: string;
    description?: string | null;
    permissionIds?: string[];
  }
): Promise<boolean | { error: string }> {
  const role = await prisma.role.findFirst({
    where: { id: roleId, associationId },
  });

  if (!role) return { error: "Role not found." };

  if (role.isSystem) {
    return { error: "Cannot edit a system role." };
  }

  if (role.associationId !== associationId) {
    return { error: "Cannot edit a role belonging to another association." };
  }

  const updateData: Prisma.RoleUpdateInput = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
    const newKey = data.name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const existingKey = await prisma.role.findFirst({
      where: {
        id: { not: roleId },
        OR: [
          { associationId, key: newKey },
          { associationId: null, key: newKey },
        ],
      },
    });

    if (existingKey) {
      return { error: "A role with a similar name already exists." };
    }

    updateData.key = newKey;
  }

  if (data.description !== undefined) {
    updateData.description = data.description || null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.role.update({ where: { id: roleId }, data: updateData });

    if (data.permissionIds !== undefined) {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.rolePermission.createMany({
        data: data.permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    }
  });

  return true;
}

export async function deleteRole(
  associationId: string,
  roleId: string
): Promise<boolean | { error: string }> {
  const role = await prisma.role.findFirst({
    where: { id: roleId },
    include: {
      _count: {
        select: {
          memberships: true,
          executivePositions: true,
        },
      },
    },
  });

  if (!role) return { error: "Role not found." };

  if (role.isSystem) {
    return { error: "Cannot delete a system role." };
  }

  if (role.associationId !== associationId) {
    return { error: "Cannot delete a role belonging to another association." };
  }

  if (role.associationId === null) {
    return { error: "Cannot delete a platform-wide role." };
  }

  if (role._count.memberships > 0) {
    return {
      error: `Cannot delete this role — it is assigned to ${role._count.memberships} membership(s). Reassign them first.`,
    };
  }

  if (role._count.executivePositions > 0) {
    return {
      error: `Cannot delete this role — it is linked to ${role._count.executivePositions} executive position(s). Unlink them first.`,
    };
  }

  await prisma.role.delete({ where: { id: roleId } });

  return true;
}
