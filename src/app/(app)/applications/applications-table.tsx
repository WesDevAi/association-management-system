"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveApplicationAction, rejectApplicationAction } from "@/server/services/member-actions";
import type { MemberApplicationListItem } from "@/server/services/member-service";

interface ApplicationsTableProps {
  applications: MemberApplicationListItem[];
  associationId: string;
}

export function ApplicationsTable({ applications, associationId }: ApplicationsTableProps) {
  const [isPending, startTransition] = useTransition();

  async function handleApprove(applicationId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("applicationId", applicationId);
      formData.set("associationId", associationId);
      await approveApplicationAction(formData);
    });
  }

  async function handleReject(applicationId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("applicationId", applicationId);
      formData.set("associationId", associationId);
      await rejectApplicationAction(formData);
    });
  }

  return (
    <div className="rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Applicant</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Branch</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Applied</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3 font-medium">{app.fullName}</td>
              <td className="px-4 py-3 text-muted-foreground">{app.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{app.branchName ?? "—"}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                  {app.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {app.appliedAt.toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(app.id)}
                    disabled={isPending}
                  >
                    <Check className="mr-1 size-3" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(app.id)}
                    disabled={isPending}
                  >
                    <X className="mr-1 size-3" />
                    Reject
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {applications.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No pending applications.
        </div>
      )}
    </div>
  );
}
