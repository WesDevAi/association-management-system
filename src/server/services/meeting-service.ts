import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { MeetingType, MeetingStatus, AttendanceStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MeetingListItem = {
  id: string;
  title: string;
  description: string | null;
  meetingNumber: string | null;
  type: string;
  scheduledAt: Date;
  endedAt: Date | null;
  location: string | null;
  isVirtual: boolean;
  meetingLink: string | null;
  status: string;
  createdAt: Date;
  attendeeCount: number;
};

export type MeetingDetail = MeetingListItem & {
  branchId: string | null;
  createdById: string | null;
  branchName: string | null;
  agenda: string | null;
  notes: string | null;
  createdBy: { name: string; email: string } | null;
};

export type MeetingAttendee = {
  membershipId: string;
  fullName: string;
  membershipNumber: string;
  email: string | null;
  status: string;
  checkInAt: Date | null;
  remarks: string | null;
};

export type AttendanceSummary = {
  totalMembers: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  attendanceRate: number;
};

export type MeetingStats = {
  total: number;
  scheduled: number;
  ongoing: number;
  completed: number;
  cancelled: number;
  averageAttendanceRate: number;
};

export type MeetingListItemWithAttendees = MeetingListItem & {
  attendeeCount: number;
};

export type MemberAttendanceHistory = {
  memberId: string;
  fullName: string;
  membershipNumber: string;
  totalMeetings: number;
  attended: number;
  missed: number;
  excused: number;
  late: number;
  attendanceRate: number;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getMeetings(
  associationId: string,
  opts?: { status?: string; type?: string; search?: string }
): Promise<MeetingListItem[]> {
  const where: Prisma.MeetingWhereInput = { associationId };

  if (opts?.status) {
    where.status = opts.status as MeetingStatus;
  }
  if (opts?.type) {
    where.type = opts.type as MeetingType;
  }
  if (opts?.search) {
    where.OR = [
      { title: { contains: opts.search, mode: "insensitive" } },
      { meetingNumber: { contains: opts.search, mode: "insensitive" } },
      { location: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  const meetings = await prisma.meeting.findMany({
    where,
    orderBy: { scheduledAt: "desc" },
    include: {
      _count: { select: { attendances: true } },
    },
  });

  return meetings.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    meetingNumber: m.meetingNumber,
    type: m.type,
    scheduledAt: m.scheduledAt,
    endedAt: m.endedAt,
    location: m.location,
    isVirtual: m.isVirtual,
    meetingLink: m.meetingLink,
    status: m.status,
    createdAt: m.createdAt,
    attendeeCount: m._count.attendances,
  }));
}

export async function getMeetingDetail(
  associationId: string,
  meetingId: string
): Promise<MeetingDetail | null> {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
    include: {
      branch: { select: { name: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!meeting) return null;

  const attendeeCount = await prisma.attendance.count({
    where: { meetingId },
  });

  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    meetingNumber: meeting.meetingNumber,
    type: meeting.type,
    scheduledAt: meeting.scheduledAt,
    endedAt: meeting.endedAt,
    location: meeting.location,
    isVirtual: meeting.isVirtual,
    meetingLink: meeting.meetingLink,
    status: meeting.status,
    createdAt: meeting.createdAt,
    branchId: meeting.branchId,
    createdById: meeting.createdById,
    attendeeCount,
    branchName: meeting.branch?.name ?? null,
    agenda: meeting.agenda,
    notes: meeting.notes,
    createdBy: meeting.createdBy,
  };
}

export async function getMeetingAttendances(
  associationId: string,
  meetingId: string
): Promise<MeetingAttendee[]> {
  const attendances = await prisma.attendance.findMany({
    where: { associationId, meetingId },
    include: {
      membership: {
        select: { fullName: true, membershipNumber: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return attendances.map((a) => ({
    membershipId: a.membershipId,
    fullName: a.membership.fullName,
    membershipNumber: a.membership.membershipNumber,
    email: a.membership.email,
    status: a.status,
    checkInAt: a.checkInAt,
    remarks: a.remarks,
  }));
}

/**
 * Returns all active members in the association paired with their attendance
 * status for a given meeting (if any). Members without an attendance record
 * are returned with status null so the UI can display them as "not yet marked".
 */
export async function getMembersForAttendance(
  associationId: string,
  meetingId: string
): Promise<
  {
    membershipId: string;
    fullName: string;
    membershipNumber: string;
    email: string | null;
    roleName: string;
    attendanceStatus: string | null;
    remarks: string | null;
  }[]
> {
  const members = await prisma.membership.findMany({
    where: { associationId, status: "ACTIVE" },
    include: {
      role: { select: { name: true } },
      attendances: {
        where: { meetingId },
        select: { status: true, remarks: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  return members.map((m) => ({
    membershipId: m.id,
    fullName: m.fullName,
    membershipNumber: m.membershipNumber,
    email: m.email,
    roleName: m.role.name,
    attendanceStatus: m.attendances[0]?.status ?? null,
    remarks: m.attendances[0]?.remarks ?? null,
  }));
}

export async function getAttendanceSummary(
  associationId: string,
  meetingId: string
): Promise<AttendanceSummary> {
  const totalMembers = await prisma.membership.count({
    where: { associationId, status: "ACTIVE" },
  });

  const attendanceCounts = await prisma.attendance.groupBy({
    by: ["status"],
    where: { associationId, meetingId },
    _count: { status: true },
  });

  const counts: Record<string, number> = {};
  for (const row of attendanceCounts) {
    counts[row.status] = row._count.status;
  }

  const present = counts["PRESENT"] ?? 0;
  const late = counts["LATE"] ?? 0;
  const attended = present + late;

  return {
    totalMembers,
    present,
    absent: counts["ABSENT"] ?? 0,
    excused: counts["EXCUSED"] ?? 0,
    late,
    attendanceRate: totalMembers > 0 ? Math.round((attended / totalMembers) * 100) : 0,
  };
}

export async function getMeetingStats(associationId: string): Promise<MeetingStats> {
  const [total, scheduled, ongoing, completed, cancelled] = await Promise.all([
    prisma.meeting.count({ where: { associationId } }),
    prisma.meeting.count({ where: { associationId, status: "SCHEDULED" } }),
    prisma.meeting.count({ where: { associationId, status: "ONGOING" } }),
    prisma.meeting.count({ where: { associationId, status: "COMPLETED" } }),
    prisma.meeting.count({ where: { associationId, status: "CANCELLED" } }),
  ]);

  // Calculate average attendance rate across completed meetings
  const completedMeetings = await prisma.meeting.findMany({
    where: { associationId, status: "COMPLETED" },
    select: { id: true },
  });

  let averageAttendanceRate = 0;
  if (completedMeetings.length > 0) {
    const totalMembers = await prisma.membership.count({
      where: { associationId, status: "ACTIVE" },
    });

    if (totalMembers > 0) {
      let totalRate = 0;
      for (const m of completedMeetings) {
        const attended = await prisma.attendance.count({
          where: {
            meetingId: m.id,
            status: { in: ["PRESENT", "LATE"] },
          },
        });
        totalRate += (attended / totalMembers) * 100;
      }
      averageAttendanceRate = Math.round(totalRate / completedMeetings.length);
    }
  }

  return { total, scheduled, ongoing, completed, cancelled, averageAttendanceRate };
}

export async function getMemberAttendanceHistory(
  associationId: string,
  memberId: string
): Promise<MemberAttendanceHistory | null> {
  const member = await prisma.membership.findFirst({
    where: { id: memberId, associationId },
    select: { fullName: true, membershipNumber: true },
  });

  if (!member) return null;

  const totalMeetings = await prisma.meeting.count({
    where: { associationId, status: { in: ["COMPLETED", "ONGOING"] } },
  });

  const attendanceCounts = await prisma.attendance.groupBy({
    by: ["status"],
    where: { associationId, membershipId: memberId },
    _count: { status: true },
  });

  const counts: Record<string, number> = {};
  for (const row of attendanceCounts) {
    counts[row.status] = row._count.status;
  }

  const attended = (counts["PRESENT"] ?? 0) + (counts["LATE"] ?? 0);
  const excused = counts["EXCUSED"] ?? 0;
  const missed = counts["ABSENT"] ?? 0;
  const denominator = totalMeetings > 0 ? totalMeetings : 1;

  return {
    memberId,
    fullName: member.fullName,
    membershipNumber: member.membershipNumber,
    totalMeetings,
    attended,
    missed,
    excused,
    late: counts["LATE"] ?? 0,
    attendanceRate: Math.round((attended / denominator) * 100),
  };
}

/**
 * Returns all members with attendance stats, for the member attendance
 * overview page. Sorted by attendance rate descending.
 */
export async function getAllMemberAttendanceStats(
  associationId: string
): Promise<MemberAttendanceHistory[]> {
  const members = await prisma.membership.findMany({
    where: { associationId, status: "ACTIVE" },
    select: { id: true, fullName: true, membershipNumber: true },
    orderBy: { fullName: "asc" },
  });

  const totalMeetings = await prisma.meeting.count({
    where: { associationId, status: { in: ["COMPLETED", "ONGOING"] } },
  });

  const results: MemberAttendanceHistory[] = [];

  for (const member of members) {
    const attendanceCounts = await prisma.attendance.groupBy({
      by: ["status"],
      where: { associationId, membershipId: member.id },
      _count: { status: true },
    });

    const counts: Record<string, number> = {};
    for (const row of attendanceCounts) {
      counts[row.status] = row._count.status;
    }

    const attended = (counts["PRESENT"] ?? 0) + (counts["LATE"] ?? 0);
    const excused = counts["EXCUSED"] ?? 0;
    const missed = counts["ABSENT"] ?? 0;
    const denominator = totalMeetings > 0 ? totalMeetings : 1;

    results.push({
      memberId: member.id,
      fullName: member.fullName,
      membershipNumber: member.membershipNumber,
      totalMeetings,
      attended,
      missed,
      excused,
      late: counts["LATE"] ?? 0,
      attendanceRate: Math.round((attended / denominator) * 100),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createMeeting(
  associationId: string,
  data: {
    title: string;
    description: string | null;
    meetingNumber: string | null;
    agenda: string | null;
    notes: string | null;
    type: string;
    scheduledAt: Date;
    endedAt: Date | null;
    location: string | null;
    isVirtual: boolean;
    meetingLink: string | null;
    branchId: string | null;
    createdById?: string | null;
  }
): Promise<string> {
  const meeting = await prisma.meeting.create({
    data: {
      associationId,
      title: data.title,
      description: data.description,
      meetingNumber: data.meetingNumber,
      agenda: data.agenda,
      notes: data.notes,
      type: data.type as MeetingType,
      scheduledAt: data.scheduledAt,
      endedAt: data.endedAt,
      location: data.location,
      isVirtual: data.isVirtual,
      meetingLink: data.meetingLink,
      branchId: data.branchId,
      status: "SCHEDULED",
      createdById: data.createdById ?? null,
    },
    select: { id: true },
  });

  return meeting.id;
}

export async function updateMeeting(
  associationId: string,
  meetingId: string,
  data: {
    title?: string;
    description?: string | null;
    meetingNumber?: string | null;
    agenda?: string | null;
    notes?: string | null;
    type?: string;
    location?: string | null;
    meetingLink?: string | null;
  }
): Promise<boolean> {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) return false;

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.meetingNumber !== undefined && { meetingNumber: data.meetingNumber }),
      ...(data.agenda !== undefined && { agenda: data.agenda }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.type !== undefined && { type: data.type as MeetingType }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.meetingLink !== undefined && { meetingLink: data.meetingLink }),
    },
  });

  return true;
}

export async function updateMeetingStatus(
  associationId: string,
  meetingId: string,
  status: string,
  endedAt?: Date | null
): Promise<boolean> {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) return false;

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      status: status as MeetingStatus,
      ...(endedAt !== undefined ? { endedAt } : {}),
    },
  });

  return true;
}

export async function cancelMeeting(
  associationId: string,
  meetingId: string
): Promise<boolean> {
  return updateMeetingStatus(associationId, meetingId, "CANCELLED");
}

export async function recordAttendance(
  associationId: string,
  meetingId: string,
  membershipId: string,
  status: string,
  remarks?: string
): Promise<boolean> {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) return false;

  const existing = await prisma.attendance.findUnique({
    where: { meetingId_membershipId: { meetingId, membershipId } },
  });

  if (existing) {
    await prisma.attendance.update({
      where: { meetingId_membershipId: { meetingId, membershipId } },
      data: {
        status: status as AttendanceStatus,
        checkInAt: status === "PRESENT" || status === "LATE" ? new Date() : existing.checkInAt,
        remarks: remarks ?? null,
      },
    });
    return true;
  }

  await prisma.attendance.create({
    data: {
      associationId,
      meetingId,
      membershipId,
      status: status as AttendanceStatus,
      checkInAt: status === "PRESENT" || status === "LATE" ? new Date() : null,
      remarks: remarks ?? null,
    },
  });

  return true;
}

export async function recordBulkAttendance(
  associationId: string,
  meetingId: string,
  entries: { membershipId: string; status: string; remarks?: string }[]
): Promise<boolean> {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) return false;

  for (const entry of entries) {
    const existing = await prisma.attendance.findUnique({
      where: { meetingId_membershipId: { meetingId, membershipId: entry.membershipId } },
    });

    const checkInAt =
      entry.status === "PRESENT" || entry.status === "LATE" ? new Date() : null;

    if (existing) {
      await prisma.attendance.update({
        where: { meetingId_membershipId: { meetingId, membershipId: entry.membershipId } },
        data: {
          status: entry.status as AttendanceStatus,
          checkInAt: checkInAt ?? existing.checkInAt,
          remarks: entry.remarks ?? null,
        },
      });
    } else {
      await prisma.attendance.create({
        data: {
          associationId,
          meetingId,
          membershipId: entry.membershipId,
          status: entry.status as AttendanceStatus,
          checkInAt,
          remarks: entry.remarks ?? null,
        },
      });
    }
  }

  return true;
}

export async function getUpcomingMeetings(
  associationId: string
): Promise<MeetingListItem[]> {
  const meetings = await prisma.meeting.findMany({
    where: {
      associationId,
      status: "SCHEDULED",
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    take: 5,
    include: {
      _count: { select: { attendances: true } },
    },
  });

  return meetings.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    meetingNumber: m.meetingNumber,
    type: m.type,
    scheduledAt: m.scheduledAt,
    endedAt: m.endedAt,
    location: m.location,
    isVirtual: m.isVirtual,
    meetingLink: m.meetingLink,
    status: m.status,
    createdAt: m.createdAt,
    attendeeCount: m._count.attendances,
  }));
}
