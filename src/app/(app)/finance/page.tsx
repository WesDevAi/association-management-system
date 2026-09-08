import { Landmark, Wallet, CreditCard, TrendingUp, TrendingDown, AlertTriangle, Users, Receipt } from "lucide-react";
import Link from "next/link";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getFinanceStats } from "@/server/services/finance-service";
import { getExpenseStats, getExpenses } from "@/server/services/expense-service";
import { StatCard } from "@/components/app-shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default async function FinancePage() {
  const context = await requirePermission(PERMISSIONS.FINANCE_VIEW);
  const associationId = context.membership.associationId;

  const [stats, expenseStats, recentExpenses] = await Promise.all([
    getFinanceStats(associationId),
    getExpenseStats(associationId),
    getExpenses(associationId, { limit: 5, sort: "date", order: "desc" }),
  ]);

  const netBalance = Number(stats.totalCollected) - Number(expenseStats.totalExpenses);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
        <p className="text-sm text-muted-foreground">
          Overview of financial health, collections, expenses, and outstanding balances.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Collected"
          value={`₦${Number(stats.totalCollected).toLocaleString()}`}
          icon={TrendingUp}
          emptyHint={stats.totalCollected === "0.00" ? "No collections yet" : undefined}
        />
        <StatCard
          label="Total Expenses"
          value={`₦${Number(expenseStats.totalExpenses).toLocaleString()}`}
          icon={TrendingDown}
          emptyHint={expenseStats.expenseCount === 0 ? "No expenses yet" : undefined}
        />
        <StatCard
          label="Net Balance"
          value={`₦${netBalance.toLocaleString()}`}
          icon={Wallet}
        />
        <StatCard
          label="Collection Rate"
          value={`${stats.collectionRate}%`}
          icon={Landmark}
          emptyHint={stats.paymentCount === 0 ? "No payments recorded" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly Income"
          value={`₦${Number(stats.collectedThisMonth).toLocaleString()}`}
          icon={CreditCard}
        />
        <StatCard
          label="Monthly Expenses"
          value={`₦${Number(expenseStats.thisMonth).toLocaleString()}`}
          icon={Receipt}
        />
        <StatCard
          label="Outstanding Fines"
          value={`₦${Number(stats.totalFinesOutstanding).toLocaleString()}`}
          icon={AlertTriangle}
          emptyHint={stats.totalFinesOutstanding === "0.00" ? "No fines" : undefined}
        />
        <StatCard
          label="Members with Balance"
          value={stats.membersWithBalance}
          icon={Users}
          emptyHint={stats.membersWithBalance === 0 ? "All clear" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Link href="/finance/payments" className="text-primary underline-offset-4 hover:underline">
              Record Payment
            </Link>
            <Link href="/finance/expenses/new" className="text-primary underline-offset-4 hover:underline">
              Record Expense
            </Link>
            <Link href="/finance/categories" className="text-primary underline-offset-4 hover:underline">
              Manage Categories
            </Link>
            <Link href="/finance/expense-categories" className="text-primary underline-offset-4 hover:underline">
              Expense Categories
            </Link>
            <Link href="/finance/balances" className="text-primary underline-offset-4 hover:underline">
              Member Balances
            </Link>
            <Link href="/finance/reports" className="text-primary underline-offset-4 hover:underline">
              Financial Reports
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {stats.paymentCount > 0 || expenseStats.expenseCount > 0
              ? `Collected: ₦${Number(stats.totalCollected).toLocaleString()} from ${stats.paymentCount} payment(s). Expenses: ₦${Number(expenseStats.totalExpenses).toLocaleString()} from ${expenseStats.expenseCount} expense(s). Net: ₦${netBalance.toLocaleString()}.`
              : "No financial activity yet. Start by recording payments and expenses."}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses recorded.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentExpenses.expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <Link
                        href={`/finance/expenses/${e.id}`}
                        className="font-medium hover:underline"
                      >
                        {e.payeeVendor}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {format(e.date, "MMM d")} · {e.categoryName}
                      </span>
                    </div>
                    <span className="font-medium">₦{Number(e.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
