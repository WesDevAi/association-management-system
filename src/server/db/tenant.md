# Tenant isolation pattern

This app is multi-tenant: many associations share one database. There is no
Postgres-level Row Level Security in the MVP, so tenant isolation is enforced
at the application layer.

## Direct association ownership

**Every tenant-owned table carries its own `associationId` column directly**
— not just transitively through a parent relation. This was tightened in
Phase 2.1: `Attendance` and `ExecutiveAppointment` previously only reached
`Association` via `meetingId → Meeting.associationId` /
`membershipId → Membership.associationId` and `executivePositionId →
ExecutivePosition.associationId` respectively. Both now have their own
`associationId` column, indexed, set at creation time from the parent record.

The rule going forward: **when a new tenant-owned model is added, it gets its
own `associationId` even if it's reachable through a parent.** This is
deliberate denormalization — the cost is one extra column and one extra
write at creation time; the benefit is that no query is ever more than one
hop from a direct tenant filter, and no one has to remember which join path
is "the correct one" to trust for security.

## Tenant-safe querying

> **Every query against a tenant-owned model must include `associationId` in
> its `where` clause, sourced from the current authenticated session — never
> from a client-supplied value (route param, form field, header, etc.).**

```ts
// Wrong — relies on nothing enforcing tenant scope:
const record = await prisma.attendance.findUnique({ where: { id } });

// Right — a mismatched tenant returns "not found," not someone else's data:
const record = await prisma.attendance.findFirst({
  where: { id, associationId: activeAssociationId },
});
```

## Cross-tenant protection (the concrete scenario)

> Association A must never be able to request `/members/[association-B-member-id]`
> and receive Association B's member.

With every tenant-owned table now carrying `associationId` directly, this is
achievable everywhere by construction, provided every lookup uses the
`{ id, associationId }` compound filter pattern above — including for
`Attendance` and `ExecutiveAppointment`, which is the specific gap this
phase closed.

## Attendance tenant validation

`Attendance.associationId` must equal both `Attendance.meeting.associationId`
and `Attendance.membership.associationId` — these three should never
disagree. The database does not enforce this cross-column agreement (Prisma/
Postgres has no clean declarative way to say "these three FK chains must
resolve to the same value"), so the **service layer that creates an
Attendance row must explicitly verify** the `Meeting` and `Membership` it's
about to link both belong to the caller's active association before writing
`associationId` onto the new row from that same trusted value — never let a
client supply `associationId` directly, and never infer it from the
`meetingId`/`membershipId` alone without checking they agree.

## Executive appointment tenant validation

Same pattern: `ExecutiveAppointment.associationId` must agree with both
`ExecutiveAppointment.executivePosition.associationId` and
`ExecutiveAppointment.membership.associationId`. The service layer that
creates an appointment must verify the position and the membership both
belong to the same, caller-authenticated association before writing the row.

## Session/authorization design requirement

Because `User` is global (see below) and one user can have memberships in
multiple associations, "the current association" cannot be a fixed claim
baked into a long-lived session token:

1. Session identifies the `User` only.
2. A separate, explicit "active association" selector names which
   membership is active for the current request.
3. Every server-side request re-resolves `Membership` fresh from
   `{ userId, associationId: activeAssociationId }` — never trusts a cached
   role/permission from the token. This correctly handles a member being
   suspended or having their role changed mid-session.

## User vs. Membership

These are deliberately separate concepts and must stay that way:

- **`User`** = an authenticated account. Global — has no `associationId`.
  A person can hold `Membership` rows in many associations under one `User`.
- **`Membership`** = a person's belonging to one specific association.
  `Membership.userId` is **optional** — a membership can exist (with its own
  `fullName`/`email`/`phone`) before, or entirely without, a linked login
  account. This supports bulk-imported member rosters, paper-register
  onboarding, and members who will never create an account. When a member
  is later invited to "claim" their record, `Membership.userId` gets linked
  to a real `User`.
- A user's role/permissions are **per-membership**, via `Membership.roleId`
  — the same person can be `ASSOCIATION_ADMIN` in one association and a
  plain `MEMBER` in another, because each `Membership` row has its own
  `roleId` independent of any other association that `User` belongs to.

## Role vs. ExecutivePosition

Also deliberately separate:

- **`Role`** = a permission tier (`SUPER_ADMIN`, `ASSOCIATION_ADMIN`,
  `STAFF`, `AUDITOR`, `MEMBER`). Small, stable, seeded by the platform.
  Defines *what someone can do*.
- **`ExecutivePosition`** = a leadership title (`Chairman`, `Treasurer`,
  `Secretary`, or anything else an association wants to call its offices).
  Freely nameable per association. Defines *what title someone holds*, and
  optionally (via `ExecutivePosition.roleId`) *which permission tier that
  title carries*. Renaming or adding a leadership title never touches the
  `Role`/`Permission` tables.

This file is a placeholder for the actual tenant-scoping helper functions
(`getActiveMembership()`, `requireMembership()`, etc.), which will be
implemented in `src/server/db/tenant.ts` alongside authentication in Phase 3.
