import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getMembershipReport } from "@/server/services/report-service";
import { StatCard } from "@/components/app-shell/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, UserX, Building } from "lucide-react";
import { MembershipReportExport } from "./membership-report-export";

export const metadata = {
  title: "Membership Report",
};

export default async function MembershipReportPage() {
  const context = await requirePermission(PERMISSIONS.REPORTS_VIEW);
  const associationId = context.membership.associationId;

  const report = await getMembershipReport(associationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Membership Report</h1>
          <p className="text-sm text-muted-foreground">
            Overview of association membership statistics and trends.
          </p>
        </div>
        <MembershipReportExport report={report} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Members" value={report.totalMembers} icon={Users} />
        <StatCard label="Active" value={report.active} icon={UserCheck} />
        <StatCard label="Pending" value={report.pending} icon={Clock} />
        <StatCard label="Inactive" value={report.inactive} icon={UserX} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Members by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            {report.membersByBranch.length === 0 ? (
              <p className="text-sm text-muted-foreground">No branch data available.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {report.membersByBranch.map((item) => (
                  <div key={item.branchName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.branchName}</span>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Members by Role</CardTitle>
          </CardHeader>
          <CardContent>
            {report.membersByRole.length === 0 ? (
              <p className="text-sm text-muted-foreground">No role data available.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {report.membersByRole.map((item) => (
                  <div key={item.roleName} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.roleName}</span>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-center">
            <div>
              <p className="text-2xl font-semibold">{report.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{report.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{report.inactive}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{report.suspended}</p>
              <p className="text-xs text-muted-foreground">Suspended</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{report.expelled}</p>
              <p className="text-xs text-muted-foreground">Expelled</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{report.alumni}</p>
              <p className="text-xs text-muted-foreground">Alumni</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {report.recentRegistrations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <div className="rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Membership #</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Branch</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {report.recentRegistrations.map((m) => (
                    <tr key={m.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.fullName}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.membershipNumber}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.roleName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.branchName ?? "Unassigned"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            m.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : m.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(m.joinedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
