import "server-only";
import { prisma } from "@/lib/prisma";
import type { ExecutiveAppointmentStatus, ExecutiveAppointmentType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExecutivePositionListItem = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean;
  maxOccupants: number;
  termLengthMonths: number | null;
  currentOccupants: number;
  branchName: string | null;
  roleName: string | null;
  createdAt: Date;
};

export type ExecutiveAppointmentListItem = {
  id: string;
  positionTitle: string;
  memberName: string;
  membershipNumber: string;
  appointmentType: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  notes: string | null;
  createdAt: Date;
};

export type CurrentExecutive = {
  positionId: string;
  positionTitle: string;
  positionOrder: number;
  positionDescription: string | null;
  maxOccupants: number;
  termLengthMonths: number | null;
  appointmentId: string;
  memberName: string;
  membershipNumber: string;
  memberEmail: string | null;
  memberPhone: string | null;
  avatarUrl: string | null;
  appointmentType: string;
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
  daysRemaining: number | null;
  isExpiringSoon: boolean;
};

export type ExecutiveStats = {
  totalPositions: number;
  activePositions: number;
  filledPositions: number;
  vacantPositions: number;
  activeExecutives: number;
  expiringSoon: number;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getExecutivePositions(
  associationId: string,
  opts?: { includeInactive?: boolean }
): Promise<ExecutivePositionListItem[]> {
  const where: Record<string, unknown> = { associationId };
  if (!opts?.includeInactive) {
    where.isActive = true;
  }

  const positions = await prisma.executivePosition.findMany({
    where,
    orderBy: { order: "asc" },
    include: {
      branch: { select: { name: true } },
      role: { select: { name: true } },
      appointments: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  });

  return positions.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    order: p.order,
    isActive: p.isActive,
    maxOccupants: p.maxOccupants,
    termLengthMonths: p.termLengthMonths,
    currentOccupants: p.appointments.length,
    branchName: p.branch?.name ?? null,
    roleName: p.role?.name ?? null,
    createdAt: p.createdAt,
  }));
}

