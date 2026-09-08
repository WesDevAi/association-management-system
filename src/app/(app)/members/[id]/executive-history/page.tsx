import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getMemberDetail } from "@/server/services/member-service";
import { getMemberExecutiveHistory } from "@/server/services/executive-service";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  REMOVED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  RESIGNED: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  SUSPENDED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
};

const typeLabels: Record<string, string> = {
  ELECTED: "Elected",
  APPOINTED: "Appointed",
  ACTING: "Acting",
  INTERIM: "Interim",
};

export default async function MemberExecutiveHistoryPage({
  params,
}: {
  params: { id: string };
}) {
  const context = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
  const associationId = context.membership.associationId;

  const [member, history] = await Promise.all([
    getMemberDetail(associationId, params.id),
    getMemberExecutiveHistory(associationId, params.id),
  ]);

  if (!member) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to members
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Executive History — {member.fullName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Positions held by this member.
        </p>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              This member has not held any executive positions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Position</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Start Date</th>
                <th className="px-4 py-3 text-left font-medium">End Date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.map((appt) => (
                <tr
                  key={appt.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{appt.positionTitle}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {typeLabels[appt.appointmentType] ?? appt.appointmentType}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(appt.startDate, "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {appt.endDate ? format(appt.endDate, "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusColors[appt.status] ?? "bg-gray-100 text-gray-800"
                      )}
                    >
                      {appt.status.charAt(0) + appt.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                    {appt.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
