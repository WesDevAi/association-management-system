import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveActiveMembership, verifyMembershipOwnership } from "@/server/db/tenant-logic";

const membershipA = { associationId: "assoc-A", id: "mem-A" };
const membershipB = { associationId: "assoc-B", id: "mem-B" };

describe("resolveActiveMembership (page-load context resolution)", () => {
  test("returns null when the user has no memberships at all", () => {
    assert.equal(resolveActiveMembership([], "assoc-A"), null);
  });

  test("selects the requested association when the user is really a member of it", () => {
    const result = resolveActiveMembership([membershipA, membershipB], "assoc-B");
    assert.equal(result, membershipB);
  });

  test("falls back to the first membership when the cookie is stale/missing (never errors, never leaks another tenant)", () => {
    const result = resolveActiveMembership([membershipA, membershipB], null);
    assert.equal(result, membershipA);
  });

  test("falls back to the first membership when the requested association isn't one the user belongs to", () => {
    // This is the safe fallback path: a stale cookie naming an association
    // the user was removed from should not lock them out, but the fallback
    // only ever selects from THEIR OWN memberships — Association C's data
    // is never reachable this way.
    const result = resolveActiveMembership([membershipA, membershipB], "assoc-C");
    assert.equal(result, membershipA);
  });
});

describe("verifyMembershipOwnership (explicit association-switch request)", () => {
  test("returns the membership when the user genuinely belongs to the requested association", () => {
    const result = verifyMembershipOwnership([membershipA, membershipB], "assoc-B");
    assert.equal(result, membershipB);
  });

  test("Scenario D — denies a forged/unowned associationId outright, no fallback", () => {
    // This is the core Phase 3.10 requirement: a user explicitly asking to
    // switch to an association ID they don't belong to must be rejected,
    // never silently redirected to a different (even if 'safe') context —
    // that could look like success to an attacker probing for valid IDs.
    const result = verifyMembershipOwnership([membershipA, membershipB], "assoc-C-not-mine");
    assert.equal(result, null);
  });

  test("denies when the user has zero memberships", () => {
    const result = verifyMembershipOwnership([], "assoc-A");
    assert.equal(result, null);
  });
});
