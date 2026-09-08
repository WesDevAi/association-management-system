"use client";

import { useTransition } from "react";
import { UserX, UserCheck, ClipboardCheck, Briefcase, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateMemberRoleAction, deactivateMemberAction, reactivateMemberAction } from "@/server/services/member-actions";
import { Button } from "@/components/ui/button";
import type { MemberListItem } from "@/server/services/member-service";

interface MembersTableProps {
  members: MemberListItem[];
  associationId: string;
}

export function MembersTable({ members, associationId }: MembersTableProps) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(memberId: string, roleKey: string) {
    const tierMap: Record<string, string> = {
      ASSOCIATION_ADMIN: "1",
      STAFF: "2",
      AUDITOR: "3",
      MEMBER: "4",
    };
    startTransition(async () => {
      const formData = new FormData();
      formData.set("memberId", memberId);
      formData.set("associationId", associationId);
      formData.set("roleId", tierMap[roleKey] ?? roleKey);
      await updateMemberRoleAction(formData);
    });
  }

  function handleDeactivate(memberId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("memberId", memberId);
      formData.set("associationId", associationId);
      await deactivateMemberAction(formData);
    });
  }

  function handleReactivate(memberId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("memberId", memberId);
      formData.set("associationId", associationId);
      await reactivateMemberAction(formData);
    });
  }

  return (
    <div className="rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Member</th>
            <th className="px-4 py-3 text-left font-medium">Role</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Member #</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium">{member.fullName}</div>
                <div className="text-xs text-muted-foreground">{member.email}</div>
              </td>
              <td className="px-4 py-3">
                <select
                  defaultValue={member.roleKey}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  disabled={isPending}
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                >
                  <option value="ASSOCIATION_ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="MEMBER">Member</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    member.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : member.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                  )}
                >
                  {member.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{member.membershipNumber}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <a
                    href={`/members/${member.id}/attendance`}
                    className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="View attendance"
                  >
                    <ClipboardCheck className="size-4" />
                  </a>
                  <a
                    href={`/members/${member.id}/executive-history`}
                    className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="View executive history"
                  >
                    <Briefcase className="size-4" />
                  </a>
                  <a
                    href={`/finance/payments?member=${member.id}`}
                    className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="View payment history"
                  >
                    <CreditCard className="size-4" />
                  </a>
                  {member.status === "ACTIVE" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeactivate(member.id)}
                      disabled={isPending}
                      title="Deactivate"
                    >
                      <UserX className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleReactivate(member.id)}
                      disabled={isPending}
                      title="Reactivate"
                    >
                      <UserCheck className="size-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {members.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No members yet. The first member is created when an association is set up.
        </div>
      )}
    </div>
  );
}
