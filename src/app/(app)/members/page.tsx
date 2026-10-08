import { requirePermission } from "@/server/permissions/guards";
import { getMembers, getMemberStats } from "@/server/services/member-service";
import { MembersTable } from "./members-table";
import { MembersStats } from "./members-stats";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function MembersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    branchId?: string;
    page?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await requirePermission("members.view");
  const associationId = context.membership.associationId;

  const page = Number(resolvedSearchParams?.page) || 1;

  const [result, stats, branches] = await Promise.all([
    getMembers(associationId, {
      search: resolvedSearchParams?.search,
      status: resolvedSearchParams?.status,
      branchId: resolvedSearchParams?.branchId,
      page,
      limit: 50,
    }),
    getMemberStats(associationId),
    prisma.branch.findMany({
      where: { associationId, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (resolvedSearchParams?.search) params.set("search", resolvedSearchParams.search);
    if (resolvedSearchParams?.status) params.set("status", resolvedSearchParams.status);
    if (resolvedSearchParams?.branchId) params.set("branchId", resolvedSearchParams.branchId);
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.delete("page");
    return `/members?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          Manage association members and their roles.
        </p>
      </div>

      <MembersStats stats={stats} />

      <div className="rounded-md border border-border p-4">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              name="search"
              placeholder="Name, email, or member #"
              defaultValue={resolvedSearchParams?.search}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={resolvedSearchParams?.status}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="branchId">Branch</Label>
            <select
              id="branchId"
              name="branchId"
              defaultValue={resolvedSearchParams?.branchId}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" size="sm">
              Filter
            </Button>
            <Link href="/members">
              <Button type="button" variant="outline" size="sm">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </div>

      <MembersTable members={result.members} associationId={associationId} />

      {result.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {result.page} of {result.totalPages} ({result.total} members)
          </p>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Link href={buildUrl({ page: String(result.page - 1) })}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {result.page < result.totalPages && (
              <Link href={buildUrl({ page: String(result.page + 1) })}>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
