import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FinancialSummary = {
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
  totalFinesIssued: string;
  totalFinesPaid: string;
  outstandingFines: string;
  period: string;
};

export type CategoryBreakdown = {
  category: string;
  type: "INCOME" | "EXPENSE";
  totalAmount: string;
  count: number;
};

export type MonthlyTotal = {
  year: number;
  month: number;
  monthLabel: string;
  income: string;
  expenses: string;
  net: string;
};

export type QuarterlyTotal = {
  year: number;
  quarter: number;
  quarterLabel: string;
  income: string;
  expenses: string;
  net: string;
};

export type AnnualTotal = {
  year: number;
  income: string;
  expenses: string;
  net: string;
};

// ---------------------------------------------------------------------------
// Date Range Report
// ---------------------------------------------------------------------------

export async function getDateRangeReport(
  associationId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<FinancialSummary> {
  const now = new Date();
  const from = dateFrom ? new Date(dateFrom) : new Date(now.getFullYear(), 0, 1);
  const to = dateTo ? new Date(dateTo) : now;
  to.setHours(23, 59, 59, 999);

  const [incomeTransactions, expenseTransactions, fines] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: {
        associationId,
        type: "INCOME",
        transactionDate: { gte: from, lte: to },
      },
      select: { amount: true },
    }),
    prisma.financialTransaction.findMany({
      where: {
        associationId,
        type: "EXPENSE",
        transactionDate: { gte: from, lte: to },
      },
      select: { amount: true },
    }),
    prisma.fine.findMany({
      where: {
        associationId,
        issuedAt: { gte: from, lte: to },
      },
      select: {
        amount: true,
        status: true,
        payments: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
    }),
  ]);

  const totalIncome = incomeTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const totalExpenses = expenseTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );
  const totalFinesIssued = fines.reduce(
    (sum, f) => sum + Number(f.amount),
    0
  );
  const totalFinesPaid = fines.reduce((sum, f) => {
    const paid = f.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + paid;
  }, 0);

  const fromLabel = from.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const toLabel = to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return {
    totalIncome: totalIncome.toFixed(2),
    totalExpenses: totalExpenses.toFixed(2),
    netBalance: (totalIncome - totalExpenses).toFixed(2),
    totalFinesIssued: totalFinesIssued.toFixed(2),
    totalFinesPaid: totalFinesPaid.toFixed(2),
    outstandingFines: (totalFinesIssued - totalFinesPaid).toFixed(2),
    period: `${fromLabel} — ${toLabel}`,
  };
}

// ---------------------------------------------------------------------------
// Income by Category
// ---------------------------------------------------------------------------

export async function getIncomeByCategory(
  associationId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<CategoryBreakdown[]> {
  const where: Prisma.FinancialTransactionWhereInput = {
    associationId,
    type: "INCOME",
  };

  if (dateFrom || dateTo) {
    where.transactionDate = {};
    if (dateFrom) where.transactionDate.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.transactionDate.lte = to;
    }
  }

  const transactions = await prisma.financialTransaction.findMany({
    where,
    select: { category: true, amount: true },
  });

  const map = new Map<string, { totalAmount: number; count: number }>();
  for (const t of transactions) {
    const existing = map.get(t.category);
    if (existing) {
      existing.totalAmount += Number(t.amount);
      existing.count += 1;
    } else {
      map.set(t.category, { totalAmount: Number(t.amount), count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      type: "INCOME" as const,
      totalAmount: data.totalAmount.toFixed(2),
      count: data.count,
    }))
    .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
}

// ---------------------------------------------------------------------------
// Expenses by Category
// ---------------------------------------------------------------------------

export async function getExpensesByCategory(
  associationId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<CategoryBreakdown[]> {
  const where: Prisma.FinancialTransactionWhereInput = {
    associationId,
    type: "EXPENSE",
  };

  if (dateFrom || dateTo) {
    where.transactionDate = {};
    if (dateFrom) where.transactionDate.gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.transactionDate.lte = to;
    }
  }

  const transactions = await prisma.financialTransaction.findMany({
    where,
    select: { category: true, amount: true },
  });

  const map = new Map<string, { totalAmount: number; count: number }>();
  for (const t of transactions) {
    const existing = map.get(t.category);
    if (existing) {
      existing.totalAmount += Number(t.amount);
      existing.count += 1;
    } else {
      map.set(t.category, { totalAmount: Number(t.amount), count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      type: "EXPENSE" as const,
      totalAmount: data.totalAmount.toFixed(2),
      count: data.count,
    }))
    .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
}

// ---------------------------------------------------------------------------
// Monthly Totals
// ---------------------------------------------------------------------------

export async function getMonthlyTotals(
  associationId: string,
  year?: number
): Promise<MonthlyTotal[]> {
  const targetYear = year ?? new Date().getFullYear();
  const startOfYear = new Date(targetYear, 0, 1);
  const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

  const transactions = await prisma.financialTransaction.findMany({
    where: {
      associationId,
      transactionDate: { gte: startOfYear, lte: endOfYear },
    },
    select: { type: true, amount: true, transactionDate: true },
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const months: MonthlyTotal[] = [];
  for (let m = 0; m < 12; m++) {
    const monthTransactions = transactions.filter(
      (t) => t.transactionDate.getMonth() === m
    );
    const income = monthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = monthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    months.push({
      year: targetYear,
      month: m + 1,
      monthLabel: monthNames[m],
      income: income.toFixed(2),
      expenses: expenses.toFixed(2),
      net: (income - expenses).toFixed(2),
    });
  }

  return months;
}

// ---------------------------------------------------------------------------
// Quarterly Totals
// ---------------------------------------------------------------------------

export async function getQuarterlyTotals(
  associationId: string,
  year?: number
): Promise<QuarterlyTotal[]> {
  const monthly = await getMonthlyTotals(associationId, year);

  const quarters: QuarterlyTotal[] = [];
  for (let q = 0; q < 4; q++) {
    const startMonth = q * 3;
    const quarterMonths = monthly.filter(
      (m) => m.month >= startMonth + 1 && m.month <= startMonth + 3
    );
    const income = quarterMonths.reduce(
      (sum, m) => sum + Number(m.income),
      0
    );
    const expenses = quarterMonths.reduce(
      (sum, m) => sum + Number(m.expenses),
      0
    );

    quarters.push({
      year: monthly[0]?.year ?? new Date().getFullYear(),
      quarter: q + 1,
      quarterLabel: `Q${q + 1}`,
      income: income.toFixed(2),
      expenses: expenses.toFixed(2),
      net: (income - expenses).toFixed(2),
    });
  }

  return quarters;
}

// ---------------------------------------------------------------------------
// Annual Totals
// ---------------------------------------------------------------------------

export async function getAnnualTotals(
  associationId: string,
  years?: number
): Promise<AnnualTotal[]> {
  const count = years ?? 5;
  const currentYear = new Date().getFullYear();
  const results: AnnualTotal[] = [];

  for (let y = currentYear; y > currentYear - count; y--) {
    const startOfYear = new Date(y, 0, 1);
    const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999);

    const transactions = await prisma.financialTransaction.findMany({
      where: {
        associationId,
        transactionDate: { gte: startOfYear, lte: endOfYear },
      },
      select: { type: true, amount: true },
    });

    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    results.push({
      year: y,
      income: income.toFixed(2),
      expenses: expenses.toFixed(2),
      net: (income - expenses).toFixed(2),
    });
  }

  return results;
}
