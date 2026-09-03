# services/

Server-side business logic, one file per domain (e.g. `member-service.ts`,
`payment-service.ts`, `finance-service.ts`). Route handlers, server actions,
and server components call into these — they should never contain Prisma
queries or business rules directly. Empty in Phase 1.

Every exported function here must accept `associationId` explicitly and use
it in every Prisma `where` clause — see `src/server/db/tenant.md`.
