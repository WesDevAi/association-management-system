# Tenant isolation pattern

This app is multi-tenant: many associations share one database. There is no
Postgres-level Row Level Security in the MVP, so tenant isolation is enforced
at the application layer. Every server-side data access MUST follow this
rule:

> **Every query against a tenant-owned model must include `associationId` in
> its `where` clause, sourced from the current authenticated session — never
> from a client-supplied value (route param, form field, header, etc.).**

Once auth is wired up (Phase 2+), the plan is:

1. `getCurrentMembership()` resolves the signed-in user's active membership
   (and therefore `associationId`) from the session — not from the URL.
2. Every `server/services/*` function takes `associationId` as an explicit,
   required argument, obtained only from step 1.
3. Route handlers / server actions never trust an `associationId` passed in
   from the client for authorization purposes; if a resource id is passed in
   (e.g. `memberId`), the query filters by `{ id: memberId, associationId }`
   together so a mismatched tenant simply returns "not found" instead of
   leaking existence.
4. `AuditLog` entries are written for sensitive cross-cutting actions
   (role changes, financial edits, member removal) so tenant admins have a
   trail.

This file is a placeholder for the actual tenant-scoping helpers, which will
be implemented alongside authentication in the next phase.
