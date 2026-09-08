import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/auth/password";
import type { RegisterInput } from "@/server/validation/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AssociationUserItem = {
  membershipId: string;
  membershipNumber: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  roleName: string;
  roleId: string;
  roleKey: string;
  branchName: string | null;
  joinedAt: Date;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userStatus: string | null;
};

export type UserStats = {
  totalMemberships: number;
  active: number;
  pending: number;
  inactive: number;
  suspended: number;
  linked: number;
  unlinked: number;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getAssociationUsers(
  associationId: string,
  opts?: {
    search?: string;
    status?: string;
    roleId?: string;
    linked?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  users: AssociationUserItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const where: Prisma.MembershipWhereInput = { associationId };

  if (opts?.search) {
    where.OR = [
      { fullName: { contains: opts.search, mode: "insensitive" } },
      { email: { contains: opts.search, mode: "insensitive" } },
      { membershipNumber: { contains: opts.search, mode: "insensitive" } },
      { user: { name: { contains: opts.search, mode: "insensitive" } } },
      { user: { email: { contains: opts.search, mode: "insensitive" } } },
    ];
  }

  if (opts?.status && opts.status !== "ALL") {
    where.status = opts.status as "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "EXPELLED" | "ALUMNI";
  }

  if (opts?.roleId && opts.roleId !== "ALL") {
    where.roleId = opts.roleId;
  }

  if (opts?.linked === "LINKED") {
    where.userId = { not: null };
  } else if (opts?.linked === "UNLINKED") {
    where.userId = null;
  }

  const sortField = "joinedAt";
  const sortOrder: Prisma.SortOrder = "desc";
  const page = opts?.page ?? 1;
  const pageSize = opts?.limit ?? 20;
  const skip = (page - 1) * pageSize;

  const [memberships, total] = await Promise.all([
    prisma.membership.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: pageSize,
      include: {
        role: { select: { name: true, key: true } },
        branch: { select: { name: true } },
        user: { select: { id: true, name: true, email: true, status: true } },
      },
    }),
    prisma.membership.count({ where }),
  ]);

  return {
    users: memberships.map((m) => ({
      membershipId: m.id,
      membershipNumber: m.membershipNumber,
      fullName: m.fullName,
      email: m.email ?? "",
      phone: m.phone,
      status: m.status,
      roleName: m.role.name,
      roleId: m.roleId,
      roleKey: m.role.key,
      branchName: m.branch?.name ?? null,
      joinedAt: m.joinedAt,
      userId: m.userId ?? null,
      userName: m.user?.name ?? null,
      userEmail: m.user?.email ?? null,
      userStatus: m.user?.status ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUserStats(associationId: string): Promise<UserStats> {
  const [totalMemberships, active, pending, inactive, suspended, linked, unlinked] = await Promise.all([
    prisma.membership.count({ where: { associationId } }),
    prisma.membership.count({ where: { associationId, status: "ACTIVE" } }),
    prisma.membership.count({ where: { associationId, status: "PENDING" } }),
    prisma.membership.count({ where: { associationId, status: "INACTIVE" } }),
    prisma.membership.count({ where: { associationId, status: "SUSPENDED" } }),
    prisma.membership.count({ where: { associationId, userId: { not: null } } }),
    prisma.membership.count({ where: { associationId, userId: null } }),
  ]);

  return { totalMemberships, active, pending, inactive, suspended, linked, unlinked };
}

export async function getMembershipForUserManagement(
  associationId: string,
  membershipId: string
): Promise<AssociationUserItem | null> {
  const m = await prisma.membership.findFirst({
    where: { id: membershipId, associationId },
    include: {
      role: { select: { name: true, key: true } },
      branch: { select: { name: true } },
      user: { select: { id: true, name: true, email: true, status: true } },
    },
  });

  if (!m) return null;

  return {
    membershipId: m.id,
    membershipNumber: m.membershipNumber,
    fullName: m.fullName,
    email: m.email ?? "",
    phone: m.phone,
    status: m.status,
    roleName: m.role.name,
    roleId: m.roleId,
    roleKey: m.role.key,
    branchName: m.branch?.name ?? null,
    joinedAt: m.joinedAt,
    userId: m.userId ?? null,
    userName: m.user?.name ?? null,
    userEmail: m.user?.email ?? null,
    userStatus: m.user?.status ?? null,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function updateMembershipRole(
  associationId: string,
  membershipId: string,
  roleId: string
): Promise<boolean | { error: string }> {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, associationId },
  });

  if (!membership) return { error: "Membership not found." };

  const role = await prisma.role.findFirst({
    where: { id: roleId, associationId },
  });

  if (!role) return { error: "Role not found in this association." };

  await prisma.membership.update({
    where: { id: membershipId },
    data: { roleId },
  });

  return true;
}

export async function updateMembershipStatus(
  associationId: string,
  membershipId: string,
  status: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "EXPELLED" | "ALUMNI"
): Promise<boolean | { error: string }> {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, associationId },
  });

  if (!membership) return { error: "Membership not found." };

  await prisma.membership.update({
    where: { id: membershipId },
    data: {
      status,
      ...(status === "INACTIVE" || status === "EXPELLED" || status === "ALUMNI"
        ? { leftAt: new Date() }
        : status === "ACTIVE"
          ? { leftAt: null }
          : {}),
    },
  });

  return true;
}

export async function linkUserToMembership(
  associationId: string,
  membershipId: string,
  userId: string
): Promise<boolean | { error: string }> {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, associationId },
  });

  if (!membership) return { error: "Membership not found." };

  if (membership.userId) {
    return { error: "This membership already has a linked account." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) return { error: "User account not found." };

  const existingLink = await prisma.membership.findFirst({
    where: { associationId, userId },
  });

  if (existingLink) {
    return { error: "This user account is already linked to a membership in this association." };
  }

  await prisma.membership.update({
    where: { id: membershipId },
    data: { userId },
  });

  return true;
}

export async function unlinkUserFromMembership(
  associationId: string,
  membershipId: string
): Promise<boolean | { error: string }> {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, associationId },
  });

  if (!membership) return { error: "Membership not found." };

  if (!membership.userId) {
    return { error: "This membership does not have a linked account." };
  }

  await prisma.membership.update({
    where: { id: membershipId },
    data: { userId: null },
  });

  return true;
}

export async function searchUsersForLinking(
  associationId: string,
  search: string
): Promise<{ id: string; name: string; email: string }[]> {
  if (!search || search.length < 2) return [];

  const existingUserIds = await prisma.membership.findMany({
    where: { associationId, userId: { not: null } },
    select: { userId: true },
  });

  const excludeIds = existingUserIds
    .map((m) => m.userId)
    .filter((id): id is string => id !== null);

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    },
    take: 10,
    select: { id: true, name: true, email: true },
  });

  return users;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export type RegisterUserResult =
  | { success: true; userId: string }
  | { success: false; error: string };

export async function registerUser(input: RegisterInput): Promise<RegisterUserResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return { success: false, error: "Could not create account with those details." };
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return { success: true, userId: user.id };
}
