import "server-only";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MembershipReport = {
  totalMembers: number;
  active: number;
  pending: number;
  inactive: number;
  suspended: number;
  expelled: number;
  alumni: number;
  membersByBranch: { branchName: string; count: number }[];
  membersByRole: { roleName: string; count: number }[];
  recentRegistrations: {
    id: string;
    fullName: string;
    email: string;
    membershipNumber: string;
    status: string;
    joinedAt: Date;
    branchName: string | null;
    roleName: string;
  }[];
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getMembershipReport(associationId: string): Promise<MembershipReport> {
  const [statusCounts, branchCounts, roleCounts, recentMembers] = await Promise.all([
    prisma.membership.groupBy({
      by: ["status"],
      where: { associationId },
      _count: true,
    }),
    prisma.membership.groupBy({
      by: ["branchId"],
      where: { associationId },
      _count: true,
    }),
    prisma.membership.groupBy({
      by: ["roleId"],
      where: { associationId },
      _count: true,
    }),
    prisma.membership.findMany({
      where: { associationId },
      orderBy: { joinedAt: "desc" },
      take: 20,
      include: {
        branch: { select: { name: true } },
        role: { select: { name: true } },
      },
    }),
  ]);

  const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));

  // Resolve branch names
  const branchIds = branchCounts.map((b) => b.branchId).filter((id): id is string => id !== null);
  const branches = branchIds.length > 0
    ? await prisma.branch.findMany({ where: { id: { in: branchIds } }, select: { id: true, name: true } })
    : [];
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  const membersByBranch = branchCounts.map((b) => ({
    branchName: b.branchId ? (branchMap.get(b.branchId) ?? "Unknown") : "Unassigned",
    count: b._count,
  })).sort((a, b) => b.count - a.count);

  // Resolve role names
  const roleIds = roleCounts.map((r) => r.roleId);
  const roles = roleIds.length > 0
    ? await prisma.role.findMany({ where: { id: { in: roleIds } }, select: { id: true, name: true } })
    : [];
  const roleMap = new Map(roles.map((r) => [r.id, r.name]));

  const membersByRole = roleCounts.map((r) => ({
    roleName: roleMap.get(r.roleId) ?? "Unknown",
    count: r._count,
  })).sort((a, b) => b.count - a.count);

  const totalMembers = statusCounts.reduce((sum, s) => sum + s._count, 0);

  return {
    totalMembers,
    active: counts["ACTIVE"] ?? 0,
    pending: counts["PENDING"] ?? 0,
    inactive: counts["INACTIVE"] ?? 0,
    suspended: counts["SUSPENDED"] ?? 0,
    expelled: counts["EXPELLED"] ?? 0,
    alumni: counts["ALUMNI"] ?? 0,
    membersByBranch,
    membersByRole,
    recentRegistrations: recentMembers.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      email: m.email ?? "",
      membershipNumber: m.membershipNumber,
      status: m.status,
      joinedAt: m.joinedAt,
      branchName: m.branch?.name ?? null,
      roleName: m.role.name,
    })),
  };
}
