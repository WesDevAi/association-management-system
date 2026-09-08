import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementStatusSchema,
  announcementFilterSchema,
} from "@/server/validation/event";

// ---------------------------------------------------------------------------
// Announcement validation schemas
// ---------------------------------------------------------------------------

describe("createAnnouncementSchema", () => {
  it("accepts valid announcement data", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Important Update",
      body: "This is an important announcement for all members.",
      audience: "ALL_MEMBERS",
    });
    assert.equal(result.success, true);
  });

  it("requires title with at least 2 characters", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "A",
      body: "Body",
      audience: "ALL_MEMBERS",
    });
    assert.equal(result.success, false);
  });

  it("requires body", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Test",
      audience: "ALL_MEMBERS",
    });
    assert.equal(result.success, false);
  });

  it("requires audience", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Test",
      body: "Body",
    });
    assert.equal(result.success, false);
  });

  it("accepts all valid audience values", () => {
    for (const audience of ["ALL_MEMBERS", "EXECUTIVES_ONLY", "BRANCH_ONLY"]) {
      const result = createAnnouncementSchema.safeParse({
        title: "Test Announcement",
        body: "Body content",
        audience,
      });
      assert.equal(result.success, true);
    }
  });

  it("rejects invalid audience", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Test",
      body: "Body",
      audience: "INVALID",
    });
    assert.equal(result.success, false);
  });

  it("defaults isPinned to false", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Test",
      body: "Body",
      audience: "ALL_MEMBERS",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.isPinned, false);
    }
  });

  it("accepts optional branchId", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Test",
      body: "Body",
      audience: "BRANCH_ONLY",
      branchId: "branch-1",
    });
    assert.equal(result.success, true);
  });

  it("accepts optional expiresAt", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Test",
      body: "Body",
      audience: "ALL_MEMBERS",
      expiresAt: "2026-12-31T23:59:59+01:00",
    });
    assert.equal(result.success, true);
  });

  it("allows empty optional fields", () => {
    const result = createAnnouncementSchema.safeParse({
      title: "Test",
      body: "Body",
      audience: "ALL_MEMBERS",
      branchId: "",
      expiresAt: "",
    });
    assert.equal(result.success, true);
  });
});

describe("updateAnnouncementSchema", () => {
  it("requires announcementId", () => {
    const result = updateAnnouncementSchema.safeParse({
      title: "Updated Title",
    });
    assert.equal(result.success, false);
  });

  it("accepts partial updates", () => {
    const result = updateAnnouncementSchema.safeParse({
      announcementId: "ann-1",
      title: "Updated Title",
    });
    assert.equal(result.success, true);
  });

  it("accepts all optional fields", () => {
    const result = updateAnnouncementSchema.safeParse({
      announcementId: "ann-1",
      title: "Updated",
      body: "New body",
      audience: "EXECUTIVES_ONLY",
      branchId: "branch-1",
      isPinned: true,
      expiresAt: "2026-12-31T23:59:59+01:00",
    });
    assert.equal(result.success, true);
  });

  it("validates audience enum", () => {
    const result = updateAnnouncementSchema.safeParse({
      announcementId: "ann-1",
      audience: "INVALID",
    });
    assert.equal(result.success, false);
  });
});

describe("announcementStatusSchema", () => {
  it("accepts valid status transitions", () => {
    for (const status of ["DRAFT", "PUBLISHED", "ARCHIVED"]) {
      const result = announcementStatusSchema.safeParse({
        announcementId: "ann-1",
        status,
      });
      assert.equal(result.success, true);
    }
  });

  it("rejects invalid status", () => {
    const result = announcementStatusSchema.safeParse({
      announcementId: "ann-1",
      status: "INVALID",
    });
    assert.equal(result.success, false);
  });

  it("requires announcementId", () => {
    const result = announcementStatusSchema.safeParse({
      status: "PUBLISHED",
    });
    assert.equal(result.success, false);
  });
});

describe("announcementFilterSchema", () => {
  it("accepts valid filter data", () => {
    const result = announcementFilterSchema.safeParse({
      search: "important",
      status: "PUBLISHED",
      audience: "ALL_MEMBERS",
      sort: "createdAt",
      order: "desc",
      page: 1,
    });
    assert.equal(result.success, true);
  });

  it("accepts empty filter", () => {
    const result = announcementFilterSchema.safeParse({});
    assert.equal(result.success, true);
  });

  it("accepts ALL as status filter", () => {
    const result = announcementFilterSchema.safeParse({
      status: "ALL",
    });
    assert.equal(result.success, true);
  });

  it("accepts ALL as audience filter", () => {
    const result = announcementFilterSchema.safeParse({
      audience: "ALL",
    });
    assert.equal(result.success, true);
  });

  it("validates sort field", () => {
    const result = announcementFilterSchema.safeParse({
      sort: "invalid",
    });
    assert.equal(result.success, false);
  });

  it("validates order", () => {
    const result = announcementFilterSchema.safeParse({
      order: "invalid",
    });
    assert.equal(result.success, false);
  });
});
