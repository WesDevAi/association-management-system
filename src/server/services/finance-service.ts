import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentCategoryListItem = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  defaultAmount: string | null;
  isRecurring: boolean;
  frequency: string | null;
  isActive: boolean;
  paymentCount: number;
  totalCollected: string;
  createdAt: Date;
};

export type PaymentListItem = {
  id: string;
  memberName: string;
  membershipNumber: string;
  categoryName: string;
  categoryType: string;
  amount: string;
  currency: string;
  status: string;
  method: string;
  reference: string;
  paidAt: Date | null;
  dueDate: Date | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  notes: string | null;
  createdAt: Date;
};

export type MemberBalance = {
  membershipId: string;
  memberName: string;
  membershipNumber: string;
  email: string | null;
  totalPaid: string;
  totalPending: string;
  totalOwed: string;
  paymentCount: number;
  pendingCount: number;
  lastPaymentDate: Date | null;
};

export type FineListItem = {
  id: string;
  memberName: string;
  membershipNumber: string;
  reason: string;
  amount: string;
  status: string;
  issuedAt: Date;
  dueDate: Date | null;
  paidAmount: string;
  outstandingAmount: string;
  issuedByName: string | null;
  waivedByName: string | null;
  waivedReason: string | null;
  createdAt: Date;
};

export type FinanceStats = {
  totalCollected: string;
  totalPending: string;
  totalOutstanding: string;
  totalFinesIssued: string;
  totalFinesOutstanding: string;
  collectedThisMonth: string;
  collectedThisYear: string;
  paymentCount: number;
  pendingPaymentCount: number;
  memberCount: number;
  membersWithBalance: number;
  collectionRate: number;
};

// ---------------------------------------------------------------------------
// Queries — Payment Categories
// ---------------------------------------------------------------------------

export async function getPaymentCategories(
  associationId: string,
  opts?: { includeInactive?: boolean }
): Promise<PaymentCategoryListItem[]> {
  const where: Record<string, unknown> = { associationId };
  if (!opts?.includeInactive) {
    where.isActive = true;
  }

  const categories = await prisma.paymentCategory.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        where: { status: "COMPLETED" },
        select: { amount: true },
      },
    },
  });

  return categories.map((c) => {
    const totalCollected = c.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      type: c.type,
      defaultAmount: c.defaultAmount?.toString() ?? null,
      isRecurring: c.isRecurring,
      frequency: c.frequency,
      isActive: c.isActive,
      paymentCount: c.payments.length,
      totalCollected: totalCollected.toFixed(2),
      createdAt: c.createdAt,
    };
  });
}

export async function getPaymentCategory(
  associationId: string,
  categoryId: string
): Promise<PaymentCategoryListItem | null> {
  const category = await prisma.paymentCategory.findFirst({
    where: { id: categoryId, associationId },
    include: {
      payments: {
        where: { status: "COMPLETED" },
        select: { amount: true },
      },
    },
  });

  if (!category) return null;

  const totalCollected = category.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    type: category.type,
    defaultAmount: category.defaultAmount?.toString() ?? null,
    isRecurring: category.isRecurring,
    frequency: category.frequency,
    isActive: category.isActive,
    paymentCount: category.payments.length,
    totalCollected: totalCollected.toFixed(2),
    createdAt: category.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Queries — Payments
// ---------------------------------------------------------------------------

export async function getPayments(
  associationId: string,
  opts?: {
    status?: string;
    method?: string;
    categoryId?: string;
    membershipId?: string;
    search?: string;
  }
): Promise<PaymentListItem[]> {
  const where: Prisma.PaymentWhereInput = { associationId };

  if (opts?.status) where.status = opts.status as "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  if (opts?.method) where.method = opts.method as "CASH" | "BANK_TRANSFER" | "CARD" | "USSD" | "OTHER";
  if (opts?.categoryId) where.paymentCategoryId = opts.categoryId;
  if (opts?.membershipId) where.membershipId = opts.membershipId;
  if (opts?.search) {
    where.OR = [
      { reference: { contains: opts.search, mode: "insensitive" } },
      { membership: { fullName: { contains: opts.search, mode: "insensitive" } } },
      { membership: { membershipNumber: { contains: opts.search, mode: "insensitive" } } },
      { paymentCategory: { name: { contains: opts.search, mode: "insensitive" } } },
    ];
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      membership: { select: { fullName: true, membershipNumber: true } },
      paymentCategory: { select: { name: true, type: true } },
    },
  });

  return payments.map((p) => ({
    id: p.id,
    memberName: p.membership.fullName,
    membershipNumber: p.membership.membershipNumber,
    categoryName: p.paymentCategory.name,
    categoryType: p.paymentCategory.type,
    amount: p.amount.toString(),
    currency: p.currency,
    status: p.status,
    method: p.method,
    reference: p.reference,
    paidAt: p.paidAt,
    dueDate: p.dueDate,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    notes: p.notes,
    createdAt: p.createdAt,
  }));
}

