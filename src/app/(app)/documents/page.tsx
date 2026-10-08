import Link from "next/link";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getDocuments, getDocumentStats } from "@/server/services/document-service";
import { DocumentsTable } from "./documents-table";
import { StatCard } from "@/components/app-shell/stat-card";
import { FileText, FolderOpen, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    search?: string;
    category?: string;
    visibility?: string;
    branchId?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const context = await requirePermission(PERMISSIONS.DOCUMENTS_VIEW);
  const associationId = context.membership.associationId;

  const [result, stats] = await Promise.all([
    getDocuments(associationId, {
      search: resolvedSearchParams?.search,
      category: resolvedSearchParams?.category,
      visibility: resolvedSearchParams?.visibility,
      branchId: resolvedSearchParams?.branchId,
      dateFrom: resolvedSearchParams?.dateFrom,
      dateTo: resolvedSearchParams?.dateTo,
      sort: resolvedSearchParams?.sort,
      order: resolvedSearchParams?.order,
      page: resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page) : 1,
    }),
    getDocumentStats(associationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Manage association documents, policies, and reports.
          </p>
        </div>
        <Link href="/documents/new">
          <Button>Upload Document</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Documents"
          value={stats.total}
          icon={FileText}
          emptyHint={stats.total === 0 ? "No documents yet" : undefined}
        />
        <StatCard
          label="Public"
          value={stats.byVisibility["PUBLIC"] ?? 0}
          icon={FolderOpen}
        />
        <StatCard
          label="Members Only"
          value={stats.byVisibility["MEMBERS_ONLY"] ?? 0}
          icon={Shield}
        />
        <StatCard
          label="Restricted"
          value={(stats.byVisibility["EXECUTIVES_ONLY"] ?? 0) + (stats.byVisibility["ADMIN_ONLY"] ?? 0)}
          icon={Lock}
        />
      </div>

      <DocumentsTable
        documents={result.documents}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
      />
    </div>
  );
}
