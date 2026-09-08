import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { getBranches } from "@/server/services/document-service";
import { CreateDocumentForm } from "../create-document-form";

export default async function NewDocumentPage() {
  const context = await requirePermission(PERMISSIONS.DOCUMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const branches = await getBranches(associationId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/documents"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to documents
      </Link>

      <CreateDocumentForm branches={branches} />
    </div>
  );
}
