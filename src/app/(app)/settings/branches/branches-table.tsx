"use client";

import { useTransition, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Pencil, Building, MapPin, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deactivateBranchAction,
  activateBranchAction,
} from "@/server/services/branch-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BranchListItem } from "@/server/services/branch-service";

interface BranchesTableProps {
  branches: BranchListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function BranchesTable({
  branches,
  total,
  page,
  totalPages,
}: BranchesTableProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filtered = useMemo(() => {
    if (!search) return branches;
    const q = search.toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.state?.toLowerCase().includes(q)
    );
  }, [branches, search]);

  function handleDeactivate(branchId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("branchId", branchId);
      await deactivateBranchAction(null, formData);
      router.refresh();
    });
  }

  function handleActivate(branchId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("branchId", branchId);
      await activateBranchAction(null, formData);
      router.refresh();
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
          placeholder="Search branches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {total} branch{total !== 1 ? "es" : ""} total
        </span>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Branch</th>
              <th className="px-4 py-3 text-left font-medium">Code</th>
              <th className="px-4 py-3 text-left font-medium">State</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Members</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No branches found.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {b.isHeadquarters ? (
                        <Building className="size-4 text-amber-500" />
                      ) : (
                        <MapPin className="size-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">{b.name}</div>
                        {b.address && (
                          <div className="text-xs text-muted-foreground">
                            {b.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{b.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.state ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        b.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                      )}
                    >
                      {b.status}
                    </span>
                    {b.isHeadquarters && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                        HQ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.memberCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/settings/branches/${b.id}/edit`}>
                        <Button variant="ghost" size="sm" title="Edit branch">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      {b.status === "ACTIVE" && !b.isHeadquarters ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(b.id)}
                          disabled={isPending}
                          title="Deactivate branch"
                        >
                          <XCircle className="size-4" />
                        </Button>
                      ) : b.status === "INACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleActivate(b.id)}
                          disabled={isPending}
                          title="Activate branch"
                        >
                          <CheckCircle className="size-4" />
                        </Button>
                      ) : null}
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
