# Deploying to Vercel with Neon or Supabase

> **Status: instructions only.** No account was created, nothing was pushed,
> no secret left this machine while preparing Phase 16. Every step below is
> for you to run when you're ready.

The application itself is hosting-provider neutral (`npm run build` +
`npm start`). These are the provider-specific notes for the most common
combination: **Vercel + PostgreSQL**.

---

## A. Common steps (both databases)

1. Push the repository to your Git remote (verify first: `git status` shows no
   `.env`, and `git check-ignore .env.example` reports *not ignored*).
2. In Vercel: *Add New Project* → import the repo. Framework preset
   **Next.js**; build command `npm run build`, output left default.
3. Add the environment variables below for **Production, Preview and
   Development** scopes:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | pooled Postgres URL (see B/C) with `sslmode=require` |
   | `AUTH_SECRET` | `openssl rand -base64 32` — store as a **Secret** |
   | `NEXT_PUBLIC_APP_URL` | `https://your-domain` (no trailing slash) |
   | `DEFAULT_CURRENCY` | optional, defaults to `NGN` |

   `NEXT_PUBLIC_*` values are inlined **at build time** — set them before the
   first deploy, and re-deploy after changing them.

4. **Run migrations before the app boots** (recommended: from your machine or
   CI, not from the build step):

   ```bash
   DATABASE_URL="<direct/non-pooled-url>" npx prisma migrate deploy
   DATABASE_URL="<direct/non-pooled-url>" npm run db:seed
   ```

5. Deploy, then run the smoke tests in
   [`deployment-checklist.md`](./deployment-checklist.md) §5 —
   including `curl -I https://your-domain/api/health`.

---

## B. Vercel + Neon

1. Create a Neon project (you do this; nothing was created here). Note the
   **pooled** and **direct** connection strings.
2. `DATABASE_URL` in Vercel → **pooled** string
   (`…-pooler.neon.tech…?sslmode=require`). The app opens many concurrent
   short-lived connections from serverless functions; the pooler absorbs them.
3. Migrations → use the **direct** (non-pooled) string. Neon's pooler can
   reject the prepared statements Prisma uses in some migration statements.
4. If a brand-new empty database: see
   [`database-operations.md`](./database-operations.md) §2 (one
   `prisma migrate deploy`). If the schema already exists without migration
   history: §3 (five `migrate resolve --applied` commands) **first**.
5. Branch previews: Vercel creates a preview deployment per PR; give Preview
   its own (branch/dummy) `DATABASE_URL` or leave it unset — startup
   validation will then intentionally **fail the preview boot** with a clear
   message instead of silently pointing at production.
6. Neon scale-to-freeze: disable suspension for production, or expect the first
   request after idle to be slow (`/api/health` is a good keep-alive probe).

---

## C. Vercel + Supabase

1. Create a Supabase project (you do this). In *Database → Connection
   string*, note three modes:
   - **Session pooler** (IPv4, transaction pooling) → use this for
     `DATABASE_URL` on Vercel. Serverless egress is often IPv4; the IPv6-only
     direct connection can fail from Vercel functions.
   - **Direct connection** → use for migrations (and for anything needing
     prepared statements / `LISTEN`).
   - **Transaction pooler** → also acceptable for the app, but the session
     pooler is the safer default with Prisma.
2. Append `?sslmode=require` to whichever you use.
3. Run the baseline/migrations with the **direct** URL (database-operations
   §2/§3), seed, then deploy.
4. Supabase free tier caps simultaneous connections (often ~60, and far fewer
   through the pooler) — the pooled URL is effectively mandatory on
   serverless. If you see `P1008`/too many connections, you're on the direct
   URL in the app: switch it to the pooler.
5. Row-Level Security: this application does its own authorization
   (session → membership → permissions → `WHERE associationId = …`). If you
   enable RLS on the public schema, add policies that allow the app role, or
   queries will start returning empty results.

---

## D. Domain & HTTPS

- Attach the domain in Vercel, then set `NEXT_PUBLIC_APP_URL` to the final
  `https://` origin and **re-deploy** (build-time inlining).
- HSTS, CSP and the other security headers come from `next.config.ts` and are
  applied automatically in production builds.
- Rotate `AUTH_SECRET` only if it leaks — doing so signs every user out.

## E. Rollback

Vercel: *Deployments* → promote the previous deployment (instant, app-only).
If the release also changed the schema, follow
[`deployment-checklist.md`](./deployment-checklist.md) §7 — restore the
pre-deploy dump into a fresh database rather than trying to reverse
migrations (no down-migrations exist).
