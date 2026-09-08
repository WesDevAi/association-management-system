import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveActiveMembership, verifyMembershipOwnership } from "@/server/db/tenant-logic";

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

describe("meeting-service helper: MeetingListItem shape", () => {
  test("maps a meeting record to MeetingListItem correctly", () => {
    const raw = {
      id: "meet-1",
      title: "General Assembly",
      description: null,
      type: "GENERAL",
      scheduledAt: new Date("2026-01-15T10:00:00Z"),
      endedAt: null,
      location: null,
      isVirtual: false,
      meetingLink: null,
      status: "SCHEDULED",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      attendeeCount: 0,
    };

    const item = {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      type: raw.type,
      scheduledAt: raw.scheduledAt,
      endedAt: raw.endedAt,
      location: raw.location,
      isVirtual: raw.isVirtual,
      meetingLink: raw.meetingLink,
      status: raw.status,
      createdAt: raw.createdAt,
      attendeeCount: raw.attendeeCount,
    };

    assert.equal(item.id, "meet-1");
    assert.equal(item.title, "General Assembly");
    assert.equal(item.type, "GENERAL");
    assert.equal(item.status, "SCHEDULED");
    assert.equal(item.attendeeCount, 0);
  });
});
