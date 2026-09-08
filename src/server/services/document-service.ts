import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DocumentListItem = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string | null;
  fileSizeBytes: number | null;
  category: string;
  visibility: string;
  branchName: string | null;
  uploadedByName: string | null;
  createdAt: Date;
};

export type DocumentDetail = DocumentListItem & {
  branchId: string | null;
  uploadedById: string | null;
  updatedAt: Date;
};

export type DocumentStats = {
  total: number;
  byCategory: Record<string, number>;
  byVisibility: Record<string, number>;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getDocuments(
  associationId: string,
  opts?: {
    search?: string;
    category?: string;
    visibility?: string;
    branchId?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ documents: DocumentListItem[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const where: Prisma.DocumentWhereInput = { associationId };

  if (opts?.search) {
    where.OR = [
      { title: { contains: opts.search, mode: "insensitive" } },
      { description: { contains: opts.search, mode: "insensitive" } },
    ];
  }

  if (opts?.category && opts.category !== "ALL") {
    where.category = opts.category as "CONSTITUTION" | "MINUTES" | "FINANCIAL_REPORT" | "POLICY" | "CERTIFICATE" | "OTHER";
  }

  if (opts?.visibility && opts.visibility !== "ALL") {
    where.visibility = opts.visibility as "PUBLIC" | "MEMBERS_ONLY" | "EXECUTIVES_ONLY" | "ADMIN_ONLY";
  }

  if (opts?.branchId && opts.branchId !== "ALL") {
    where.branchId = opts.branchId;
  }

  if (opts?.dateFrom || opts?.dateTo) {
    where.createdAt = {};
    if (opts.dateFrom) where.createdAt.gte = new Date(opts.dateFrom);
    if (opts.dateTo) where.createdAt.lte = new Date(opts.dateTo + "T23:59:59.999Z");
  }

  const sortField = opts?.sort === "title" ? "title" : opts?.sort === "category" ? "category" : "createdAt";
  const sortOrder = opts?.order === "asc" ? "asc" : "desc";
  const page = opts?.page ?? 1;
  const pageSize = opts?.limit ?? 20;
  const skip = (page - 1) * pageSize;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: pageSize,
      include: {
        branch: { select: { name: true } },
        uploadedBy: { select: { name: true } },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    documents: documents.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      fileUrl: d.fileUrl,
      fileType: d.fileType,
      fileSizeBytes: d.fileSizeBytes,
      category: d.category,
      visibility: d.visibility,
      branchName: d.branch?.name ?? null,
      uploadedByName: d.uploadedBy?.name ?? null,
      createdAt: d.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getDocument(
  associationId: string,
  documentId: string
): Promise<DocumentDetail | null> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, associationId },
    include: {
      branch: { select: { name: true } },
      uploadedBy: { select: { name: true } },
    },
  });

  if (!doc) return null;

  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    fileUrl: doc.fileUrl,
    fileType: doc.fileType,
    fileSizeBytes: doc.fileSizeBytes,
    category: doc.category,
    visibility: doc.visibility,
    branchName: doc.branch?.name ?? null,
    uploadedByName: doc.uploadedBy?.name ?? null,
    createdAt: doc.createdAt,
    branchId: doc.branchId,
    uploadedById: doc.uploadedById,
    updatedAt: doc.updatedAt,
  };
}

export async function getDocumentStats(associationId: string): Promise<DocumentStats> {
  const [total, categoryCounts, visibilityCounts] = await Promise.all([
    prisma.document.count({ where: { associationId } }),
    prisma.document.groupBy({
      by: ["category"],
      where: { associationId },
      _count: true,
    }),
    prisma.document.groupBy({
      by: ["visibility"],
      where: { associationId },
      _count: true,
    }),
  ]);

  const byCategory: Record<string, number> = {};
  for (const row of categoryCounts) {
    byCategory[row.category] = row._count;
  }

  const byVisibility: Record<string, number> = {};
  for (const row of visibilityCounts) {
    byVisibility[row.visibility] = row._count;
  }

  return { total, byCategory, byVisibility };
}

export async function getBranches(associationId: string): Promise<{ id: string; name: string }[]> {
  return prisma.branch.findMany({
    where: { associationId, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createDocument(
  associationId: string,
  data: {
    title: string;
    description?: string | null;
    fileUrl: string;
    fileType?: string | null;
    fileSizeBytes?: number | null;
    category: string;
    visibility: string;
    branchId?: string | null;
    uploadedById?: string | null;
  }
): Promise<string | { error: string }> {
  if (data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, associationId },
    });
    if (!branch) return { error: "Branch not found." };
  }

  const doc = await prisma.document.create({
    data: {
      associationId,
      title: data.title,
      description: data.description ?? null,
      fileUrl: data.fileUrl,
      fileType: data.fileType ?? null,
      fileSizeBytes: data.fileSizeBytes ?? null,
      category: data.category as "CONSTITUTION" | "MINUTES" | "FINANCIAL_REPORT" | "POLICY" | "CERTIFICATE" | "OTHER",
      visibility: data.visibility as "PUBLIC" | "MEMBERS_ONLY" | "EXECUTIVES_ONLY" | "ADMIN_ONLY",
      branchId: data.branchId ?? null,
      uploadedById: data.uploadedById ?? null,
    },
    select: { id: true },
  });

  return doc.id;
}

export async function updateDocument(
  associationId: string,
  documentId: string,
  data: {
    title?: string;
    description?: string | null;
    fileUrl?: string;
    fileType?: string | null;
    fileSizeBytes?: number | null;
    category?: string;
    visibility?: string;
    branchId?: string | null;
  }
): Promise<boolean | { error: string }> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, associationId },
  });

  if (!doc) return false;

  if (data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, associationId },
    });
    if (!branch) return { error: "Branch not found." };
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
      ...(data.fileType !== undefined && { fileType: data.fileType || null }),
      ...(data.fileSizeBytes !== undefined && { fileSizeBytes: data.fileSizeBytes ?? null }),
      ...(data.category !== undefined && { category: data.category as "CONSTITUTION" | "MINUTES" | "FINANCIAL_REPORT" | "POLICY" | "CERTIFICATE" | "OTHER" }),
      ...(data.visibility !== undefined && { visibility: data.visibility as "PUBLIC" | "MEMBERS_ONLY" | "EXECUTIVES_ONLY" | "ADMIN_ONLY" }),
      ...(data.branchId !== undefined && { branchId: data.branchId || null }),
    },
  });

  return true;
}

export async function deleteDocument(
  associationId: string,
  documentId: string
): Promise<boolean | { error: string }> {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, associationId },
  });

  if (!doc) return false;

  // Prevent deletion if referenced as a finance receipt
  const [expenseRef, transactionRef] = await Promise.all([
    prisma.expense.findFirst({
      where: { receiptDocumentId: documentId, associationId },
      select: { id: true },
    }),
    prisma.financialTransaction.findFirst({
      where: { receiptDocumentId: documentId, associationId },
      select: { id: true },
    }),
  ]);

  if (expenseRef) {
    return { error: "Cannot delete this document — it is linked as a receipt to an expense. Unlink it first." };
  }

  if (transactionRef) {
    return { error: "Cannot delete this document — it is linked as a receipt to a financial transaction. Unlink it first." };
  }

  await prisma.document.delete({
    where: { id: documentId },
  });

  return true;
}
