import { z } from "zod";

// ---------------------------------------------------------------------------
// Document schemas
// ---------------------------------------------------------------------------

export const createDocumentSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  fileUrl: z.string().trim().min(1, "File URL is required").max(2000),
  fileType: z.string().trim().max(100).optional().or(z.literal("")),
  fileSizeBytes: z.coerce.number().int().min(0).optional().or(z.literal("")),
  category: z.enum(["CONSTITUTION", "MINUTES", "FINANCIAL_REPORT", "POLICY", "CERTIFICATE", "OTHER"]),
  visibility: z.enum(["PUBLIC", "MEMBERS_ONLY", "EXECUTIVES_ONLY", "ADMIN_ONLY"]),
  branchId: z.string().optional().or(z.literal("")),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export const updateDocumentSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  fileUrl: z.string().trim().min(1).max(2000).optional(),
  fileType: z.string().trim().max(100).optional().or(z.literal("")),
  fileSizeBytes: z.coerce.number().int().min(0).optional().or(z.literal("")),
  category: z.enum(["CONSTITUTION", "MINUTES", "FINANCIAL_REPORT", "POLICY", "CERTIFICATE", "OTHER"]).optional(),
  visibility: z.enum(["PUBLIC", "MEMBERS_ONLY", "EXECUTIVES_ONLY", "ADMIN_ONLY"]).optional(),
  branchId: z.string().optional().or(z.literal("")),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

export const documentFilterSchema = z.object({
  search: z.string().trim().optional().or(z.literal("")),
  category: z.enum(["ALL", "CONSTITUTION", "MINUTES", "FINANCIAL_REPORT", "POLICY", "CERTIFICATE", "OTHER"]).optional().or(z.literal("")),
  visibility: z.enum(["ALL", "PUBLIC", "MEMBERS_ONLY", "EXECUTIVES_ONLY", "ADMIN_ONLY"]).optional().or(z.literal("")),
  branchId: z.string().optional().or(z.literal("")),
  dateFrom: z.string().optional().or(z.literal("")),
  dateTo: z.string().optional().or(z.literal("")),
  sort: z.enum(["createdAt", "title", "category"]).optional().or(z.literal("")),
  order: z.enum(["asc", "desc"]).optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).optional().or(z.literal("")),
});

export type DocumentFilterInput = z.infer<typeof documentFilterSchema>;

export const deleteDocumentSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
});

export type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;
