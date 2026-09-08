import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  updateAssociationSchema,
} from "../src/server/validation/association-settings";

describe("Association settings validation schemas", () => {
  describe("updateAssociationSchema", () => {
    it("accepts empty input (no fields to update)", () => {
      const result = updateAssociationSchema.safeParse({});
      assert.ok(result.success);
    });

    it("accepts valid name", () => {
      const result = updateAssociationSchema.safeParse({ name: "New Name" });
      assert.ok(result.success);
    });

    it("rejects name too short", () => {
      const result = updateAssociationSchema.safeParse({ name: "A" });
      assert.ok(!result.success);
    });

    it("accepts valid type", () => {
      const result = updateAssociationSchema.safeParse({ type: "CLUB" });
      assert.ok(result.success);
    });

    it("rejects invalid type", () => {
      const result = updateAssociationSchema.safeParse({ type: "INVALID" });
      assert.ok(!result.success);
    });

    it("accepts all valid association types", () => {
      const types = ["CLUB", "UNION", "PROFESSIONAL_BODY", "ALUMNI", "COMMUNITY", "COOPERATIVE", "RELIGIOUS", "OTHER"];
      for (const type of types) {
        const result = updateAssociationSchema.safeParse({ type });
        assert.ok(result.success, `Expected ${type} to be valid`);
      }
    });

    it("accepts valid contactEmail", () => {
      const result = updateAssociationSchema.safeParse({ contactEmail: "test@example.com" });
      assert.ok(result.success);
    });

    it("rejects invalid email", () => {
      const result = updateAssociationSchema.safeParse({ contactEmail: "not-an-email" });
      assert.ok(!result.success);
    });

    it("accepts empty contactEmail to clear", () => {
      const result = updateAssociationSchema.safeParse({ contactEmail: "" });
      assert.ok(result.success);
    });

    it("accepts valid currency", () => {
      const result = updateAssociationSchema.safeParse({ currency: "USD" });
      assert.ok(result.success);
    });

    it("rejects currency not 3 characters", () => {
      const result = updateAssociationSchema.safeParse({ currency: "US" });
      assert.ok(!result.success);
    });

    it("accepts valid logoUrl", () => {
      const result = updateAssociationSchema.safeParse({
        logoUrl: "https://example.com/logo.png",
      });
      assert.ok(result.success);
    });

    it("rejects invalid logoUrl", () => {
      const result = updateAssociationSchema.safeParse({
        logoUrl: "not-a-url",
      });
      assert.ok(!result.success);
    });

    it("accepts empty logoUrl to clear", () => {
      const result = updateAssociationSchema.safeParse({ logoUrl: "" });
      assert.ok(result.success);
    });

    it("accepts description", () => {
      const result = updateAssociationSchema.safeParse({
        description: "A great association",
      });
      assert.ok(result.success);
    });

    it("accepts empty description to clear", () => {
      const result = updateAssociationSchema.safeParse({ description: "" });
      assert.ok(result.success);
    });

    it("accepts address, state, country, contactPhone", () => {
      const result = updateAssociationSchema.safeParse({
        address: "123 Main St",
        state: "Lagos",
        country: "Nigeria",
        contactPhone: "+2341234567890",
      });
      assert.ok(result.success);
    });

    it("does not allow slug changes (schema omits slug)", () => {
      const result = updateAssociationSchema.safeParse({ slug: "new-slug" });
      assert.ok(result.success);
      if (result.success) {
        assert.equal((result.data as Record<string, unknown>).slug, undefined);
      }
    });

    it("does not allow status changes (schema omits status)", () => {
      const result = updateAssociationSchema.safeParse({ status: "ACTIVE" });
      assert.ok(result.success);
      if (result.success) {
        assert.equal((result.data as Record<string, unknown>).status, undefined);
      }
    });

    it("accepts multiple fields at once", () => {
      const result = updateAssociationSchema.safeParse({
        name: "Updated Name",
        type: "UNION",
        description: "Updated description",
        contactEmail: "new@example.com",
        currency: "GBP",
      });
      assert.ok(result.success);
    });
  });
});
