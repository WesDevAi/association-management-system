import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type MemberListItem = {
  id: string;
  membershipNumber: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  roleName: string;
  roleKey: string;
  joinedAt: Date;
};

export type MemberDetail = MemberListItem & {
  associationId: string;
  branchId: string | null;
  leftAt: Date | null;
};

export type MemberApplicationListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  appliedAt: Date;
  branchName: string | null;
};

export type MemberStats = {
  total: number;
  active: number;
  pending: number;
  inactive: number;
};

export async function getMembers(
  associationId: string,
  statusFilter?: string
): Promise<MemberListItem[]> {
  const where: Record<string, unknown> = { associationId };
  if (statusFilter) {
    where.status = statusFilter;
  }

  const members = await prisma.membership.findMany({
    where,
    orderBy: { joinedAt: "desc" },
    include: {
      role: { select: { name: true, key: true } },
      branch: { select: { name: true } },
    },
  });

  return members.map((m) => ({
    id: m.id,
    membershipNumber: m.membershipNumber,
    fullName: m.fullName,
    email: m.email ?? "",
    phone: m.phone,
    status: m.status,
    roleName: m.role.name,
    roleKey: m.role.key,
    joinedAt: m.joinedAt,
  }));
}

export async function getMemberDetail(
  associationId: string,
  memberId: string
): Promise<MemberDetail | null> {
  const member = await prisma.membership.findFirst({
    where: { id: memberId, associationId },
    include: {
      role: { select: { name: true, key: true } },
      branch: { select: { name: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!member) return null;

  return {
    id: member.id,
    membershipNumber: member.membershipNumber,
    fullName: member.fullName,
    email: member.email ?? "",
    phone: member.phone,
    status: member.status,
    roleName: member.role.name,
    roleKey: member.role.key,
    joinedAt: member.joinedAt,
    associationId: member.associationId,
    branchId: member.branchId,
    leftAt: member.leftAt,
  };
}

export async function getMemberStats(associationId: string): Promise<MemberStats> {
  const [total, active, pending, inactive] = await Promise.all([
    prisma.membership.count({ where: { associationId } }),
    prisma.membership.count({ where: { associationId, status: "ACTIVE" } }),
    prisma.membership.count({ where: { associationId, status: "PENDING" } }),
    prisma.membership.count({ where: { associationId, status: "INACTIVE" } }),
  ]);

  return { total, active, pending, inactive };
}

export async function getMembershipApplications(
  associationId: string
): Promise<MemberApplicationListItem[]> {
  const applications = await prisma.membershipApplication.findMany({
    where: { associationId, status: { in: ["PENDING", "UNDER_REVIEW"] } },
    orderBy: { appliedAt: "desc" },
    include: { branch: { select: { name: true } } },
  });

  return applications.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    status: a.status,
    appliedAt: a.appliedAt,
    branchName: a.branch?.name ?? null,
  }));
}

export async function getPendingApplicationCount(associationId: string): Promise<number> {
  return prisma.membershipApplication.count({
    where: { associationId, status: "PENDING" },
  });
}

export async function updateMemberRole(
  associationId: string,
  memberId: string,
  roleId: string
): Promise<boolean> {
  const member = await prisma.membership.findFirst({
    where: { id: memberId, associationId },
  });

  if (!member) return false;

  await prisma.membership.update({
    where: { id: memberId },
    data: { roleId },
  });

  return true;
}

export async function deactivateMember(
  associationId: string,
  memberId: string
): Promise<boolean> {
  const member = await prisma.membership.findFirst({
    where: { id: memberId, associationId },
  });

  if (!member) return false;
  if (member.status === "SUSPENDED" || member.status === "EXPELLED") return false;

  await prisma.membership.update({
    where: { id: memberId },
    data: { status: "INACTIVE", leftAt: new Date() },
  });

  return true;
}

export async function reactivateMember(
  associationId: string,
  memberId: string
): Promise<boolean> {
  const member = await prisma.membership.findFirst({
    where: { id: memberId, associationId },
  });

  if (!member) return false;

  await prisma.membership.update({
    where: { id: memberId },
    data: { status: "ACTIVE", leftAt: null },
  });

  return true;
}

export async function getMemberForReview(
  associationId: string,
  applicationId: string
): Promise<MemberApplicationListItem | null> {
  const app = await prisma.membershipApplication.findFirst({
    where: { id: applicationId, associationId },
    include: { branch: { select: { name: true } } },
  });

  if (!app) return null;

  return {
    id: app.id,
    fullName: app.fullName,
    email: app.email,
    phone: app.phone,
    status: app.status,
    appliedAt: app.appliedAt,
    branchName: app.branch?.name ?? null,
  };
}

export async function approveApplication(
  associationId: string,
  applicationId: string
): Promise<boolean> {
  const app = await prisma.membershipApplication.findFirst({
    where: { id: applicationId, associationId },
  });

  if (!app || app.status !== "PENDING") return false;

  return prisma.$transaction(async (tx) => {
    await tx.membershipApplication.update({
      where: { id: applicationId },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });

    const existingMember = await tx.membership.findFirst({
      where: {
        associationId,
        userId: app.applicantUserId ?? null,
        fullName: app.fullName,
        email: app.email,
      },
    });

    if (existingMember) return false;

    const membershipNumber = await generateMembershipNumber(associationId, tx);
    const memberRole = await tx.role.findFirst({
      where: { associationId, key: "MEMBER" },
      select: { id: true },
    });

    await tx.membership.create({
      data: {
        associationId: app.associationId,
        branchId: app.branchId,
        fullName: app.fullName,
        email: app.email,
        phone: app.phone,
        membershipNumber,
        roleId: memberRole?.id ?? "",
        status: "ACTIVE",
      },
    });

    return true;
  });
}

export async function rejectApplication(
  associationId: string,
  applicationId: string
): Promise<boolean> {
  const app = await prisma.membershipApplication.findFirst({
    where: { id: applicationId, associationId },
  });

  if (!app || app.status !== "PENDING") return false;

  await prisma.membershipApplication.update({
    where: { id: applicationId },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });

  return true;
}

async function generateMembershipNumber(associationId: string, tx: Prisma.TransactionClient): Promise<string> {
  const count = await tx.membership.count({
    where: { associationId },
  });
  return String((count ?? 0) + 1).padStart(4, "0");
}
