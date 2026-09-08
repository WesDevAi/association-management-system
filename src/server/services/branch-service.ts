import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BranchListItem = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  state: string | null;
  isHeadquarters: boolean;
  status: string;
  memberCount: number;
  createdAt: Date;
};

export type BranchDetail = BranchListItem & {
  updatedAt: Date;
};

export type BranchStats = {
  total: number;
  active: number;
  inactive: number;
  headquartersId: string | null;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getBranches(
  associationId: string,
  opts?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  branches: BranchListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const where: Prisma.BranchWhereInput = { associationId };

  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { code: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  if (opts?.status && opts.status !== "ALL") {
    where.status = opts.status as "ACTIVE" | "INACTIVE";
  }

  const page = opts?.page ?? 1;
  const pageSize = opts?.limit ?? 20;
  const skip = (page - 1) * pageSize;

  const [branches, total] = await Promise.all([
    prisma.branch.findMany({
      where,
      orderBy: [{ isHeadquarters: "desc" }, { name: "asc" }],
      skip,
      take: pageSize,
      include: {
        _count: { select: { memberships: true } },
      },
    }),
    prisma.branch.count({ where }),
  ]);

  return {
    branches: branches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      address: b.address,
      state: b.state,
      isHeadquarters: b.isHeadquarters,
      status: b.status,
      memberCount: b._count.memberships,
      createdAt: b.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getBranchDetail(
  associationId: string,
  branchId: string
): Promise<BranchDetail | null> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, associationId },
    include: {
      _count: { select: { memberships: true } },
    },
  });

  if (!branch) return null;

  return {
    id: branch.id,
    name: branch.name,
    code: branch.code,
    address: branch.address,
    state: branch.state,
    isHeadquarters: branch.isHeadquarters,
    status: branch.status,
    memberCount: branch._count.memberships,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
}

export async function getBranchStats(associationId: string): Promise<BranchStats> {
  const [total, active, inactive, hq] = await Promise.all([
    prisma.branch.count({ where: { associationId } }),
    prisma.branch.count({ where: { associationId, status: "ACTIVE" } }),
    prisma.branch.count({ where: { associationId, status: "INACTIVE" } }),
    prisma.branch.findFirst({
      where: { associationId, isHeadquarters: true },
      select: { id: true },
    }),
  ]);

  return {
    total,
    active,
    inactive,
    headquartersId: hq?.id ?? null,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createBranch(
  associationId: string,
  data: {
    name: string;
    code: string;
    address?: string | null;
    state?: string | null;
    isHeadquarters?: boolean;
    status?: string;
  }
): Promise<string | { error: string }> {
  const existingCode = await prisma.branch.findFirst({
    where: { associationId, code: data.code },
  });

  if (existingCode) {
    return { error: "A branch with this code already exists in this association." };
  }

  return prisma.$transaction(async (tx) => {
    if (data.isHeadquarters) {
      await tx.branch.updateMany({
        where: { associationId, isHeadquarters: true },
        data: { isHeadquarters: false },
      });
    }

    const branch = await tx.branch.create({
      data: {
        associationId,
        name: data.name,
        code: data.code,
        address: data.address || null,
        state: data.state || null,
        isHeadquarters: data.isHeadquarters ?? false,
        status: (data.status as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
      },
      select: { id: true },
    });

    return branch.id;
  });
}

export async function updateBranch(
  associationId: string,
  branchId: string,
  data: {
    name?: string;
    code?: string;
    address?: string | null;
    state?: string | null;
    isHeadquarters?: boolean;
    status?: string;
  }
): Promise<boolean | { error: string }> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, associationId },
  });

  if (!branch) return { error: "Branch not found." };

  if (data.code && data.code !== branch.code) {
    const existingCode = await prisma.branch.findFirst({
      where: { associationId, code: data.code, id: { not: branchId } },
    });

    if (existingCode) {
      return { error: "A branch with this code already exists in this association." };
    }
  }

  return prisma.$transaction(async (tx) => {
    if (data.isHeadquarters === true && !branch.isHeadquarters) {
      await tx.branch.updateMany({
        where: { associationId, isHeadquarters: true, id: { not: branchId } },
        data: { isHeadquarters: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.state !== undefined) updateData.state = data.state || null;
    if (data.isHeadquarters !== undefined) updateData.isHeadquarters = data.isHeadquarters;
    if (data.status !== undefined) updateData.status = data.status;

    if (Object.keys(updateData).length === 0) {
      return true;
    }

    await tx.branch.update({
      where: { id: branchId },
      data: updateData,
    });

    return true;
  });
}

export async function deactivateBranch(
  associationId: string,
  branchId: string
): Promise<boolean | { error: string }> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, associationId },
  });

  if (!branch) return { error: "Branch not found." };

  if (branch.isHeadquarters) {
    return { error: "Cannot deactivate the headquarters branch. Set another branch as headquarters first." };
  }

  if (branch.status === "INACTIVE") {
    return { error: "Branch is already inactive." };
  }

  await prisma.branch.update({
    where: { id: branchId },
    data: { status: "INACTIVE" },
  });

  return true;
}

export async function activateBranch(
  associationId: string,
  branchId: string
): Promise<boolean | { error: string }> {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, associationId },
  });

  if (!branch) return { error: "Branch not found." };

  if (branch.status === "ACTIVE") {
    return { error: "Branch is already active." };
  }

  await prisma.branch.update({
    where: { id: branchId },
    data: { status: "ACTIVE" },
  });

  return true;
}
