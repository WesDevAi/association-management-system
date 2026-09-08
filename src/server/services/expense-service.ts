import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExpenseCategoryListItem = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  expenseCount: number;
  totalAmount: string;
  createdAt: Date;
};

export type ExpenseListItem = {
  id: string;
  reference: string;
  categoryName: string;
  amount: string;
  currency: string;
  date: Date;
  description: string;
  paymentMethod: string;
  payeeVendor: string;
  referenceNumber: string | null;
  notes: string | null;
  recordedByName: string | null;
  hasReceipt: boolean;
  createdAt: Date;
};

export type ExpenseDetail = ExpenseListItem & {
  expenseCategoryId: string;
  receiptDocumentId: string | null;
  recordedById: string | null;
  financialTransactionId: string | null;
  receiptDocument?: { id: string; title: string; fileUrl: string; fileType: string | null } | null;
  financialTransaction?: { id: string; type: string; amount: string; category: string; transactionDate: Date } | null;
};

export type ExpenseStats = {
  totalExpenses: string;
  thisMonth: string;
  thisYear: string;
  expenseCount: number;
  categoryCount: number;
};

export type CategoryTotal = {
  categoryId: string;
  categoryName: string;
  totalAmount: string;
  expenseCount: number;
};

// ---------------------------------------------------------------------------
// Reference Generation — server-side only, EXP-YYYY-######
// ---------------------------------------------------------------------------

