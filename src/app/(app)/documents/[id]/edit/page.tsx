import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getDocument, getBranches } from "@/server/services/document-service";
import { EditDocumentForm } from "./edit-document-form";

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission(PERMISSIONS.DOCUMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const [doc, branches] = await Promise.all([
    getDocument(associationId, id),
    getBranches(associationId),
  ]);

  if (!doc) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/documents/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to document
      </Link>

      <EditDocumentForm document={doc} branches={branches} />
    </div>
  );
}
