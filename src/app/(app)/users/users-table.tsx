"use client";

import { useTransition } from "react";
import { Link2, Unlink, Mail } from "lucide-react";
import {
  updateMembershipRoleAction,
  updateMembershipStatusAction,
  linkUserAccountAction,
  unlinkUserAccountAction,
  inviteMembershipAccountAction,
} from "@/server/services/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { AssociationUserItem } from "@/server/services/user-service";

interface UsersTableProps {
  users: AssociationUserItem[];
  roles: { id: string; key: string; name: string; isSystem: boolean }[];
  total: number;
  page: number;
  totalPages: number;
  associationId: string;
}

const statusOptions = ["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED", "EXPELLED", "ALUMNI"];

export function UsersTable({
  users,
  roles,
  total,
  page,
  totalPages,
}: UsersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.membershipNumber.toLowerCase().includes(q) ||
        u.userName?.toLowerCase().includes(q) ||
        u.userEmail?.toLowerCase().includes(q)
    );
  }, [users, search]);

  function handleRoleChange(membershipId: string, roleId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("membershipId", membershipId);
      formData.set("roleId", roleId);
      await updateMembershipRoleAction(null, formData);
    });
  }

  function handleStatusChange(membershipId: string, status: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("membershipId", membershipId);
      formData.set("status", status);
      await updateMembershipStatusAction(null, formData);
    });
  }

  const [linkQuery, setLinkQuery] = useState("");
  const [linkResults, setLinkResults] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [linkLoading, setLinkLoading] = useState(false);

  async function searchUsersForLinking(query: string) {
    setLinkQuery(query);
    if (query.length < 2) {
      setLinkResults([]);
      return;
    }
    setLinkLoading(true);
    const sp = new URLSearchParams();
    sp.set("q", query);
    const res = await fetch(`/api/users/search?${sp.toString()}`);
    if (res.ok) {
      setLinkResults(await res.json());
    }
    setLinkLoading(false);
  }

  function handleLink(membershipId: string, userId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("membershipId", membershipId);
      formData.set("userId", userId);
      await linkUserAccountAction(null, formData);
      setLinkingId(null);
      setLinkQuery("");
      setLinkResults([]);
    });
  }

  function handleUnlink(membershipId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("membershipId", membershipId);
      await unlinkUserAccountAction(null, formData);
    });
  }

  function handleInvite(membershipId: string) {
    setNotice(null);
    startTransition(async () => {
      const result = await inviteMembershipAccountAction(membershipId);
      setNotice("success" in result ? result.success : result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {notice && <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm" role="status">{notice}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name, email, or member #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {total} member{total !== 1 ? "s" : ""} total
        </span>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Member</th>
              <th className="px-4 py-3 text-left font-medium">Branch</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Account</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.membershipId} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.email} &middot; #{u.membershipNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.branchName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue={u.roleId}
                      onChange={(e) =>
                        handleRoleChange(u.membershipId, e.target.value)
                      }
                      disabled={isPending}
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue={u.status}
                      onChange={(e) =>
                        handleStatusChange(u.membershipId, e.target.value)
                      }
                      disabled={isPending}
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.userId ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                        <Link2 className="size-3" />
                        {u.userName ?? u.userEmail}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        <Unlink className="size-3" />
                        No account
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.userId ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlink(u.membershipId)}
                          disabled={isPending}
                          title="Unlink account"
                        >
                          <Unlink className="size-4" />
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleInvite(u.membershipId)} disabled={isPending || !u.email} title={u.email ? "Email account invitation" : "Add an email address before inviting"}>
                            <Mail className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLinkingId(linkingId === u.membershipId ? null : u.membershipId)}
                            disabled={isPending}
                            title="Link existing account"
                          >
                            <Link2 className="size-4" />
                          </Button>
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
        </div>
      )}

      {linkingId && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Link User Account</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLinkingId(null);
                setLinkQuery("");
                setLinkResults([]);
              }}
            >
              Cancel
            </Button>
          </div>
          <Input
            placeholder="Search by name or email..."
            value={linkQuery}
            onChange={(e) => searchUsersForLinking(e.target.value)}
            className="max-w-sm mb-2"
            autoFocus
          />
          {linkLoading && (
            <p className="text-xs text-muted-foreground">Searching...</p>
          )}
          {linkResults.length > 0 && (
            <div className="flex flex-col gap-1">
              {linkResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLink(linkingId, user.id)}
                    disabled={isPending}
                  >
                    Link
                  </Button>
                </div>
              ))}
            </div>
          )}
          {linkQuery.length >= 2 && !linkLoading && linkResults.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No unlinked users found matching &quot;{linkQuery}&quot;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