export async function getExecutivePosition(
  associationId: string,
  positionId: string
): Promise<ExecutivePositionListItem | null> {
  const position = await prisma.executivePosition.findFirst({
    where: { id: positionId, associationId },
    include: {
      branch: { select: { name: true } },
      role: { select: { name: true } },
      appointments: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  });

  if (!position) return null;

  return {
    id: position.id,
    title: position.title,
    description: position.description,
    order: position.order,
    isActive: position.isActive,
    maxOccupants: position.maxOccupants,
    termLengthMonths: position.termLengthMonths,
    currentOccupants: position.appointments.length,
    branchName: position.branch?.name ?? null,
    roleName: position.role?.name ?? null,
    createdAt: position.createdAt,
  };
}

export async function getCurrentExecutives(
  associationId: string
): Promise<CurrentExecutive[]> {
  const positions = await prisma.executivePosition.findMany({
    where: { associationId, isActive: true },
    orderBy: { order: "asc" },
  });

  const results: CurrentExecutive[] = [];

  for (const position of positions) {
    const appointments = await prisma.executiveAppointment.findMany({
      where: {
        executivePositionId: position.id,
        status: "ACTIVE",
      },
      include: {
        membership: {
          select: {
            fullName: true,
            membershipNumber: true,
            email: true,
            phone: true,
            user: { select: { avatarUrl: true } },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    for (const appt of appointments) {
      const now = new Date();
      const endDate = appt.endDate;
      const daysRemaining = endDate
        ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null;
      const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30;

      results.push({
        positionId: position.id,
        positionTitle: position.title,
        positionOrder: position.order,
        positionDescription: position.description,
        maxOccupants: position.maxOccupants,
        termLengthMonths: position.termLengthMonths,
        appointmentId: appt.id,
        memberName: appt.membership.fullName,
        membershipNumber: appt.membership.membershipNumber,
        memberEmail: appt.membership.email,
        memberPhone: appt.membership.phone,
        avatarUrl: appt.membership.user?.avatarUrl ?? null,
        appointmentType: appt.appointmentType,
        startDate: appt.startDate,
        endDate: appt.endDate,
        notes: appt.notes,
        daysRemaining,
        isExpiringSoon,
      });
    }
  }

  return results;
}

export async function getAppointmentHistory(
  associationId: string,
  opts?: {
    status?: ExecutiveAppointmentStatus;
    appointmentType?: ExecutiveAppointmentType;
    positionId?: string;
  }
): Promise<ExecutiveAppointmentListItem[]> {
  const where: Record<string, unknown> = { associationId };
  if (opts?.status) where.status = opts.status;
  if (opts?.appointmentType) where.appointmentType = opts.appointmentType;
  if (opts?.positionId) where.executivePositionId = opts.positionId;

  const appointments = await prisma.executiveAppointment.findMany({
    where,
    orderBy: { startDate: "desc" },
    include: {
      executivePosition: { select: { title: true } },
      membership: { select: { fullName: true, membershipNumber: true } },
    },
  });

  return appointments.map((a) => ({
    id: a.id,
    positionTitle: a.executivePosition.title,
    memberName: a.membership.fullName,
    membershipNumber: a.membership.membershipNumber,
    appointmentType: a.appointmentType,
    startDate: a.startDate,
    endDate: a.endDate,
    status: a.status,
    notes: a.notes,
    createdAt: a.createdAt,
  }));
}

export async function getMemberExecutiveHistory(
  associationId: string,
  memberId: string
): Promise<ExecutiveAppointmentListItem[]> {
  const appointments = await prisma.executiveAppointment.findMany({
    where: { associationId, membershipId: memberId },
    orderBy: { startDate: "desc" },
    include: {
      executivePosition: { select: { title: true } },
      membership: { select: { fullName: true, membershipNumber: true } },
    },
  });

  return appointments.map((a) => ({
    id: a.id,
    positionTitle: a.executivePosition.title,
    memberName: a.membership.fullName,
    membershipNumber: a.membership.membershipNumber,
    appointmentType: a.appointmentType,
    startDate: a.startDate,
    endDate: a.endDate,
    status: a.status,
    notes: a.notes,
    createdAt: a.createdAt,
  }));
}

export async function getExecutiveStats(
  associationId: string
): Promise<ExecutiveStats> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [totalPositions, activePositions, activeAppointments, expiringSoon] =
    await Promise.all([
      prisma.executivePosition.count({ where: { associationId } }),
      prisma.executivePosition.count({ where: { associationId, isActive: true } }),
      prisma.executiveAppointment.count({
        where: { associationId, status: "ACTIVE" },
      }),
      prisma.executiveAppointment.count({
        where: {
          associationId,
          status: "ACTIVE",
          endDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
    ]);

  // Filled = positions that have at least one active appointment
  const filledPositions = await prisma.executivePosition.count({
    where: {
      associationId,
      isActive: true,
      appointments: { some: { status: "ACTIVE" } },
    },
  });

  return {
    totalPositions,
    activePositions,
    filledPositions,
    vacantPositions: activePositions - filledPositions,
    activeExecutives: activeAppointments,
    expiringSoon,
  };
}

export async function getVacantPositions(
  associationId: string
): Promise<ExecutivePositionListItem[]> {
  const positions = await prisma.executivePosition.findMany({
    where: {
      associationId,
      isActive: true,
      NOT: { appointments: { some: { status: "ACTIVE" } } },
    },
    orderBy: { order: "asc" },
    include: {
      branch: { select: { name: true } },
      role: { select: { name: true } },
    },
  });

  return positions.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    order: p.order,
    isActive: p.isActive,
    maxOccupants: p.maxOccupants,
    termLengthMonths: p.termLengthMonths,
    currentOccupants: 0,
    branchName: p.branch?.name ?? null,
    roleName: p.role?.name ?? null,
    createdAt: p.createdAt,
  }));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createExecutivePosition(
  associationId: string,
  data: {
    title: string;
    description?: string | null;
    order?: number;
    maxOccupants?: number;
    termLengthMonths?: number | null;
    branchId?: string | null;
    roleId?: string | null;
  }
): Promise<string> {
  const position = await prisma.executivePosition.create({
    data: {
      associationId,
      title: data.title,
      description: data.description ?? null,
      order: data.order ?? 0,
      maxOccupants: data.maxOccupants ?? 1,
      termLengthMonths: data.termLengthMonths ?? null,
      branchId: data.branchId ?? null,
      roleId: data.roleId ?? null,
    },
    select: { id: true },
  });

  return position.id;
}

export async function updateExecutivePosition(
  associationId: string,
  positionId: string,
  data: {
    title?: string;
    description?: string | null;
    order?: number;
    maxOccupants?: number;
    termLengthMonths?: number | null;
    branchId?: string | null;
    roleId?: string | null;
  }
): Promise<boolean> {
  const position = await prisma.executivePosition.findFirst({
    where: { id: positionId, associationId },
  });

  if (!position) return false;

  await prisma.executivePosition.update({
    where: { id: positionId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.maxOccupants !== undefined && { maxOccupants: data.maxOccupants }),
      ...(data.termLengthMonths !== undefined && { termLengthMonths: data.termLengthMonths }),
      ...(data.branchId !== undefined && { branchId: data.branchId || null }),
      ...(data.roleId !== undefined && { roleId: data.roleId || null }),
    },
  });

  return true;
}

export async function deactivateExecutivePosition(
  associationId: string,
  positionId: string
): Promise<boolean> {
  const position = await prisma.executivePosition.findFirst({
    where: { id: positionId, associationId },
  });

  if (!position) return false;

  await prisma.executivePosition.update({
    where: { id: positionId },
    data: { isActive: false },
  });

  return true;
}

export async function activateExecutivePosition(
  associationId: string,
  positionId: string
): Promise<boolean> {
  const position = await prisma.executivePosition.findFirst({
    where: { id: positionId, associationId },
  });

  if (!position) return false;

  await prisma.executivePosition.update({
    where: { id: positionId },
    data: { isActive: true },
  });

  return true;
}

export async function appointExecutive(
  associationId: string,
  data: {
    executivePositionId: string;
    membershipId: string;
    appointmentType: ExecutiveAppointmentType;
    startDate: Date;
    endDate?: Date | null;
    notes?: string | null;
    appointedById?: string | null;
  }
): Promise<string | { error: string }> {
  // Verify position exists and belongs to this association
  const position = await prisma.executivePosition.findFirst({
    where: { id: data.executivePositionId, associationId },
    include: {
      appointments: { where: { status: "ACTIVE" }, select: { id: true } },
    },
  });

  if (!position) {
    return { error: "Position not found." };
  }

  if (!position.isActive) {
    return { error: "Cannot appoint to an inactive position." };
  }

  // Check capacity
  if (position.appointments.length >= position.maxOccupants) {
    return { error: "Position is already at full capacity." };
  }

  // Check for duplicate active appointment (same member, same position)
  const existingAppointment = await prisma.executiveAppointment.findFirst({
    where: {
      executivePositionId: data.executivePositionId,
      membershipId: data.membershipId,
      status: "ACTIVE",
    },
  });

  if (existingAppointment) {
    return { error: "This member already holds an active appointment in this position." };
  }

  // Verify member belongs to this association
  const member = await prisma.membership.findFirst({
    where: { id: data.membershipId, associationId },
  });

  if (!member) {
    return { error: "Member not found." };
  }

  const appointment = await prisma.executiveAppointment.create({
    data: {
      associationId,
      executivePositionId: data.executivePositionId,
      membershipId: data.membershipId,
      appointmentType: data.appointmentType,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      notes: data.notes ?? null,
      appointedById: data.appointedById ?? null,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return appointment.id;
}

export async function endAppointment(
  associationId: string,
  appointmentId: string,
  status: ExecutiveAppointmentStatus,
  endDate?: Date
): Promise<boolean> {
  const appointment = await prisma.executiveAppointment.findFirst({
    where: { id: appointmentId, associationId },
  });

  if (!appointment) return false;

  await prisma.executiveAppointment.update({
    where: { id: appointmentId },
    data: {
      status,
      endDate: endDate ?? new Date(),
    },
  });

  return true;
}

export async function replaceExecutive(
  associationId: string,
  appointmentId: string,
  newMembershipId: string
): Promise<string | { error: string }> {
  const oldAppointment = await prisma.executiveAppointment.findFirst({
    where: { id: appointmentId, associationId, status: "ACTIVE" },
    include: { executivePosition: true },
  });

  if (!oldAppointment) {
    return { error: "Active appointment not found." };
  }

  // Check new member belongs to this association
  const newMember = await prisma.membership.findFirst({
    where: { id: newMembershipId, associationId },
  });

  if (!newMember) {
    return { error: "New member not found." };
  }

  // Check capacity (excluding the current appointment being replaced)
  const currentOccupants = await prisma.executiveAppointment.count({
    where: {
      executivePositionId: oldAppointment.executivePositionId,
      status: "ACTIVE",
      id: { not: appointmentId },
    },
  });

  if (currentOccupants >= oldAppointment.executivePosition.maxOccupants) {
    return { error: "Position is already at full capacity." };
  }

  // Check new member doesn't already hold this position
  const existingForNewMember = await prisma.executiveAppointment.findFirst({
    where: {
      executivePositionId: oldAppointment.executivePositionId,
      membershipId: newMembershipId,
      status: "ACTIVE",
    },
  });

  if (existingForNewMember) {
    return { error: "New member already holds this position." };
  }

  return prisma.$transaction(async (tx) => {
    // End the old appointment
    await tx.executiveAppointment.update({
      where: { id: appointmentId },
      data: { status: "REMOVED", endDate: new Date() },
    });

    // Create new appointment
    const newAppointment = await tx.executiveAppointment.create({
      data: {
        associationId,
        executivePositionId: oldAppointment.executivePositionId,
        membershipId: newMembershipId,
        appointmentType: oldAppointment.appointmentType,
        startDate: new Date(),
        endDate: oldAppointment.endDate,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    return newAppointment.id;
  });
}
