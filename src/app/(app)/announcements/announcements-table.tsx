"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Pin, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnnouncementListItem } from "@/server/services/announcement-service";

interface AnnouncementsTableProps {
  announcements: AnnouncementListItem[];
  total: number;
  page: number;
  totalPages: number;
}

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  PUBLISHED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
};

const audienceLabels: Record<string, string> = {
  ALL_MEMBERS: "All Members",
  EXECUTIVES_ONLY: "Executives Only",
  BRANCH_ONLY: "Branch Only",
};

export function AnnouncementsTable({
  announcements,
  total,
  page,
  totalPages,
}: AnnouncementsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const filtered = useMemo(() => {
    if (!search) return announcements;
    const q = search.toLowerCase();
    return announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q) ||
        a.authorName?.toLowerCase().includes(q)
    );
  }, [announcements, search]);

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
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {total} announcement{total !== 1 ? "s" : ""} total
        </span>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Audience</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Author</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No announcements found.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/announcements/${a.id}`}
                      className="font-medium hover:underline"
                    >
                      {a.isPinned && (
                        <Pin className="mr-1 inline size-3 text-amber-500" />
                      )}
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {audienceLabels[a.audience] ?? a.audience}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[a.status] ?? ""}`}
                    >
                      {statusLabels[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.authorName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/announcements/${a.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="size-4" />
                        </Button>
                      </Link>
                      <Link href={`/announcements/${a.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
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