async function generateExpenseReference(associationId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;

  const lastExpense = await prisma.expense.findFirst({
    where: {
      associationId,
      reference: { startsWith: prefix },
    },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });

  let sequence = 1;
  if (lastExpense) {
    const lastNum = parseInt(lastExpense.reference.split("-")[2] ?? "0", 10);
    sequence = lastNum + 1;
  }

  return `${prefix}${String(sequence).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// Queries — Expense Categories
// ---------------------------------------------------------------------------

export async function getExpenseCategories(
  associationId: string,
  opts?: { includeInactive?: boolean }
): Promise<ExpenseCategoryListItem[]> {
  const where: Record<string, unknown> = { associationId };
  if (!opts?.includeInactive) {
    where.isActive = true;
  }

  const categories = await prisma.expenseCategory.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      expenses: {
        select: { amount: true },
      },
    },
  });

  return categories.map((c) => {
    const totalAmount = c.expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      isActive: c.isActive,
      expenseCount: c.expenses.length,
      totalAmount: totalAmount.toFixed(2),
      createdAt: c.createdAt,
    };
  });
}

export async function getExpenseCategory(
  associationId: string,
  categoryId: string
): Promise<ExpenseCategoryListItem | null> {
  const category = await prisma.expenseCategory.findFirst({
    where: { id: categoryId, associationId },
    include: {
      expenses: {
        select: { amount: true },
      },
    },
  });

  if (!category) return null;

  const totalAmount = category.expenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    expenseCount: category.expenses.length,
    totalAmount: totalAmount.toFixed(2),
    createdAt: category.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Queries — Expenses
// ---------------------------------------------------------------------------

export async function getExpenses(
  associationId: string,
  opts?: {
    search?: string;
    categoryId?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ expenses: ExpenseListItem[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const where: Prisma.ExpenseWhereInput = { associationId };

  if (opts?.search) {
    where.OR = [
      { reference: { contains: opts.search, mode: "insensitive" } },
      { description: { contains: opts.search, mode: "insensitive" } },
      { payeeVendor: { contains: opts.search, mode: "insensitive" } },
      { referenceNumber: { contains: opts.search, mode: "insensitive" } },
      { expenseCategory: { name: { contains: opts.search, mode: "insensitive" } } },
    ];
  }

  if (opts?.categoryId) {
    where.expenseCategoryId = opts.categoryId;
  }

  if (opts?.paymentMethod) {
    where.paymentMethod = opts.paymentMethod as "CASH" | "BANK_TRANSFER" | "CARD" | "USSD" | "OTHER";
  }

  if (opts?.dateFrom || opts?.dateTo) {
    where.date = {};
    if (opts.dateFrom) {
      where.date.gte = new Date(opts.dateFrom);
    }
    if (opts.dateTo) {
      const toDate = new Date(opts.dateTo);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }

  const sortField = opts?.sort === "amount" ? "amount" : opts?.sort === "createdAt" ? "createdAt" : "date";
  const sortOrder = opts?.order === "asc" ? "asc" : "desc";
  const page = opts?.page ?? 1;
  const pageSize = opts?.limit ?? 20;
  const skip = (page - 1) * pageSize;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: pageSize,
      include: {
        expenseCategory: { select: { name: true } },
        recordedBy: { select: { name: true } },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    expenses: expenses.map((e) => ({
      id: e.id,
      reference: e.reference,
      categoryName: e.expenseCategory.name,
      amount: e.amount.toString(),
      currency: e.currency,
      date: e.date,
      description: e.description,
      paymentMethod: e.paymentMethod,
      payeeVendor: e.payeeVendor,
      referenceNumber: e.referenceNumber,
      notes: e.notes,
      recordedByName: e.recordedBy?.name ?? null,
      hasReceipt: e.receiptDocumentId !== null,
      createdAt: e.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getExpense(
  associationId: string,
  expenseId: string
): Promise<ExpenseDetail | null> {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, associationId },
    include: {
      expenseCategory: { select: { name: true } },
      recordedBy: { select: { name: true } },
      receiptDocument: { select: { id: true, title: true, fileUrl: true, fileType: true } },
      financialTransaction: { select: { id: true, type: true, amount: true, category: true, transactionDate: true } },
    },
  });

  if (!expense) return null;

  return {
    id: expense.id,
    reference: expense.reference,
    categoryName: expense.expenseCategory.name,
    amount: expense.amount.toString(),
    currency: expense.currency,
    date: expense.date,
    description: expense.description,
    paymentMethod: expense.paymentMethod,
    payeeVendor: expense.payeeVendor,
    referenceNumber: expense.referenceNumber,
    notes: expense.notes,
    recordedByName: expense.recordedBy?.name ?? null,
    hasReceipt: expense.receiptDocumentId !== null,
    createdAt: expense.createdAt,
    expenseCategoryId: expense.expenseCategoryId,
    receiptDocumentId: expense.receiptDocumentId,
    recordedById: expense.recordedById,
    financialTransactionId: expense.financialTransactionId,
    receiptDocument: expense.receiptDocument,
    financialTransaction: expense.financialTransaction
      ? {
          ...expense.financialTransaction,
          amount: expense.financialTransaction.amount.toString(),
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Queries — Expense Stats
// ---------------------------------------------------------------------------

export async function getExpenseStats(
  associationId: string
): Promise<ExpenseStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [allExpenses, thisMonthExpenses, thisYearExpenses, categoryCount] =
    await Promise.all([
      prisma.expense.findMany({
        where: { associationId },
        select: { amount: true },
      }),
      prisma.expense.findMany({
        where: { associationId, date: { gte: startOfMonth } },
        select: { amount: true },
      }),
      prisma.expense.findMany({
        where: { associationId, date: { gte: startOfYear } },
        select: { amount: true },
      }),
      prisma.expenseCategory.count({
        where: { associationId, isActive: true },
      }),
    ]);

  const totalExpenses = allExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const monthTotal = thisMonthExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const yearTotal = thisYearExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  return {
    totalExpenses: totalExpenses.toFixed(2),
    thisMonth: monthTotal.toFixed(2),
    thisYear: yearTotal.toFixed(2),
    expenseCount: allExpenses.length,
    categoryCount,
  };
}

// ---------------------------------------------------------------------------
// Queries — Category Totals
// ---------------------------------------------------------------------------

export async function getCategoryTotals(
  associationId: string,
  opts?: { dateFrom?: string; dateTo?: string }
): Promise<CategoryTotal[]> {
  const where: Prisma.ExpenseWhereInput = { associationId };

  if (opts?.dateFrom || opts?.dateTo) {
    where.date = {};
    if (opts.dateFrom) {
      where.date.gte = new Date(opts.dateFrom);
    }
    if (opts.dateTo) {
      const toDate = new Date(opts.dateTo);
      toDate.setHours(23, 59, 59, 999);
      where.date.lte = toDate;
    }
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { expenseCategory: { select: { id: true, name: true } } },
  });

  const categoryMap = new Map<
    string,
    { categoryName: string; totalAmount: number; expenseCount: number }
  >();

  for (const expense of expenses) {
    const catId = expense.expenseCategoryId;
    const catName = expense.expenseCategory.name;
    const existing = categoryMap.get(catId);
    if (existing) {
      existing.totalAmount += Number(expense.amount);
      existing.expenseCount += 1;
    } else {
      categoryMap.set(catId, {
        categoryName: catName,
        totalAmount: Number(expense.amount),
        expenseCount: 1,
      });
    }
  }

  return Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.categoryName,
      totalAmount: data.totalAmount.toFixed(2),
      expenseCount: data.expenseCount,
    }))
    .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
}

// ---------------------------------------------------------------------------
// Mutations — Expense Categories
// ---------------------------------------------------------------------------

export async function createExpenseCategory(
  associationId: string,
  data: { name: string; description?: string | null }
): Promise<string | { error: string }> {
  const existing = await prisma.expenseCategory.findFirst({
    where: { associationId, name: { equals: data.name, mode: "insensitive" } },
  });

  if (existing) {
    return { error: "An expense category with this name already exists." };
  }

  const category = await prisma.expenseCategory.create({
    data: {
      associationId,
      name: data.name,
      description: data.description ?? null,
    },
    select: { id: true },
  });

  return category.id;
}

export async function updateExpenseCategory(
  associationId: string,
  categoryId: string,
  data: { name?: string; description?: string | null }
): Promise<boolean | { error: string }> {
  const category = await prisma.expenseCategory.findFirst({
    where: { id: categoryId, associationId },
  });

  if (!category) return false;

  if (data.name && data.name !== category.name) {
    const duplicate = await prisma.expenseCategory.findFirst({
      where: {
        associationId,
        name: { equals: data.name, mode: "insensitive" },
        id: { not: categoryId },
      },
    });
    if (duplicate) {
      return { error: "An expense category with this name already exists." };
    }
  }

  await prisma.expenseCategory.update({
    where: { id: categoryId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description || null }),
    },
  });

  return true;
}

export async function deactivateExpenseCategory(
  associationId: string,
  categoryId: string
): Promise<boolean> {
  const category = await prisma.expenseCategory.findFirst({
    where: { id: categoryId, associationId },
  });

  if (!category) return false;

  await prisma.expenseCategory.update({
    where: { id: categoryId },
    data: { isActive: false },
  });

  return true;
}

export async function activateExpenseCategory(
  associationId: string,
  categoryId: string
): Promise<boolean> {
  const category = await prisma.expenseCategory.findFirst({
    where: { id: categoryId, associationId },
  });

  if (!category) return false;

  await prisma.expenseCategory.update({
    where: { id: categoryId },
    data: { isActive: true },
  });

  return true;
}

// ---------------------------------------------------------------------------
// Mutations — Expenses
// ---------------------------------------------------------------------------

export async function createExpense(
  associationId: string,
  data: {
    expenseCategoryId: string;
    amount: number;
    date: Date;
    description: string;
    paymentMethod: string;
    payeeVendor: string;
    referenceNumber?: string | null;
    notes?: string | null;
    receiptDocumentId?: string | null;
    recordedById?: string | null;
  }
): Promise<string | { error: string }> {
  const category = await prisma.expenseCategory.findFirst({
    where: { id: data.expenseCategoryId, associationId, isActive: true },
  });

  if (!category) {
    return { error: "Expense category not found or inactive." };
  }

  if (data.receiptDocumentId) {
    const doc = await prisma.document.findFirst({
      where: { id: data.receiptDocumentId, associationId },
    });
    if (!doc) {
      return { error: "Receipt document not found." };
    }
  }

  const reference = await generateExpenseReference(associationId);

  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        associationId,
        reference,
        expenseCategoryId: data.expenseCategoryId,
        amount: data.amount,
        currency: "NGN",
        date: data.date,
        description: data.description,
        paymentMethod: data.paymentMethod as "CASH" | "BANK_TRANSFER" | "CARD" | "USSD" | "OTHER",
        payeeVendor: data.payeeVendor,
        referenceNumber: data.referenceNumber ?? null,
        notes: data.notes ?? null,
        receiptDocumentId: data.receiptDocumentId ?? null,
        recordedById: data.recordedById ?? null,
      },
      select: { id: true },
    });

    const financialTransaction = await tx.financialTransaction.create({
      data: {
        associationId,
        type: "EXPENSE",
        category: category.name,
        amount: data.amount,
        currency: "NGN",
        description: `${category.name} expense: ${data.description}`,
        transactionDate: data.date,
        recordedById: data.recordedById ?? null,
        receiptDocumentId: data.receiptDocumentId ?? null,
      },
      select: { id: true },
    });

    await tx.expense.update({
      where: { id: expense.id },
      data: { financialTransactionId: financialTransaction.id },
    });

    return expense.id;
  });
}

export async function updateExpense(
  associationId: string,
  expenseId: string,
  data: {
    expenseCategoryId?: string;
    amount?: number;
    date?: Date;
    description?: string;
    paymentMethod?: string;
    payeeVendor?: string;
    referenceNumber?: string | null;
    notes?: string | null;
    receiptDocumentId?: string | null;
  }
): Promise<boolean | { error: string }> {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, associationId },
    include: { expenseCategory: { select: { name: true } } },
  });

  if (!expense) return false;

  if (data.expenseCategoryId && data.expenseCategoryId !== expense.expenseCategoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: data.expenseCategoryId, associationId, isActive: true },
    });
    if (!category) {
      return { error: "Expense category not found or inactive." };
    }
  }

  if (data.receiptDocumentId) {
    const doc = await prisma.document.findFirst({
      where: { id: data.receiptDocumentId, associationId },
    });
    if (!doc) {
      return { error: "Receipt document not found." };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: { id: expenseId },
      data: {
        ...(data.expenseCategoryId !== undefined && { expenseCategoryId: data.expenseCategoryId }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod as "CASH" | "BANK_TRANSFER" | "CARD" | "USSD" | "OTHER" }),
        ...(data.payeeVendor !== undefined && { payeeVendor: data.payeeVendor }),
        ...(data.referenceNumber !== undefined && { referenceNumber: data.referenceNumber || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.receiptDocumentId !== undefined && { receiptDocumentId: data.receiptDocumentId || null }),
      },
    });

    if (expense.financialTransactionId) {
      const category = data.expenseCategoryId
        ? await tx.expenseCategory.findFirst({ where: { id: data.expenseCategoryId }, select: { name: true } })
        : { name: expense.expenseCategory.name };

      await tx.financialTransaction.update({
        where: { id: expense.financialTransactionId },
        data: {
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.date !== undefined && { transactionDate: data.date }),
          ...(category && { category: category.name, description: `${category.name} expense: ${data.description ?? expense.description}` }),
          ...(data.receiptDocumentId !== undefined && { receiptDocumentId: data.receiptDocumentId || null }),
        },
      });
    }
  });

  return true;
}
