"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Eye, Pencil, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DocumentListItem } from "@/server/services/document-service";

interface DocumentsTableProps {
  documents: DocumentListItem[];
  total: number;
  page: number;
  totalPages: number;
}

const categoryLabels: Record<string, string> = {
  CONSTITUTION: "Constitution",
  MINUTES: "Minutes",
  FINANCIAL_REPORT: "Financial Report",
  POLICY: "Policy",
  CERTIFICATE: "Certificate",
  OTHER: "Other",
};

const visibilityLabels: Record<string, string> = {
  PUBLIC: "Public",
  MEMBERS_ONLY: "Members Only",
  EXECUTIVES_ONLY: "Executives Only",
  ADMIN_ONLY: "Admin Only",
};

const visibilityColors: Record<string, string> = {
  PUBLIC: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  MEMBERS_ONLY: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  EXECUTIVES_ONLY: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  ADMIN_ONLY: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsTable({
  documents,
  total,
  page,
  totalPages,
}: DocumentsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const filtered = useMemo(() => {
    if (!search) return documents;
    const q = search.toLowerCase();
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.uploadedByName?.toLowerCase().includes(q)
    );
  }, [documents, search]);

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
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {total} document{total !== 1 ? "s" : ""} total
        </span>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Visibility</th>
              <th className="px-4 py-3 text-left font-medium">Size</th>
              <th className="px-4 py-3 text-left font-medium">Uploaded</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No documents found.
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/documents/${d.id}`}
                      className="font-medium hover:underline inline-flex items-center gap-1.5"
                    >
                      <FileText className="size-4 text-muted-foreground" />
                      {d.title}
                    </Link>
                    {d.branchName && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({d.branchName})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {categoryLabels[d.category] ?? d.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${visibilityColors[d.visibility] ?? ""}`}
                    >
                      {visibilityLabels[d.visibility] ?? d.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatFileSize(d.fileSizeBytes)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {d.uploadedByName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/documents/${d.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="size-4" />
                        </Button>
                      </Link>
                      <Link href={`/documents/${d.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="size-4" />
                        </Button>
                      </a>
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
