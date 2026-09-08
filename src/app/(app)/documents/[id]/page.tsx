import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getDocument } from "@/server/services/document-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentDetailClient } from "./document-detail-client";

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
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission(PERMISSIONS.DOCUMENTS_VIEW);
  const associationId = context.membership.associationId;

  const doc = await getDocument(associationId, id);

  if (!doc) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">
            Document details and management.
          </p>
        </div>
        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="mr-1.5 size-4" />
            Open
          </Button>
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Description</dt>
                  <dd className="mt-1 text-sm whitespace-pre-wrap">
                    {doc.description ?? "No description provided."}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Category</dt>
                  <dd className="mt-1 text-sm">{categoryLabels[doc.category]}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Visibility</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${visibilityColors[doc.visibility] ?? ""}`}
                    >
                      {visibilityLabels[doc.visibility]}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">File Type</dt>
                  <dd className="mt-1 text-sm">{doc.fileType ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">File Size</dt>
                  <dd className="mt-1 text-sm">{formatFileSize(doc.fileSizeBytes)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">File URL</dt>
                  <dd className="mt-1">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {doc.fileUrl}
                    </a>
                  </dd>
                </div>
                {doc.branchName && (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Branch</dt>
                    <dd className="mt-1 text-sm">{doc.branchName}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentDetailClient document={doc} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Uploaded by</span>
                <span className="font-medium">{doc.uploadedByName ?? "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {new Date(doc.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last updated</span>
                <span className="font-medium">
                  {new Date(doc.updatedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
