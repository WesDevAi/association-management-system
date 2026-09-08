import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getQuarterlyTotals } from "@/server/services/finance-report-service";
import { StatCard } from "@/components/app-shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { FinanceReportExport } from "../finance-report-export";

export default async function QuarterlyReportPage({
  searchParams,
}: {
  searchParams?: { year?: string };
}) {
  const context = await requirePermission(PERMISSIONS.FINANCE_REPORTS_VIEW);
  const associationId = context.membership.associationId;

  const year = searchParams?.year ? parseInt(searchParams.year) : new Date().getFullYear();
  const quarters = await getQuarterlyTotals(associationId, year);

  const totalIncome = quarters.reduce((sum, q) => sum + Number(q.income), 0);
  const totalExpenses = quarters.reduce((sum, q) => sum + Number(q.expenses), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quarterly Report — {year}</h1>
          <p className="text-sm text-muted-foreground">
            Quarter-by-quarter breakdown of income and expenses.
          </p>
        </div>
        <FinanceReportExport
          title="Quarter"
          filename={`quarterly-report-${year}`}
          rows={quarters.map((q) => ({
            label: q.quarterLabel,
            income: q.income,
            expenses: q.expenses,
            net: q.net,
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
          <CardTitle className="text-base">Quarterly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Quarter</th>
                  <th className="px-4 py-3 text-right font-medium">Income</th>
                  <th className="px-4 py-3 text-right font-medium">Expenses</th>
                  <th className="px-4 py-3 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {quarters.map((q) => (
                  <tr key={q.quarter} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-medium">{q.quarterLabel}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-600 dark:text-green-400">
                        ₦{Number(q.income).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-red-600 dark:text-red-400">
                        ₦{Number(q.expenses).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          Number(q.net) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        ₦{Number(q.net).toLocaleString()}
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
