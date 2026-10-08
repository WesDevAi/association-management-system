import Link from "next/link";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import {
  getDateRangeReport,
  getIncomeByCategory,
  getExpensesByCategory,
} from "@/server/services/finance-report-service";
import { StatCard } from "@/components/app-shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, AlertTriangle } from "lucide-react";
import { FinanceReportExport } from "./finance-report-export";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ dateFrom?: string; dateTo?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await requirePermission(PERMISSIONS.FINANCE_REPORTS_VIEW);
  const associationId = context.membership.associationId;

  const [report, incomeByCategory, expensesByCategory] = await Promise.all([
    getDateRangeReport(associationId, resolvedSearchParams?.dateFrom, resolvedSearchParams?.dateTo),
    getIncomeByCategory(associationId, resolvedSearchParams?.dateFrom, resolvedSearchParams?.dateTo),
    getExpensesByCategory(associationId, resolvedSearchParams?.dateFrom, resolvedSearchParams?.dateTo),
  ]);

  const categoryRows = [
    ...incomeByCategory.map((c) => ({
      label: `${c.category} (Income)`,
      income: c.totalAmount,
      expenses: "0.00",
      net: c.totalAmount,
    })),
    ...expensesByCategory.map((c) => ({
      label: `${c.category} (Expense)`,
      income: "0.00",
      expenses: c.totalAmount,
      net: String(-Number(c.totalAmount)),
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">
            {report.period} — Overview of income, expenses, and financial health.
          </p>
        </div>
        <FinanceReportExport
          title="Category"
          filename="finance-overview"
          rows={categoryRows}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Income"
          value={`₦${Number(report.totalIncome).toLocaleString()}`}
          icon={TrendingUp}
          emptyHint={report.totalIncome === "0.00" ? "No income" : undefined}
        />
        <StatCard
          label="Total Expenses"
          value={`₦${Number(report.totalExpenses).toLocaleString()}`}
          icon={TrendingDown}
          emptyHint={report.totalExpenses === "0.00" ? "No expenses" : undefined}
        />
        <StatCard
          label="Net Balance"
          value={`₦${Number(report.netBalance).toLocaleString()}`}
          icon={Wallet}
        />
        <StatCard
          label="Fines Issued"
          value={`₦${Number(report.totalFinesIssued).toLocaleString()}`}
          icon={AlertTriangle}
          emptyHint={report.totalFinesIssued === "0.00" ? "No fines" : undefined}
        />
        <StatCard
          label="Fines Paid"
          value={`₦${Number(report.totalFinesPaid).toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Outstanding Fines"
          value={`₦${Number(report.outstandingFines).toLocaleString()}`}
          icon={AlertTriangle}
          emptyHint={report.outstandingFines === "0.00" ? "All clear" : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Income by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income recorded.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {incomeByCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({item.count} transaction{item.count !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      ₦{Number(item.totalAmount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses recorded.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {expensesByCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({item.count} expense{item.count !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      ₦{Number(item.totalAmount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Links</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <Link href="/finance/reports/monthly" className="text-primary underline-offset-4 hover:underline">
            Monthly Report
          </Link>
          {` · `}
          <Link href="/finance/reports/quarterly" className="text-primary underline-offset-4 hover:underline">
            Quarterly Report
          </Link>
          {` · `}
          <Link href="/finance/reports/annual" className="text-primary underline-offset-4 hover:underline">
            Annual Report
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
