import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  roleFilterSchema,
  createRoleSchema,
  updateRoleSchema,
  deleteRoleSchema,
} from "../src/server/validation/role";

describe("Role validation schemas", () => {
  // -----------------------------------------------------------------------
  // roleFilterSchema
  // -----------------------------------------------------------------------
  describe("roleFilterSchema", () => {
    it("accepts empty input", () => {
      const result = roleFilterSchema.safeParse({});
      assert.ok(result.success);
    });

    it("accepts valid search", () => {
      const result = roleFilterSchema.safeParse({ search: "admin" });
      assert.ok(result.success);
    });

    it("accepts type filter SYSTEM", () => {
      const result = roleFilterSchema.safeParse({ type: "SYSTEM" });
      assert.ok(result.success);
    });

    it("accepts type filter CUSTOM", () => {
      const result = roleFilterSchema.safeParse({ type: "CUSTOM" });
      assert.ok(result.success);
    });

    it("accepts type filter ALL", () => {
      const result = roleFilterSchema.safeParse({ type: "ALL" });
      assert.ok(result.success);
    });

    it("rejects invalid type", () => {
      const result = roleFilterSchema.safeParse({ type: "INVALID" });
      assert.ok(!result.success);
    });

    it("accepts page number", () => {
      const result = roleFilterSchema.safeParse({ page: "3" });
      assert.ok(result.success);
    });
  });

  // -----------------------------------------------------------------------
  // createRoleSchema
  // -----------------------------------------------------------------------
  describe("createRoleSchema", () => {
    it("accepts valid input", () => {
      const result = createRoleSchema.safeParse({
        name: "Event Coordinator",
        description: "Handles events",
        permissionIds: ["perm1", "perm2"],
      });
      assert.ok(result.success);
    });

    it("accepts without description", () => {
      const result = createRoleSchema.safeParse({
        name: "Event Coordinator",
        permissionIds: ["perm1"],
      });
      assert.ok(result.success);
    });

    it("rejects empty name", () => {
      const result = createRoleSchema.safeParse({
        name: "",
        permissionIds: ["perm1"],
      });
      assert.ok(!result.success);
    });

    it("rejects name too short", () => {
      const result = createRoleSchema.safeParse({
        name: "A",
        permissionIds: ["perm1"],
      });
      assert.ok(!result.success);
    });

    it("rejects empty permissionIds", () => {
      const result = createRoleSchema.safeParse({
        name: "Test Role",
        permissionIds: [],
      });
      assert.ok(!result.success);
    });

    it("rejects missing permissionIds", () => {
      const result = createRoleSchema.safeParse({
        name: "Test Role",
      });
      assert.ok(!result.success);
    });

    it("trims whitespace from name", () => {
      const result = createRoleSchema.safeParse({
        name: "  Test Role  ",
        permissionIds: ["perm1"],
      });
      assert.ok(result.success);
      if (result.success) {
        assert.equal(result.data.name, "Test Role");
      }
    });

    it("accepts empty description as optional", () => {
      const result = createRoleSchema.safeParse({
        name: "Test Role",
        description: "",
        permissionIds: ["perm1"],
      });
      assert.ok(result.success);
    });
  });

  // -----------------------------------------------------------------------
  // updateRoleSchema
  // -----------------------------------------------------------------------
  describe("updateRoleSchema", () => {
    it("accepts valid input with all fields", () => {
      const result = updateRoleSchema.safeParse({
        roleId: "role1",
        name: "Updated Name",
        description: "Updated desc",
        permissionIds: ["perm1"],
      });
      assert.ok(result.success);
    });

    it("accepts partial update (name only)", () => {
      const result = updateRoleSchema.safeParse({
        roleId: "role1",
        name: "Updated Name",
      });
      assert.ok(result.success);
    });

    it("accepts partial update (permissionIds only)", () => {
      const result = updateRoleSchema.safeParse({
        roleId: "role1",
        permissionIds: ["perm1", "perm2"],
      });
      assert.ok(result.success);
    });

    it("rejects missing roleId", () => {
      const result = updateRoleSchema.safeParse({
        name: "Updated",
        permissionIds: ["perm1"],
      });
      assert.ok(!result.success);
    });

    it("rejects empty roleId", () => {
      const result = updateRoleSchema.safeParse({
        roleId: "",
        name: "Updated",
      });
      assert.ok(!result.success);
    });

    it("rejects empty permissionIds array", () => {
      const result = updateRoleSchema.safeParse({
        roleId: "role1",
        permissionIds: [],
      });
      assert.ok(!result.success);
    });

    it("accepts empty description", () => {
      const result = updateRoleSchema.safeParse({
        roleId: "role1",
        description: "",
      });
      assert.ok(result.success);
    });
  });

  // -----------------------------------------------------------------------
  // deleteRoleSchema
  // -----------------------------------------------------------------------
  describe("deleteRoleSchema", () => {
    it("accepts valid input", () => {
      const result = deleteRoleSchema.safeParse({ roleId: "role1" });
      assert.ok(result.success);
    });

    it("rejects missing roleId", () => {
      const result = deleteRoleSchema.safeParse({});
      assert.ok(!result.success);
    });

    it("rejects empty roleId", () => {
      const result = deleteRoleSchema.safeParse({ roleId: "" });
      assert.ok(!result.success);
    });
  });
});
