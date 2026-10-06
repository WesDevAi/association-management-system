# Operations runbook — AMS

Symptom → cause → fix. Every command below is read-only or non-destructive
unless explicitly marked otherwise.

---

## 1. Database unavailable

**Symptoms:** pages under the app shell render the error boundary; logs show
`"scope":"request","msg":"unhandled server error"` with a Prisma
`P1001`/`P1002`/`P1017` message; `prisma migrate status` times out.

**Checks**

```bash
npx prisma migrate status      # reaches the DB? DNS/SSL/auth problem if it fails
# From the app host:
#   - DNS resolves?  nc -vz <db-host> 5432
#   - SSL required? Neon/Supabase need sslmode=require
```

**Fixes, in order**

1. Confirm `DATABASE_URL` is set in the host's env (not just in a local `.env`).
2. Confirm the connection string's database name and that the user exists.
3. Check the provider status page and whether the instance is paused
   (free-tier Neon/Supabase projects auto-pause — disable or wake them).
4. Connection storms: prefer the **pooled** connection string for the app;
   serverless hosts open many short-lived connections.
5. Still failing → restore from backup into a fresh DB (§5) and repoint.

**Never** "fix" connectivity by running `prisma migrate reset`.

---

## 2. Migration failure during deploy

**Symptoms:** `prisma migrate deploy` aborts; the app still runs on the old
schema.

**Read the error first**

| Message | Meaning | Action |
|---|---|---|
| `P3005` — non-empty schema, no migration history | Target DB was built with `db push` | Baseline it: database-operations **§3** (five `migrate resolve --applied` commands), then re-run deploy. |
| `P3009` — migration already applied but hash differs | The migration file changed after being applied | Never edit an applied migration. Revert the file to its committed state; put the new change in a **new** migration. |
| `relation … already exists` | Partial application / history out of sync | `npx prisma migrate status`; compare with a replay into a scratch DB (database-operations §1). Fix history, don't drop tables. |
| `column … already exists` | Same as above | Same as above. |
| Connection/timeout error | See §1 | Fix connectivity, re-run — `migrate deploy` resumes at the first pending migration. |

**After a failed deploy**

1. `npx prisma migrate status` — record exactly which migrations are applied.
2. The app keeps serving the **previous** schema; do not ship dependent code.
3. Fix forward with a corrected **new** migration, or restore data if the
   migration partially modified data (restore procedure §5).
4. Confirm with a scratch-DB replay (database-operations §1) before retrying.

**Never** run `prisma migrate dev`/`reset` against production.

---

## 3. Bad or missing environment variable

**Symptoms:** server refuses to boot and prints:

```
Invalid environment configuration — the server cannot start:
  - AUTH_SECRET is required in production (generate one with: openssl rand -base64 32).
  …
```

**Fix**

1. Compare the host's env UI against `.env.example` — every required variable
   must exist **on the host**, not only in the repo.
2. `AUTH_SECRET`: `openssl rand -base64 32` (≥ 32 chars).
3. `NEXT_PUBLIC_APP_URL`: absolute `https://` origin, no trailing slash.
4. `DATABASE_URL`: valid `postgresql://` URL with `sslmode=require`.
5. Redeploy/restart — startup validation runs before traffic is accepted.

**Related:** `PrismaSchemaValidationError` at boot means `prisma/schema.prisma`
is invalid — run `npm run db:validate` locally; the schema, not the env, is at
fault. Validation intentionally **skips during `next build`**, so a build
machine without secrets still compiles; only the running server enforces it.

---

## 4. Authentication failure

**Symptoms:** everyone is bounced back to `/login`, or login always returns
"Invalid email or password".

**Checks**

1. Startup log: did env validation pass? A missing/short `AUTH_SECRET` is the
   usual cause of "everyone signed out at once" after a redeploy — sessions
   are JWTs signed with it, so rotating it invalidates all sessions.
2. `NEXT_PUBLIC_APP_URL`/`AUTH_URL` must match the real origin — a mismatch
   breaks the callback origin check.
3. Cookie: requires `https` in production and same-site lax; check that the
   reverse proxy isn't stripping `Set-Cookie`.
4. User state: the account must be `ACTIVE` with a `passwordHash`
   (`User.status`), and its `Membership` must be `ACTIVE` for the association.

**Safe actions**

- Re-create `AUTH_SECRET` **only** if it was leaked — this signs every user
  out (they just log in again). Do not do it casually.
- Verify one known-good account through the login page and the API:
  `curl -i -X POST https://<domain>/api/auth/callback/credentials` is rarely
  needed; prefer the browser flow + server logs.

**Never** log or paste `AUTH_SECRET`, cookies, or `Authorization` headers into
tickets — the logger redacts them, raw shell output does not.

---

## 5. Restoring a backup

**When:** accidental deletion, corruption, or a botched data migration.

```bash
# 1. Never restore on top of live data. Create a NEW empty database.
#    (Neon/Supabase: create a branch/temp DB from the dashboard.)

# 2. Restore into it
./scripts/restore-db.sh backups/ams-<ts>.dump "postgresql://…/ams_restore_check"
#    The script refuses non-empty targets — that is intentional.

# 3. VERIFY before switching: spot-check counts and a few known records
psql "postgresql://…/ams_restore_check" -c 'SELECT count(*) FROM "Member"' 2>/dev/null || \
  psql "postgresql://…/ams_restore_check" -c 'SELECT count(*) FROM "Membership"'

# 4. Take a fresh backup of the CURRENT database (evidence before any swap)

# 5. Swap: point DATABASE_URL at the restored DB and restart the app.
#    Verify with docs/deployment-checklist.md §5 smoke tests.
```

If the restore is for a **schema** problem rather than data loss, prefer
database-operations §1 (replay verification) and a corrective migration.

---

## 6. Quick reference

| Goal | Command |
|---|---|
| Is the DB reachable? | `npx prisma migrate status` |
| What's pending? | `npx prisma migrate status` |
| Apply pending migrations | `npx prisma migrate deploy` |
| Is the schema valid? | `npm run db:validate` |
| Full pre-deploy gate | `npm run verify` |
| Backup | `./scripts/backup-db.sh "$DATABASE_URL"` |
| Restore (empty target only) | `./scripts/restore-db.sh <dump> <empty-url>` |
| Full health check | `docs/deployment-checklist.md` §5 |

Escalation: provider status pages → provider support → restore from backup.
