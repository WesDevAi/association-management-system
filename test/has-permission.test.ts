import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { hasPermission, hasAllPermissions, hasAnyPermission } from "@/server/permissions/has-permission";
import { PERMISSIONS } from "@/lib/constants/permissions";

function membershipWithPermissions(keys: string[]) {
  return {
    role: {
      rolePermissions: keys.map((key) => ({ permission: { key } })),
    },
  };
}

describe("hasPermission", () => {
  test("returns true when the role's permission set includes the key", () => {
    const membership = membershipWithPermissions([PERMISSIONS.MEMBERS_VIEW]);
    assert.equal(hasPermission(membership, PERMISSIONS.MEMBERS_VIEW), true);
  });

  test("returns false when the role's permission set does not include the key", () => {
    const membership = membershipWithPermissions([PERMISSIONS.MEMBERS_VIEW]);
    assert.equal(hasPermission(membership, PERMISSIONS.FINANCE_MANAGE), false);
  });

  test("returns false for a null/undefined membership (e.g. no association context)", () => {
    assert.equal(hasPermission(null, PERMISSIONS.MEMBERS_VIEW), false);
    assert.equal(hasPermission(undefined, PERMISSIONS.MEMBERS_VIEW), false);
  });
});

describe("hasAllPermissions / hasAnyPermission", () => {
  const membership = membershipWithPermissions([PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.REPORTS_VIEW]);

  test("hasAllPermissions requires every key to be present", () => {
    assert.equal(hasAllPermissions(membership, [PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.REPORTS_VIEW]), true);
    assert.equal(hasAllPermissions(membership, [PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.FINANCE_MANAGE]), false);
  });

  test("hasAnyPermission requires at least one key to be present", () => {
    assert.equal(hasAnyPermission(membership, [PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.REPORTS_VIEW]), true);
    assert.equal(hasAnyPermission(membership, [PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.FINES_MANAGE]), false);
  });
});
