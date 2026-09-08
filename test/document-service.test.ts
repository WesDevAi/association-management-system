import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createDocumentSchema,
  updateDocumentSchema,
  documentFilterSchema,
  deleteDocumentSchema,
} from "@/server/validation/document";

// ---------------------------------------------------------------------------
// Document validation schemas
// ---------------------------------------------------------------------------

describe("createDocumentSchema", () => {
  it("accepts valid document data", () => {
    const result = createDocumentSchema.safeParse({
      title: "Annual Report 2026",
      fileUrl: "https://example.com/report.pdf",
      category: "FINANCIAL_REPORT",
      visibility: "MEMBERS_ONLY",
    });
    assert.equal(result.success, true);
  });

  it("requires title with at least 2 characters", () => {
    const result = createDocumentSchema.safeParse({
      title: "A",
      fileUrl: "https://example.com/doc.pdf",
      category: "OTHER",
      visibility: "MEMBERS_ONLY",
    });
    assert.equal(result.success, false);
  });

  it("requires fileUrl", () => {
    const result = createDocumentSchema.safeParse({
      title: "Test Document",
      category: "OTHER",
      visibility: "MEMBERS_ONLY",
    });
    assert.equal(result.success, false);
  });

  it("requires category", () => {
    const result = createDocumentSchema.safeParse({
      title: "Test Document",
      fileUrl: "https://example.com/doc.pdf",
      visibility: "MEMBERS_ONLY",
    });
    assert.equal(result.success, false);
  });

  it("requires visibility", () => {
    const result = createDocumentSchema.safeParse({
      title: "Test Document",
      fileUrl: "https://example.com/doc.pdf",
      category: "OTHER",
    });
    assert.equal(result.success, false);
  });

  it("accepts all valid categories", () => {
    for (const category of ["CONSTITUTION", "MINUTES", "FINANCIAL_REPORT", "POLICY", "CERTIFICATE", "OTHER"]) {
      const result = createDocumentSchema.safeParse({
        title: `Document ${category}`,
        fileUrl: "https://example.com/doc.pdf",
        category,
        visibility: "MEMBERS_ONLY",
      });
      assert.equal(result.success, true);
    }
  });

  it("accepts all valid visibility values", () => {
    for (const visibility of ["PUBLIC", "MEMBERS_ONLY", "EXECUTIVES_ONLY", "ADMIN_ONLY"]) {
      const result = createDocumentSchema.safeParse({
        title: "Test Document",
        fileUrl: "https://example.com/doc.pdf",
        category: "OTHER",
        visibility,
      });
      assert.equal(result.success, true);
    }
  });

  it("rejects invalid category", () => {
    const result = createDocumentSchema.safeParse({
      title: "Test",
      fileUrl: "https://example.com/doc.pdf",
      category: "INVALID",
      visibility: "MEMBERS_ONLY",
    });
    assert.equal(result.success, false);
  });

  it("rejects invalid visibility", () => {
    const result = createDocumentSchema.safeParse({
      title: "Test",
      fileUrl: "https://example.com/doc.pdf",
      category: "OTHER",
      visibility: "INVALID",
    });
    assert.equal(result.success, false);
  });

  it("accepts optional description", () => {
    const result = createDocumentSchema.safeParse({
      title: "Test",
      fileUrl: "https://example.com/doc.pdf",
      category: "OTHER",
      visibility: "MEMBERS_ONLY",
      description: "A detailed description",
    });
    assert.equal(result.success, true);
  });

  it("accepts optional fileType", () => {
    const result = createDocumentSchema.safeParse({
      title: "Test",
      fileUrl: "https://example.com/doc.pdf",
      category: "OTHER",
      visibility: "MEMBERS_ONLY",
      fileType: "application/pdf",
    });
    assert.equal(result.success, true);
  });

  it("accepts optional fileSizeBytes", () => {
    const result = createDocumentSchema.safeParse({
      title: "Test",
      fileUrl: "https://example.com/doc.pdf",
      category: "OTHER",
      visibility: "MEMBERS_ONLY",
      fileSizeBytes: 1024000,
    });
    assert.equal(result.success, true);
  });

  it("accepts optional branchId", () => {
    const result = createDocumentSchema.safeParse({
      title: "Test",
      fileUrl: "https://example.com/doc.pdf",
      category: "OTHER",
      visibility: "MEMBERS_ONLY",
      branchId: "branch-1",
    });
    assert.equal(result.success, true);
  });

  it("allows empty optional fields", () => {
    const result = createDocumentSchema.safeParse({
      title: "Test",
      fileUrl: "https://example.com/doc.pdf",
      category: "OTHER",
      visibility: "MEMBERS_ONLY",
      description: "",
      fileType: "",
      fileSizeBytes: "",
      branchId: "",
    });
    assert.equal(result.success, true);
  });
});

describe("updateDocumentSchema", () => {
  it("requires documentId", () => {
    const result = updateDocumentSchema.safeParse({
      title: "Updated Title",
    });
    assert.equal(result.success, false);
  });

  it("accepts partial updates", () => {
    const result = updateDocumentSchema.safeParse({
      documentId: "doc-1",
      title: "Updated Title",
    });
    assert.equal(result.success, true);
  });

  it("accepts all optional fields", () => {
    const result = updateDocumentSchema.safeParse({
      documentId: "doc-1",
      title: "Updated",
      description: "New description",
      fileUrl: "https://example.com/updated.pdf",
      fileType: "application/pdf",
      fileSizeBytes: 2048,
      category: "POLICY",
      visibility: "PUBLIC",
      branchId: "branch-1",
    });
    assert.equal(result.success, true);
  });

  it("validates category enum", () => {
    const result = updateDocumentSchema.safeParse({
      documentId: "doc-1",
      category: "INVALID",
    });
    assert.equal(result.success, false);
  });

  it("validates visibility enum", () => {
    const result = updateDocumentSchema.safeParse({
      documentId: "doc-1",
      visibility: "INVALID",
    });
    assert.equal(result.success, false);
  });
});

describe("documentFilterSchema", () => {
  it("accepts valid filter data", () => {
    const result = documentFilterSchema.safeParse({
      search: "report",
      category: "FINANCIAL_REPORT",
      visibility: "MEMBERS_ONLY",
      branchId: "branch-1",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      sort: "createdAt",
      order: "desc",
      page: 1,
    });
    assert.equal(result.success, true);
  });

  it("accepts empty filter", () => {
    const result = documentFilterSchema.safeParse({});
    assert.equal(result.success, true);
  });

  it("accepts ALL as category filter", () => {
    const result = documentFilterSchema.safeParse({ category: "ALL" });
    assert.equal(result.success, true);
  });

  it("accepts ALL as visibility filter", () => {
    const result = documentFilterSchema.safeParse({ visibility: "ALL" });
    assert.equal(result.success, true);
  });

  it("validates sort field", () => {
    const result = documentFilterSchema.safeParse({ sort: "invalid" });
    assert.equal(result.success, false);
  });

  it("validates order", () => {
    const result = documentFilterSchema.safeParse({ order: "invalid" });
    assert.equal(result.success, false);
  });
});

describe("deleteDocumentSchema", () => {
  it("accepts valid documentId", () => {
    const result = deleteDocumentSchema.safeParse({ documentId: "doc-1" });
    assert.equal(result.success, true);
  });

  it("requires documentId", () => {
    const result = deleteDocumentSchema.safeParse({});
    assert.equal(result.success, false);
  });
});
