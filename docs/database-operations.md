# Database operations — AMS

Everything here is **non-destructive**. There is no situation in which
`prisma migrate reset` is acceptable against a database with real data.

---

## 1. Migration history: what happened and why a baseline exists

The repository's original migration history was **incomplete**:

| Migration | What it does |
|---|---|
| `20260906000000_baseline_initial_schema` | **Baseline.** Creates the full initial schema (24 tables, all enums, indexes). Added in Phase 16. |
| `20260907000000_add_meeting_fields` | Additive: `Meeting.meetingNumber/agenda/notes`. |
| `20260907010000_extend_executive_models` | Additive: enum values + `ExecutivePosition` columns. |
| `20260907020000_extend_finance_models` | Additive: `PaymentCategory` columns. |
| `20260907030000_add_expense_models` | Additive: `ExpenseCategory` + `Expense` tables. |

The four `20260907*` migrations are `ALTER TABLE`/`CREATE TABLE` statements
that assume the core tables already exist — on their own they cannot create a
database. The core tables were originally produced by `prisma db push`
directly from `schema.prisma`, so they were never recorded as a migration.
The baseline closes that gap.

**Verified (Phase 16):**

- Replaying `baseline → 20260907* ×4` on an empty PostgreSQL database
  produces a schema **identical** to `prisma/schema.prisma`
  (`prisma migrate diff --from-url … --to-schema-datamodel … --exit-code`
  → *No difference detected*).
- The four original migrations apply cleanly **on top of** the baseline.
- On an existing database created by `db push` (no `_prisma_migrations`
  table), `prisma migrate resolve --applied` for each migration makes
  `prisma migrate status` report *Database schema is up to date* and
  `prisma migrate deploy` a no-op.

Because of that verification, `prisma migrate deploy` **is** safe on an empty
production database — but only on this exact migration set. If the folders in
`prisma/migrations/` ever change, re-run the verification below first.

### Re-verify the history (read-only, always safe)

```bash
# 1. Replay the full history into a throwaway database
createdb ams_history_check                       # or CREATE DATABASE ams_history_check;
DATABASE_URL="postgresql://<user>@localhost:5432/ams_history_check" npx prisma migrate deploy

# 2. Prove it matches the schema
npx prisma migrate diff \
  --from-url "postgresql://<user>@localhost:5432/ams_history_check" \
  --to-schema-datamodel prisma/schema.prisma \
  --exit-code        # must print "No difference detected" and exit 0

# 3. Clean up the throwaway database
dropdb ams_history_check
```

---

## 2. Baseline strategy for a **new** production database (Neon / Supabase)

An empty production database needs **one** command:

```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
```

That applies the baseline + the four additive migrations and records all five
in `_prisma_migrations`. Nothing else is required.

## 3. Baseline strategy for an **existing** production database

If the target database already contains the AMS tables but **no
`_prisma_migrations` table** (it was created with `prisma db push`), do **not**
run `migrate deploy` first — it would try to re-create existing tables and
fail halfway. Record history first:

```bash
export DATABASE_URL="<production-url>"

# 1. Confirm there is genuinely no migration history yet
npx prisma migrate status
#    → expected: "_prisma_migrations does not exist" or "no pending migrations"

# 2. Record every migration as already applied (schema is NOT touched)
npx prisma migrate resolve --applied 20260906000000_baseline_initial_schema
npx prisma migrate resolve --applied 20260907000000_add_meeting_fields
npx prisma migrate resolve --applied 20260907010000_extend_executive_models
npx prisma migrate resolve --applied 20260907020000_extend_finance_models
npx prisma migrate resolve --applied 20260907030000_add_expense_models

# 3. Verify — must say "Database schema is up to date"
npx prisma migrate status

# 4. From then on, deploys use the normal non-destructive path:
npx prisma migrate deploy
```

`migrate resolve` only writes rows to `_prisma_migrations`; it never alters
tables or data.

> **Local development note:** your local `ams_dev` database was created with
> `db push` and has **no** `_prisma_migrations` table. Run steps 1–3 above
> once against `.env` before ever running `npm run db:migrate`, otherwise
> Prisma will try to apply the baseline to tables that already exist.

