"use client";

import { useTransition, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Pencil,
  Trash2,
  Shield,
  ShieldAlert,
  Users,
  Crown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { deleteRoleAction } from "@/server/services/role-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoleListItem } from "@/server/services/role-service";

interface RolesTableProps {
  roles: RoleListItem[];
  total: number;
  page: number;
  totalPages: number;
  associationId: string;
}

export function RolesTable({
  roles,
  total,
  page,
  totalPages,
  associationId,
}: RolesTableProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.key.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [roles, search]);

  function handleDelete(roleId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("roleId", roleId);
      const result = await deleteRoleAction(null, formData);
      if (result && "error" in result) {
        alert(result.error);
      } else {
        setConfirmDeleteId(null);
        router.refresh();
      }
    });
  }

  function buildUrl(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    return `${pathname}?${sp.toString()}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {total} role{total !== 1 ? "s" : ""} total
        </span>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Permissions</th>
              <th className="px-4 py-3 text-left font-medium">Members</th>
              <th className="px-4 py-3 text-left font-medium">Executives</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No roles found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.isSystem ? (
                        <ShieldAlert className="size-4 text-muted-foreground" />
                      ) : (
                        <Shield className="size-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{r.name}</div>
                        {r.description && (
                          <div className="text-xs text-muted-foreground">
                            {r.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        r.isSystem
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                      )}
                    >
                      {r.isSystem ? "System" : "Custom"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.permissionCount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" />
                      {r.memberCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Crown className="size-3" />
                      {r.executiveCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/roles-permissions/${r.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={r.isSystem}
                          title={r.isSystem ? "Cannot edit system role" : "Edit role"}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      {!r.isSystem && r.associationId === associationId && (
                        <>
                          {confirmDeleteId === r.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(r.id)}
                                disabled={isPending}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDeleteId(r.id)}
                              title={
                                r.memberCount > 0 || r.executiveCount > 0
                                  ? "Cannot delete — role is in use"
                                  : "Delete role"
                              }
                              disabled={r.memberCount > 0 || r.executiveCount > 0}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(buildUrl({ page: String(page - 1) }))}
              >
                Previous
              </Button>
            )}
            {page < totalPages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(buildUrl({ page: String(page + 1) }))}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
