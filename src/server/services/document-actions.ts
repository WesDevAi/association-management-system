"use server";

import {
  createDocumentSchema,
  updateDocumentSchema,
  deleteDocumentSchema,
} from "@/server/validation/document";
import {
  createDocument,
  updateDocument,
  deleteDocument,
} from "@/server/services/document-service";
import { requirePermission } from "@/server/permissions/guards";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { logAudit } from "@/server/services/audit-service";

export type DocumentActionState = { error: string } | { success: string } | null;

// ---------------------------------------------------------------------------
// Document CRUD actions
// ---------------------------------------------------------------------------

export async function createDocumentAction(
  _prevState: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const context = await requirePermission(PERMISSIONS.DOCUMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = createDocumentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    fileUrl: formData.get("fileUrl"),
    fileType: formData.get("fileType"),
    fileSizeBytes: formData.get("fileSizeBytes"),
    category: formData.get("category"),
    visibility: formData.get("visibility"),
    branchId: formData.get("branchId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createDocument(associationId, {
    title: parsed.data.title,
    description: parsed.data.description || null,
    fileUrl: parsed.data.fileUrl,
    fileType: parsed.data.fileType || null,
    fileSizeBytes: typeof parsed.data.fileSizeBytes === "number" ? parsed.data.fileSizeBytes : null,
    category: parsed.data.category,
    visibility: parsed.data.visibility,
    branchId: parsed.data.branchId || null,
    uploadedById: context.user.id,
  });

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "document.created",
    entityType: "document",
    entityId: result as string,
    metadata: { entityName: parsed.data.title },
  });

  return { success: "Document uploaded successfully." };
}

export async function updateDocumentAction(
  _prevState: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const context = await requirePermission(PERMISSIONS.DOCUMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = updateDocumentSchema.safeParse({
    documentId: formData.get("documentId"),
    title: formData.get("title"),
    description: formData.get("description"),
    fileUrl: formData.get("fileUrl"),
    fileType: formData.get("fileType"),
    fileSizeBytes: formData.get("fileSizeBytes"),
    category: formData.get("category"),
    visibility: formData.get("visibility"),
    branchId: formData.get("branchId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await updateDocument(associationId, parsed.data.documentId, {
    title: parsed.data.title,
    description: parsed.data.description,
    fileUrl: parsed.data.fileUrl,
    fileType: parsed.data.fileType,
    fileSizeBytes: typeof parsed.data.fileSizeBytes === "number" ? parsed.data.fileSizeBytes : undefined,
    category: parsed.data.category,
    visibility: parsed.data.visibility,
    branchId: parsed.data.branchId,
  });

  if (!result) {
    return { error: "Document not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "document.updated",
    entityType: "document",
    entityId: parsed.data.documentId,
    metadata: { entityName: parsed.data.title },
  });

  return { success: "Document updated." };
}

export async function deleteDocumentAction(
  formData: FormData
): Promise<DocumentActionState> {
  const context = await requirePermission(PERMISSIONS.DOCUMENTS_MANAGE);
  const associationId = context.membership.associationId;

  const parsed = deleteDocumentSchema.safeParse({
    documentId: formData.get("documentId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await deleteDocument(associationId, parsed.data.documentId);

  if (!result) {
    return { error: "Document not found." };
  }

  if (typeof result === "object" && "error" in result) {
    return { error: result.error };
  }

  await logAudit({
    associationId,
    userId: context.user.id,
    action: "document.deleted",
    entityType: "document",
    entityId: parsed.data.documentId,
  });

  return { success: "Document deleted." };
}