## 4. Commands allowed in production

| Command | Production? | Effect |
|---|---|---|
| `prisma migrate deploy` | ✅ | Applies **pending** migrations only. Non-destructive. |
| `prisma migrate status` | ✅ | Read-only. |
| `prisma migrate resolve --applied <name>` | ✅ (baseline only) | Writes a bookkeeping row. Never touches tables. |
| `prisma migrate diff` | ✅ | Read-only comparison. |
| `prisma db push` | ⚠️ dev only | Can drop/alter columns without a migration record. Never run in prod. |
| `prisma migrate dev` | ⚠️ dev only | Can reset the **shadow** database and re-create dev tables. |
| `prisma migrate reset` | ❌ **never** | **Drops the database and all data.** |
| `prisma db execute --file …` | ⚠️ review first | Arbitrary SQL. Only for reviewed, documented statements. |

Safe deployment sequence for a brand-new database (Neon or Supabase):

```bash
# 0. one-time, on your machine
cp .env.example .env           # then fill in DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL
npm ci

# 1. build + test gates (no database access required for these two)
npm run db:validate            # schema is valid
npm run typecheck && npm run lint && npm test

# 2. create the production schema (empty database ONLY — see §3 otherwise)
DATABASE_URL="<production-url>" npx prisma migrate deploy

# 3. seed the permission/role catalogue (idempotent, safe to re-run)
DATABASE_URL="<production-url>" npm run db:seed

# 4. build the app, then deploy the server (Vercel/Node/container)
npm run build
```

---

## 5. Backup and restore

Prerequisites: PostgreSQL client tools (`pg_dump`, `pg_restore`, `psql`)
installed locally or in CI. Version should match or be newer than the server
(Neon and Supabase both publish current clients).

### Backup

```bash
./scripts/backup-db.sh "<postgres-url>"          # writes ./backups/ams-<timestamp>.dump
```

Equivalent manual command:

```bash
mkdir -p backups
pg_dump --format=custom --no-owner --no-privileges \
  --file "backups/ams-$(date +%Y%m%d-%H%M%S).dump" \
  "$DATABASE_URL"
```

`--format=custom` gives compressed, selectively restorable output.
Verify each backup is non-empty:

```bash
ls -lh backups/
pg_restore --list backups/ams-<ts>.dump | head   # must list the tables
```

**Recommended cadence:** daily automated dump + the hosting provider's
point-in-time recovery (Neon and Supabase both retain WAL/PITR — keep both).

### Restore

Restores **never** overwrite the live database. The procedure is always
"restore into a fresh database, verify, then swap":

```bash
./scripts/restore-db.sh backups/ams-<ts>.dump "<url-of-EMPTY-database>"
```

Equivalent manual commands:

```bash
createdb ams_restore_check
pg_restore --no-owner --no-privileges \
  --dbname "postgresql://…/ams_restore_check" \
  backups/ams-<ts>.dump

# verify row counts / spot-check data, then repoint DATABASE_URL at it
```

Swapping traffic to a restored database = update `DATABASE_URL` and restart.
Take a fresh backup of the current database *before* any swap.

### Pre-deployment database checklist

- [ ] Migration history re-verified (§1) after any change to `prisma/migrations/`.
- [ ] `npx prisma validate` passes.
- [ ] `npx prisma generate` produces a client matching `schema.prisma`.
- [ ] Target database is **empty** (→ §2) **or** already baselined (→ §3).
- [ ] `npx prisma migrate status` says exactly what you expect *before* deploying.
- [ ] A backup taken within the last 24 h exists and has been listed with `pg_restore --list`.
- [ ] `DATABASE_URL` uses SSL (`sslmode=require` on Neon/Supabase) and points at
      the intended project (check the hostname!).
- [ ] Connection-pool mode understood: **pooled** URL for the app, **direct**
      URL for migrations if the pooler rejects prepared statements.
- [ ] Production seed (`npm run db:seed`) run once — it is idempotent.
- [ ] Rollback target known: previous backup + previous application version.
