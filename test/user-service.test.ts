import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  userFilterSchema,
  updateMembershipRoleSchema,
  updateMembershipStatusSchema,
  linkUserAccountSchema,
  unlinkUserAccountSchema,
} from "../src/server/validation/user";

describe("User validation schemas", () => {
  // -----------------------------------------------------------------------
  // userFilterSchema
  // -----------------------------------------------------------------------
  describe("userFilterSchema", () => {
    it("accepts empty input", () => {
      const result = userFilterSchema.safeParse({});
      assert.ok(result.success);
    });

    it("accepts valid search", () => {
      const result = userFilterSchema.safeParse({ search: "john" });
      assert.ok(result.success);
    });

    it("accepts valid status filter", () => {
      const result = userFilterSchema.safeParse({ status: "ACTIVE" });
      assert.ok(result.success);
    });

    it("accepts ALL status", () => {
      const result = userFilterSchema.safeParse({ status: "ALL" });
      assert.ok(result.success);
    });

    it("rejects invalid status", () => {
      const result = userFilterSchema.safeParse({ status: "INVALID" });
      assert.ok(!result.success);
    });

    it("accepts linked filter", () => {
      assert.ok(userFilterSchema.safeParse({ linked: "LINKED" }).success);
      assert.ok(userFilterSchema.safeParse({ linked: "UNLINKED" }).success);
      assert.ok(userFilterSchema.safeParse({ linked: "ALL" }).success);
    });

    it("accepts page number", () => {
      const result = userFilterSchema.safeParse({ page: "2" });
      assert.ok(result.success);
    });

    it("accepts roleId filter", () => {
      const result = userFilterSchema.safeParse({ roleId: "abc123" });
      assert.ok(result.success);
    });
  });

  // -----------------------------------------------------------------------
  // updateMembershipRoleSchema
  // -----------------------------------------------------------------------
  describe("updateMembershipRoleSchema", () => {
    it("accepts valid input", () => {
      const result = updateMembershipRoleSchema.safeParse({
        membershipId: "mem1",
        roleId: "role1",
      });
      assert.ok(result.success);
    });

    it("rejects missing membershipId", () => {
      const result = updateMembershipRoleSchema.safeParse({
        membershipId: "",
        roleId: "role1",
      });
      assert.ok(!result.success);
    });

    it("rejects missing roleId", () => {
      const result = updateMembershipRoleSchema.safeParse({
        membershipId: "mem1",
        roleId: "",
      });
      assert.ok(!result.success);
    });

    it("rejects completely empty input", () => {
      const result = updateMembershipRoleSchema.safeParse({});
      assert.ok(!result.success);
    });
  });

  // -----------------------------------------------------------------------
  // updateMembershipStatusSchema
  // -----------------------------------------------------------------------
  describe("updateMembershipStatusSchema", () => {
    it("accepts valid status", () => {
      const result = updateMembershipStatusSchema.safeParse({
        membershipId: "mem1",
        status: "ACTIVE",
      });
      assert.ok(result.success);
    });

    it("accepts all valid statuses", () => {
      const statuses = ["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED", "EXPELLED", "ALUMNI"];
      for (const status of statuses) {
        const result = updateMembershipStatusSchema.safeParse({
          membershipId: "mem1",
          status,
        });
        assert.ok(result.success, `Expected ${status} to be valid`);
      }
    });

    it("rejects invalid status", () => {
      const result = updateMembershipStatusSchema.safeParse({
        membershipId: "mem1",
        status: "DELETED",
      });
      assert.ok(!result.success);
    });

    it("rejects missing membershipId", () => {
      const result = updateMembershipStatusSchema.safeParse({
        membershipId: "",
        status: "ACTIVE",
      });
      assert.ok(!result.success);
    });
  });

  // -----------------------------------------------------------------------
  // linkUserAccountSchema
  // -----------------------------------------------------------------------
  describe("linkUserAccountSchema", () => {
    it("accepts valid input", () => {
      const result = linkUserAccountSchema.safeParse({
        membershipId: "mem1",
        userId: "user1",
      });
      assert.ok(result.success);
    });

    it("rejects missing membershipId", () => {
      const result = linkUserAccountSchema.safeParse({
        membershipId: "",
        userId: "user1",
      });
      assert.ok(!result.success);
    });

    it("rejects missing userId", () => {
      const result = linkUserAccountSchema.safeParse({
        membershipId: "mem1",
        userId: "",
      });
      assert.ok(!result.success);
    });
  });

  // -----------------------------------------------------------------------
  // unlinkUserAccountSchema
  // -----------------------------------------------------------------------
  describe("unlinkUserAccountSchema", () => {
    it("accepts valid input", () => {
      const result = unlinkUserAccountSchema.safeParse({
        membershipId: "mem1",
      });
      assert.ok(result.success);
    });

    it("rejects missing membershipId", () => {
      const result = unlinkUserAccountSchema.safeParse({
        membershipId: "",
      });
      assert.ok(!result.success);
    });
  });
});
