import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getAnnualTotals } from "@/server/services/finance-report-service";
import { StatCard } from "@/components/app-shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export default async function AnnualReportPage() {
  const context = await requirePermission(PERMISSIONS.FINANCE_REPORTS_VIEW);
  const associationId = context.membership.associationId;

  const years = await getAnnualTotals(associationId, 5);

  const totalIncome = years.reduce((sum, y) => sum + Number(y.income), 0);
  const totalExpenses = years.reduce((sum, y) => sum + Number(y.expenses), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Annual Report</h1>
        <p className="text-sm text-muted-foreground">
          Year-over-year financial summary.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Income (5yr)"
          value={`₦${totalIncome.toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Total Expenses (5yr)"
          value={`₦${totalExpenses.toLocaleString()}`}
          icon={TrendingDown}
        />
        <StatCard
          label="Net Balance (5yr)"
          value={`₦${(totalIncome - totalExpenses).toLocaleString()}`}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Annual Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Year</th>
                  <th className="px-4 py-3 text-right font-medium">Income</th>
                  <th className="px-4 py-3 text-right font-medium">Expenses</th>
                  <th className="px-4 py-3 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y) => (
                  <tr key={y.year} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-medium">{y.year}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-green-600 dark:text-green-400">
                        ₦{Number(y.income).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-red-600 dark:text-red-400">
                        ₦{Number(y.expenses).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          Number(y.net) >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        ₦{Number(y.net).toLocaleString()}
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
