import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getMonthlyTotals } from "@/server/services/finance-report-service";
import { StatCard } from "@/components/app-shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { FinanceReportExport } from "../finance-report-export";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await requirePermission(PERMISSIONS.FINANCE_REPORTS_VIEW);
  const associationId = context.membership.associationId;

  const year = resolvedSearchParams?.year ? parseInt(resolvedSearchParams.year) : new Date().getFullYear();
  const months = await getMonthlyTotals(associationId, year);

  const totalIncome = months.reduce((sum, m) => sum + Number(m.income), 0);
  const totalExpenses = months.reduce((sum, m) => sum + Number(m.expenses), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monthly Report — {year}</h1>
          <p className="text-sm text-muted-foreground">
            Month-by-month breakdown of income and expenses.
          </p>
        </div>
        <FinanceReportExport
          title="Month"
          filename={`monthly-report-${year}`}
          rows={months.map((m) => ({
            label: m.monthLabel,
            income: m.income,
            expenses: m.expenses,
            net: m.net,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Income"
          value={`₦${totalIncome.toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Total Expenses"
          value={`₦${totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
        />
        <StatCard
          label="Net Balance"
          value={`₦${(totalIncome - totalExpenses).toLocaleString()}`}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Month</th>
                  <th className="px-4 py-3 text-right font-medium">Income</th>
                  <th className="px-4 py-3 text-right font-medium">Expenses</th>
                  <th className="px-4 py-3 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.month} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-medium">{m.monthLabel}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-600 dark:text-green-400">
                        ₦{Number(m.income).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-red-600 dark:text-red-400">
                        ₦{Number(m.expenses).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          Number(m.net) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        ₦{Number(m.net).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/50 font-medium">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                    ₦{totalIncome.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                    ₦{totalExpenses.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        totalIncome - totalExpenses >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      ₦{(totalIncome - totalExpenses).toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
