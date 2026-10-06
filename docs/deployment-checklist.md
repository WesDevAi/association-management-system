# Deployment checklist — AMS

Provider-neutral. Provider-specific steps live in
[`docs/deploy-vercel.md`](./deploy-vercel.md) (Vercel + Neon / Supabase).
Database details live in [`docs/database-operations.md`](./database-operations.md).

Nothing here creates accounts, pushes secrets, or touches an external service.

---

## 0. Decisions you must make first

| Decision | Options | Notes |
|---|---|---|
| Hosting provider | Vercel / Railway / Render / Fly.io / VPS+Docker | App is a standard Next.js 16 server. |
| Database provider | Neon / Supabase / RDS / self-hosted PostgreSQL | Must be PostgreSQL ≥ 14. |
| Email provider | Resend / Postmark / SES / none | Not integrated yet — no email is sent by the app today. |
| File storage | Local disk / S3 / Supabase Storage | Documents are stored per current schema; storage backend not yet pluggable. |
| Domain | e.g. `ams.example.com` | Feeds `NEXT_PUBLIC_APP_URL`. |
| Monitoring / error tracking | None → Vercel logs / Sentry / Datadog / Axiom | See [`docs/monitoring.md`](./monitoring.md). Nothing was added — needs your approval. |
| Backups | Provider PITR + off-box `pg_dump` | See database-operations §5. |

## 1. Environment setup

- [ ] `cp .env.example .env` locally; for the host, set the same variables in
      its secret/env UI (never commit `.env` — it is gitignored).
- [ ] `AUTH_SECRET` generated (`openssl rand -base64 32`), ≥ 32 chars,
      stored as a **secret**. Startup validation refuses production boots without it.
- [ ] `DATABASE_URL` set with `sslmode=require` (Neon/Supabase), pointing at
      the correct project/host.
- [ ] `NEXT_PUBLIC_APP_URL` = the final `https://` origin, no trailing slash.
- [ ] `AUTH_URL` left unset unless the auth origin differs from the app URL.
- [ ] Optional: `DEFAULT_CURRENCY`, `LOG_LEVEL`.
- [ ] Confirm no secret is prefixed `NEXT_PUBLIC_` (only `NEXT_PUBLIC_APP_URL`
      is browser-visible).

## 2. Quality gates (run before every deploy)

```bash
npm ci
npm run db:validate     # Prisma schema valid
npx prisma generate     # client matches schema
npm run typecheck       # tsc --noEmit
npm run lint            # eslint, zero warnings
npm test                # full suite
npm run build           # production build
```

Or all of them: `npm run verify`.

## 3. Database preparation

- [ ] Empty new database **or** an existing database that already has
      `_prisma_migrations` (see database-operations §2/§3 for the baseline).
- [ ] `npx prisma migrate status` reviewed against the target DB.
- [ ] Backup taken (or provider PITR confirmed enabled).
- [ ] Run `npx prisma migrate deploy` against the production URL (non-destructive).
- [ ] Run `npm run db:seed` (idempotent permission/role catalogue).
- [ ] Re-check `npx prisma migrate status` → *up to date*.

## 4. Deploy the application

- [ ] Push the commit (no `.env`, no secrets in the diff — check `git status`).
- [ ] Configure the env vars from §1 in the hosting provider.
- [ ] Build command: `npm run build`; start command: `npm start`
      (Vercel uses these automatically from `package.json`).
- [ ] Deploy; confirm the startup log contains
      `{"…","scope":"startup","msg":"environment validated"}`.

## 5. Smoke tests (production, within minutes of deploy)

- [ ] `GET /` → 200, and response headers include `content-security-policy`,
      `x-content-type-options: nosniff`, `x-frame-options: DENY`,
      and **no** `x-powered-by`.
- [ ] `GET /api/health` → `200 {"status":"ok","database":"ok"}`.
- [ ] `GET /this-route-does-not-exist` → the custom 404 page.
- [ ] `GET /login` → 200; sign in with a known account → lands on `/dashboard`.
- [ ] Open Members, Finance, Meetings → data renders (DB reachable).
- [ ] Switch association (if you have >1) → context switches, data changes.
- [ ] A restricted user hitting a guarded page/action gets the friendly
      "You don't have permission" screen, not a stack trace.
- [ ] `curl -I https://<domain>/` and confirm HSTS present (production only).

## 6. Backups

- [ ] Provider backup/PITR enabled and a first backup exists.
- [ ] One `./scripts/backup-db.sh` dump stored off the hosting provider.
- [ ] Restore tested at least once into an **empty** scratch database
      (`./scripts/restore-db.sh`).

## 7. Rollback plan

1. **App only** (no schema change in the release): redeploy the previous
   build/commit in the hosting provider. Data stays compatible.
2. **Schema change involved**: restore the pre-deploy dump into a *new*
   database (`scripts/restore-db.sh`), point `DATABASE_URL` at it, restart.
   Never run `prisma migrate reset`. There are no down-migrations — roll
   forward with a corrective migration where possible.
3. Verify with the §5 smoke tests after any rollback.

## 8. Post-deploy checks (first 24 h)

- [ ] Startup log shows validated environment, no `EnvValidationError`.
- [ ] No `unhandled server error` records in the logs
      (`grep '"msg":"unhandled server error"'` / provider log search).
- [ ] `npx prisma migrate status` still *up to date*.
- [ ] Error rate on `/login` and the main dashboards is flat.
- [ ] Nightly backup job producing non-empty dumps.
- [ ] Documented open decisions (§0) closed or explicitly deferred.
