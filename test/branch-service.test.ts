import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createBranchSchema,
  updateBranchSchema,
  branchFilterSchema,
} from "../src/server/validation/branch";

describe("Branch validation schemas", () => {
  // -----------------------------------------------------------------------
  // createBranchSchema
  // -----------------------------------------------------------------------
  describe("createBranchSchema", () => {
    it("accepts valid input", () => {
      const result = createBranchSchema.safeParse({
        name: "Lagos Chapter",
        code: "LAS",
      });
      assert.ok(result.success);
    });

    it("accepts all optional fields", () => {
      const result = createBranchSchema.safeParse({
        name: "Lagos Chapter",
        code: "LAS",
        address: "123 Main St",
        state: "Lagos",
        isHeadquarters: true,
        status: "ACTIVE",
      });
      assert.ok(result.success);
    });

    it("auto-capitalizes code", () => {
      const result = createBranchSchema.safeParse({
        name: "Lagos",
        code: "las",
      });
      assert.ok(result.success);
      if (result.success) {
        assert.equal(result.data.code, "LAS");
      }
    });

    it("rejects empty name", () => {
      const result = createBranchSchema.safeParse({
        name: "",
        code: "LAS",
      });
      assert.ok(!result.success);
    });

    it("rejects name too short", () => {
      const result = createBranchSchema.safeParse({
        name: "A",
        code: "LAS",
      });
      assert.ok(!result.success);
    });

    it("rejects empty code", () => {
      const result = createBranchSchema.safeParse({
        name: "Lagos",
        code: "",
      });
      assert.ok(!result.success);
    });

    it("rejects code too long", () => {
      const result = createBranchSchema.safeParse({
        name: "Lagos",
        code: "A".repeat(21),
      });
      assert.ok(!result.success);
    });

    it("defaults isHeadquarters to false", () => {
      const result = createBranchSchema.safeParse({
        name: "Lagos",
        code: "LAS",
      });
      assert.ok(result.success);
      if (result.success) {
        assert.equal(result.data.isHeadquarters, false);
      }
    });

    it("defaults status to ACTIVE", () => {
      const result = createBranchSchema.safeParse({
        name: "Lagos",
        code: "LAS",
      });
      assert.ok(result.success);
      if (result.success) {
        assert.equal(result.data.status, "ACTIVE");
      }
    });

    it("accepts INACTIVE status", () => {
      const result = createBranchSchema.safeParse({
        name: "Lagos",
        code: "LAS",
        status: "INACTIVE",
      });
      assert.ok(result.success);
    });

    it("rejects invalid status", () => {
      const result = createBranchSchema.safeParse({
        name: "Lagos",
        code: "LAS",
        status: "DELETED",
      });
      assert.ok(!result.success);
    });
  });

  // -----------------------------------------------------------------------
  // updateBranchSchema
  // -----------------------------------------------------------------------
  describe("updateBranchSchema", () => {
    it("accepts valid input with branchId", () => {
      const result = updateBranchSchema.safeParse({
        branchId: "branch1",
        name: "Updated Name",
      });
      assert.ok(result.success);
    });

    it("accepts partial updates", () => {
      const result = updateBranchSchema.safeParse({
        branchId: "branch1",
        code: "NEW",
      });
      assert.ok(result.success);
    });

    it("auto-capitalizes code on update", () => {
      const result = updateBranchSchema.safeParse({
        branchId: "branch1",
        code: "new",
      });
      assert.ok(result.success);
      if (result.success) {
        assert.equal(result.data.code, "NEW");
      }
    });

    it("rejects missing branchId", () => {
      const result = updateBranchSchema.safeParse({
        name: "Updated",
      });
      assert.ok(!result.success);
    });

    it("rejects empty branchId", () => {
      const result = updateBranchSchema.safeParse({
        branchId: "",
        name: "Updated",
      });
      assert.ok(!result.success);
    });

    it("accepts isHeadquarters boolean", () => {
      const result = updateBranchSchema.safeParse({
        branchId: "branch1",
        isHeadquarters: true,
      });
      assert.ok(result.success);
    });

    it("accepts status change", () => {
      const result = updateBranchSchema.safeParse({
        branchId: "branch1",
        status: "INACTIVE",
      });
      assert.ok(result.success);
    });
  });

  // -----------------------------------------------------------------------
  // branchFilterSchema
  // -----------------------------------------------------------------------
  describe("branchFilterSchema", () => {
    it("accepts empty input", () => {
      const result = branchFilterSchema.safeParse({});
      assert.ok(result.success);
    });

    it("accepts valid search", () => {
      const result = branchFilterSchema.safeParse({ search: "lagos" });
      assert.ok(result.success);
    });

    it("accepts status filter ALL", () => {
      const result = branchFilterSchema.safeParse({ status: "ALL" });
      assert.ok(result.success);
    });

    it("accepts status filter ACTIVE", () => {
      const result = branchFilterSchema.safeParse({ status: "ACTIVE" });
      assert.ok(result.success);
    });

    it("accepts status filter INACTIVE", () => {
      const result = branchFilterSchema.safeParse({ status: "INACTIVE" });
      assert.ok(result.success);
    });

    it("rejects invalid status", () => {
      const result = branchFilterSchema.safeParse({ status: "DELETED" });
      assert.ok(!result.success);
    });

    it("accepts page number", () => {
      const result = branchFilterSchema.safeParse({ page: "2" });
      assert.ok(result.success);
    });
  });
});
