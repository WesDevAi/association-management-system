import Link from "next/link";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getExpenses, getExpenseCategories, getExpenseStats } from "@/server/services/expense-service";
import { ExpensesTable } from "./expenses-table";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/app-shell/stat-card";
import { TrendingUp, Calendar, Tag } from "lucide-react";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams?: {
    search?: string;
    category?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    order?: string;
    page?: string;
  };
}) {
  const context = await requirePermission(PERMISSIONS.EXPENSES_VIEW);
  const associationId = context.membership.associationId;

  const [result, categories, stats] = await Promise.all([
    getExpenses(associationId, {
      search: searchParams?.search,
      categoryId: searchParams?.category,
      paymentMethod: searchParams?.method,
      dateFrom: searchParams?.dateFrom,
      dateTo: searchParams?.dateTo,
      sort: searchParams?.sort,
      order: searchParams?.order,
      page: searchParams?.page ? parseInt(searchParams.page) : 1,
    }),
    getExpenseCategories(associationId),
    getExpenseStats(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Record and manage association expenses.
          </p>
        </div>
        <Link href="/finance/expenses/new">
          <Button>Record Expense</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Expenses"
          value={`₦${Number(stats.totalExpenses).toLocaleString()}`}
          icon={TrendingUp}
          emptyHint={stats.expenseCount === 0 ? "No expenses yet" : undefined}
        />
        <StatCard
          label="This Month"
          value={`₦${Number(stats.thisMonth).toLocaleString()}`}
          icon={Calendar}
        />
        <StatCard
          label="This Year"
          value={`₦${Number(stats.thisYear).toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Categories"
          value={stats.categoryCount}
          icon={Tag}
          emptyHint={stats.categoryCount === 0 ? "No categories" : undefined}
        />
      </div>

      <ExpensesTable
        expenses={result.expenses}
        categories={categories}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