// ---------------------------------------------------------------------------
// Queries — Member Balances
// ---------------------------------------------------------------------------

export async function getMemberBalances(
  associationId: string
): Promise<MemberBalance[]> {
  const members = await prisma.membership.findMany({
    where: { associationId, status: "ACTIVE" },
    select: { id: true, fullName: true, membershipNumber: true, email: true },
    orderBy: { fullName: "asc" },
  });

  const results: MemberBalance[] = [];

  for (const member of members) {
    const [completedPayments, pendingPayments, lastPayment] = await Promise.all([
      prisma.payment.findMany({
        where: { membershipId: member.id, status: "COMPLETED" },
        select: { amount: true, createdAt: true },
      }),
      prisma.payment.findMany({
        where: { membershipId: member.id, status: "PENDING" },
        select: { amount: true },
      }),
      prisma.payment.findFirst({
        where: { membershipId: member.id, status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const totalPaid = completedPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const totalPending = pendingPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    results.push({
      membershipId: member.id,
      memberName: member.fullName,
      membershipNumber: member.membershipNumber,
      email: member.email,
      totalPaid: totalPaid.toFixed(2),
      totalPending: totalPending.toFixed(2),
      totalOwed: (totalPending > 0 ? totalPending : 0).toFixed(2),
      paymentCount: completedPayments.length,
      pendingCount: pendingPayments.length,
      lastPaymentDate: lastPayment?.createdAt ?? null,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Queries — Fines
// ---------------------------------------------------------------------------

export async function getFines(
  associationId: string,
  opts?: { status?: string; membershipId?: string }
): Promise<FineListItem[]> {
  const where: Prisma.FineWhereInput = { associationId };

  if (opts?.status) where.status = opts.status as "PENDING" | "PARTIALLY_PAID" | "PAID" | "WAIVED" | "CANCELLED";
  if (opts?.membershipId) where.membershipId = opts.membershipId;

  const fines = await prisma.fine.findMany({
    where,
    orderBy: { issuedAt: "desc" },
    include: {
      membership: { select: { fullName: true, membershipNumber: true } },
      issuedBy: { select: { name: true } },
      waivedBy: { select: { name: true } },
      payments: {
        where: { status: "COMPLETED" },
        select: { amount: true },
      },
    },
  });

  return fines.map((f) => {
    const paidAmount = f.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const outstandingAmount = Number(f.amount) - paidAmount;

    return {
      id: f.id,
      memberName: f.membership.fullName,
      membershipNumber: f.membership.membershipNumber,
      reason: f.reason,
      amount: f.amount.toString(),
      status: f.status,
      issuedAt: f.issuedAt,
      dueDate: f.dueDate,
      paidAmount: paidAmount.toFixed(2),
      outstandingAmount: Math.max(0, outstandingAmount).toFixed(2),
      issuedByName: f.issuedBy?.name ?? null,
      waivedByName: f.waivedBy?.name ?? null,
      waivedReason: f.waivedReason,
      createdAt: f.createdAt,
    };
  });
}

// ---------------------------------------------------------------------------
// Queries — Finance Stats
// ---------------------------------------------------------------------------

export async function getFinanceStats(
  associationId: string
): Promise<FinanceStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    completedPayments,
    pendingPayments,
    allPayments,
    fines,
    memberCount,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: { associationId, status: "COMPLETED" },
      select: { amount: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { associationId, status: "PENDING" },
      select: { amount: true },
    }),
    prisma.payment.findMany({
      where: { associationId },
      select: { amount: true, status: true, membershipId: true },
    }),
    prisma.fine.findMany({
      where: { associationId, status: { in: ["PENDING", "PARTIALLY_PAID"] } },
      select: { amount: true, payments: { where: { status: "COMPLETED" }, select: { amount: true } } },
    }),
    prisma.membership.count({ where: { associationId, status: "ACTIVE" } }),
  ]);

  const totalCollected = completedPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const totalPending = pendingPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const collectedThisMonth = completedPayments
    .filter((p) => p.createdAt >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const collectedThisYear = completedPayments
    .filter((p) => p.createdAt >= startOfYear)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalFinesIssued = fines.reduce(
    (sum, f) => sum + Number(f.amount),
    0
  );
  const totalFinesOutstanding = fines.reduce((sum, f) => {
    const paid = f.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + Math.max(0, Number(f.amount) - paid);
  }, 0);

  // Collection rate = completed payments / total expected (completed + pending)
  const totalExpected = totalCollected + totalPending;
  const collectionRate =
    totalExpected > 0
      ? Math.round((totalCollected / totalExpected) * 100)
      : 100;

  // Members with outstanding balance
  const uniqueMembersWithPending = new Set(
    allPayments
      .filter((p) => p.status === "PENDING")
      .map((p) => p.membershipId)
  ).size;

  return {
    totalCollected: totalCollected.toFixed(2),
    totalPending: totalPending.toFixed(2),
    totalOutstanding: totalPending.toFixed(2),
    totalFinesIssued: totalFinesIssued.toFixed(2),
    totalFinesOutstanding: totalFinesOutstanding.toFixed(2),
    collectedThisMonth: collectedThisMonth.toFixed(2),
    collectedThisYear: collectedThisYear.toFixed(2),
    paymentCount: allPayments.length,
    pendingPaymentCount: pendingPayments.length,
    memberCount,
    membersWithBalance: uniqueMembersWithPending,
    collectionRate,
  };
}

// ---------------------------------------------------------------------------
// Mutations — Payment Categories
// ---------------------------------------------------------------------------

export async function createPaymentCategory(
  associationId: string,
  data: {
    name: string;
    description?: string | null;
    type: string;
    defaultAmount?: number | null;
    isRecurring?: boolean;
    frequency?: string | null;
  }
): Promise<string> {
  const category = await prisma.paymentCategory.create({
    data: {
      associationId,
      name: data.name,
      description: data.description ?? null,
      type: data.type as "DUES" | "CONTRIBUTION" | "LEVY" | "EVENT" | "DONATION" | "FINE" | "OTHER",
      defaultAmount: data.defaultAmount ?? null,
      isRecurring: data.isRecurring ?? false,
      frequency: (data.frequency as "ONE_OFF" | "MONTHLY" | "QUARTERLY" | "ANNUALLY") ?? null,
    },
    select: { id: true },
  });

  return category.id;
}

export async function updatePaymentCategory(
  associationId: string,
  categoryId: string,
  data: {
    name?: string;
    description?: string | null;
    type?: string;
    defaultAmount?: number | null;
    isRecurring?: boolean;
    frequency?: string | null;
  }
): Promise<boolean> {
  const category = await prisma.paymentCategory.findFirst({
    where: { id: categoryId, associationId },
  });

  if (!category) return false;

  await prisma.paymentCategory.update({
    where: { id: categoryId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.type !== undefined && { type: data.type as "DUES" | "CONTRIBUTION" | "LEVY" | "EVENT" | "DONATION" | "FINE" | "OTHER" }),
      ...(data.defaultAmount !== undefined && { defaultAmount: data.defaultAmount || null }),
      ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
      ...(data.frequency !== undefined && { frequency: (data.frequency as "ONE_OFF" | "MONTHLY" | "QUARTERLY" | "ANNUALLY") || null }),
    },
  });

  return true;
}

export async function deactivatePaymentCategory(
  associationId: string,
  categoryId: string
): Promise<boolean> {
  const category = await prisma.paymentCategory.findFirst({
    where: { id: categoryId, associationId },
  });

  if (!category) return false;

  await prisma.paymentCategory.update({
    where: { id: categoryId },
    data: { isActive: false },
  });

  return true;
}

export async function activatePaymentCategory(
  associationId: string,
  categoryId: string
): Promise<boolean> {
  const category = await prisma.paymentCategory.findFirst({
    where: { id: categoryId, associationId },
  });

  if (!category) return false;

  await prisma.paymentCategory.update({
    where: { id: categoryId },
    data: { isActive: true },
  });

  return true;
}

// ---------------------------------------------------------------------------
// Mutations — Payments
// ---------------------------------------------------------------------------

export async function recordPayment(
  associationId: string,
  data: {
    membershipId: string;
    paymentCategoryId: string;
    amount: number;
    method: string;
    reference: string;
    paidAt: Date;
    dueDate?: Date | null;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    notes?: string | null;
    fineId?: string | null;
    recordedById?: string | null;
  }
): Promise<string | { error: string }> {
  // Verify member belongs to this association
  const member = await prisma.membership.findFirst({
    where: { id: data.membershipId, associationId },
  });

  if (!member) {
    return { error: "Member not found." };
  }

  // Verify category exists and belongs to this association
  const category = await prisma.paymentCategory.findFirst({
    where: { id: data.paymentCategoryId, associationId, isActive: true },
  });

  if (!category) {
    return { error: "Payment category not found or inactive." };
  }

  // Check for duplicate reference
  const existingPayment = await prisma.payment.findUnique({
    where: { reference: data.reference },
  });

  if (existingPayment) {
    return { error: "A payment with this reference already exists." };
  }

  // If paying a fine, verify the fine belongs to this member and association
  if (data.fineId) {
    const fine = await prisma.fine.findFirst({
      where: { id: data.fineId, associationId, membershipId: data.membershipId },
    });

    if (!fine) {
      return { error: "Fine not found." };
    }

    if (fine.status === "PAID" || fine.status === "WAIVED" || fine.status === "CANCELLED") {
      return { error: "This fine has already been settled." };
    }
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        associationId,
        membershipId: data.membershipId,
        paymentCategoryId: data.paymentCategoryId,
        amount: data.amount,
        currency: "NGN",
        status: "COMPLETED",
        method: data.method as "CASH" | "BANK_TRANSFER" | "CARD" | "USSD" | "OTHER",
        reference: data.reference,
        paidAt: data.paidAt,
        dueDate: data.dueDate ?? null,
        periodStart: data.periodStart ?? null,
        periodEnd: data.periodEnd ?? null,
        notes: data.notes ?? null,
        fineId: data.fineId ?? null,
        recordedById: data.recordedById ?? null,
      },
      select: { id: true },
    });

    // If linked to a fine, update fine status
    if (data.fineId) {
      const fine = await tx.fine.findUnique({
        where: { id: data.fineId },
        select: { amount: true },
      });

      if (fine) {
        const totalPaid = await tx.payment.aggregate({
          where: { fineId: data.fineId, status: "COMPLETED" },
          _sum: { amount: true },
        });

        const paidTotal = Number(totalPaid._sum.amount ?? 0) + data.amount;

        if (paidTotal >= Number(fine.amount)) {
          await tx.fine.update({
            where: { id: data.fineId },
            data: { status: "PAID" },
          });
        } else {
          await tx.fine.update({
            where: { id: data.fineId },
            data: { status: "PARTIALLY_PAID" },
          });
        }
      }
    }

    // Create financial transaction record (INCOME)
    await tx.financialTransaction.create({
      data: {
        associationId,
        type: "INCOME",
        category: category.name,
        amount: data.amount,
        currency: "NGN",
        description: `${category.name} payment from ${member.fullName}`,
        transactionDate: data.paidAt,
        recordedById: data.recordedById ?? null,
        sourcePaymentId: payment.id,
      },
    });

    return payment.id;
  });
}

// ---------------------------------------------------------------------------
// Mutations — Fines
// ---------------------------------------------------------------------------

export async function issueFine(
  associationId: string,
  data: {
    membershipId: string;
    reason: string;
    amount: number;
    dueDate?: Date | null;
    issuedById?: string | null;
  }
): Promise<string | { error: string }> {
  // Verify member belongs to this association
  const member = await prisma.membership.findFirst({
    where: { id: data.membershipId, associationId },
  });

  if (!member) {
    return { error: "Member not found." };
  }

  const fine = await prisma.fine.create({
    data: {
      associationId,
      membershipId: data.membershipId,
      reason: data.reason,
      amount: data.amount,
      status: "PENDING",
      issuedById: data.issuedById ?? null,
      dueDate: data.dueDate ?? null,
    },
    select: { id: true },
  });

  return fine.id;
}

export async function waiveFine(
  associationId: string,
  fineId: string,
  waivedById: string,
  waivedReason: string
): Promise<boolean> {
  const fine = await prisma.fine.findFirst({
    where: { id: fineId, associationId },
  });

  if (!fine) return false;
  if (fine.status === "PAID" || fine.status === "WAIVED" || fine.status === "CANCELLED") {
    return false;
  }

  await prisma.fine.update({
    where: { id: fineId },
    data: {
      status: "WAIVED",
      waivedById,
      waivedReason,
    },
  });

  return true;
}

export async function cancelFine(
  associationId: string,
  fineId: string
): Promise<boolean> {
  const fine = await prisma.fine.findFirst({
    where: { id: fineId, associationId },
  });

  if (!fine) return false;
  if (fine.status === "PAID" || fine.status === "WAIVED" || fine.status === "CANCELLED") {
    return false;
  }

  await prisma.fine.update({
    where: { id: fineId },
    data: { status: "CANCELLED" },
  });

  return true;
}
