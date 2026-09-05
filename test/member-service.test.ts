import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  resolveActiveMembership,
  verifyMembershipOwnership,
} from "@/server/db/tenant-logic";

const membershipA = { associationId: "assoc-A", id: "mem-A", fullName: "Alice", status: "ACTIVE" };
const membershipB = { associationId: "assoc-B", id: "mem-B", fullName: "Bob", status: "ACTIVE" };

describe("resolveActiveMembership (page-load context resolution)", () => {
  test("returns null when the user has no memberships at all", () => {
    assert.equal(resolveActiveMembership([], "assoc-A"), null);
  });

  test("selects the requested association when the user is really a member of it", () => {
    const result = resolveActiveMembership([membershipA, membershipB], "assoc-B");
    assert.equal(result, membershipB);
  });

  test("falls back to the first membership when the cookie is stale/missing", () => {
    const result = resolveActiveMembership([membershipA, membershipB], null);
    assert.equal(result, membershipA);
  });

  test("falls back to the first membership when the requested association isn't one the user belongs to", () => {
    const result = resolveActiveMembership([membershipA, membershipB], "assoc-C");
    assert.equal(result, membershipA);
  });
});

describe("verifyMembershipOwnership (explicit association-switch request)", () => {
  test("returns the membership when the user genuinely belongs to the requested association", () => {
    const result = verifyMembershipOwnership([membershipA, membershipB], "assoc-B");
    assert.equal(result, membershipB);
  });

  test("denies a forged/unowned associationId outright", () => {
    const result = verifyMembershipOwnership([membershipA, membershipB], "assoc-C-not-mine");
    assert.equal(result, null);
  });

  test("denies when the user has zero memberships", () => {
    const result = verifyMembershipOwnership([], "assoc-A");
    assert.equal(result, null);
  });
});

describe("member-service helper: MemberListItem shape", () => {
  test("maps a membership record to MemberListItem correctly", () => {
    const raw = {
      id: "mem-1",
      membershipNumber: "0001",
      fullName: "Alice",
      email: "alice@example.com",
      phone: "1234567890",
      status: "ACTIVE",
      role: { name: "Admin", key: "ASSOCIATION_ADMIN" },
      joinedAt: new Date("2025-01-01"),
    };

    const item = {
      id: raw.id,
      membershipNumber: raw.membershipNumber,
      fullName: raw.fullName,
      email: raw.email ?? "",
      phone: raw.phone,
      status: raw.status,
      roleName: raw.role.name,
      roleKey: raw.role.key,
      joinedAt: raw.joinedAt,
    };

    assert.equal(item.id, "mem-1");
    assert.equal(item.membershipNumber, "0001");
    assert.equal(item.fullName, "Alice");
    assert.equal(item.email, "alice@example.com");
    assert.equal(item.status, "ACTIVE");
    assert.equal(item.roleName, "Admin");
    assert.equal(item.roleKey, "ASSOCIATION_ADMIN");
  });
});
