"use client";

import type { AuditLogEntry } from "@/server/services/audit-service";
import { cn } from "@/lib/utils";

interface AuditLogTableProps {
  logs: AuditLogEntry[];
}

const actionLabels: Record<string, string> = {
  "member.created": "Member Created",
  "member.updated": "Member Updated",
  "member.role_changed": "Role Changed",
  "member.deactivated": "Member Deactivated",
  "member.reactivated": "Member Reactivated",
  "application.approved": "Application Approved",
  "application.rejected": "Application Rejected",
  "payment.recorded": "Payment Recorded",
  "payment_category.created": "Category Created",
  "payment_category.updated": "Category Updated",
  "payment_category.deactivated": "Category Deactivated",
  "payment_category.activated": "Category Activated",
  "fine.issued": "Fine Issued",
  "fine.waived": "Fine Waived",
  "fine.cancelled": "Fine Cancelled",
  "expense.recorded": "Expense Recorded",
  "expense.updated": "Expense Updated",
  "expense_category.created": "Expense Category Created",
  "expense_category.updated": "Expense Category Updated",
  "event.created": "Event Created",
  "event.updated": "Event Updated",
  "event.published": "Event Published",
  "event.cancelled": "Event Cancelled",
  "event.completed": "Event Completed",
  "event.registered": "Event Registration",
  "event.registration_cancelled": "Registration Cancelled",
  "event.checked_in": "Event Check-in",
  "meeting.created": "Meeting Created",
  "meeting.updated": "Meeting Updated",
  "meeting.cancelled": "Meeting Cancelled",
  "meeting.status_changed": "Meeting Status Changed",
  "attendance.recorded": "Attendance Recorded",
  "announcement.created": "Announcement Created",
  "announcement.updated": "Announcement Updated",
  "announcement.published": "Announcement Published",
  "announcement.archived": "Announcement Archived",
  "announcement.deleted": "Announcement Deleted",
  "announcement.pinned": "Announcement Pin Toggled",
  "document.created": "Document Uploaded",
  "document.updated": "Document Updated",
  "document.deleted": "Document Deleted",
  "branch.created": "Branch Created",
  "branch.updated": "Branch Updated",
  "branch.activated": "Branch Activated",
  "branch.deactivated": "Branch Deactivated",
  "role.created": "Role Created",
  "role.updated": "Role Updated",
  "role.deleted": "Role Deleted",
  "user.role_changed": "User Role Changed",
  "user.status_changed": "User Status Changed",
  "user.linked": "Account Linked",
  "user.unlinked": "Account Unlinked",
  "settings.updated": "Settings Updated",
};

const actionColors: Record<string, string> = {
  member: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  application: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
  payment: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  payment_category: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  fine: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  expense: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  expense_category: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  event: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  eventRegistration: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  meeting: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
  attendance: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
  announcement: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  document: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100",
  branch: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100",
  role: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100",
  membership: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  association: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

function getActionColor(entityType: string): string {
  return actionColors[entityType] ?? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <div className="rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Action</th>
            <th className="px-4 py-3 text-left font-medium">Entity</th>
            <th className="px-4 py-3 text-left font-medium">Description</th>
            <th className="px-4 py-3 text-left font-medium">User</th>
            <th className="px-4 py-3 text-left font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    getActionColor(log.entityType)
                  )}
                >
                  {actionLabels[log.action] ?? log.action}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{log.entityType}</td>
              <td className="px-4 py-3 max-w-xs truncate">{log.description}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {log.userName ?? "System"}
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {new Date(log.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No audit log entries found.
        </div>
      )}
    </div>
  );
}
