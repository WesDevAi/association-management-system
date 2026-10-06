# Monitoring & error tracking — AMS

No monitoring vendor or external SDK has been added. This document describes
what exists today and exactly where to attach a provider **once you pick one**
(needs explicit approval — see the open decisions in
[`deployment-checklist.md`](./deployment-checklist.md) §0).

---

## What exists today

### 1. Structured server logs — `src/lib/logger.ts`

Every record is one JSON line on stdout/stderr:

```json
{"time":"2026-10-06T02:00:00.000Z","level":"error","scope":"request",
 "msg":"unhandled server error","meta":{"path":"/dashboard","method":"GET", ...}}
```

- **Levels:** `debug | info | warn | error`; threshold via `LOG_LEVEL`
  (defaults to `info`, `debug` in development).
- **Scopes in use:** `startup`, `request` (add more as modules grow — the
  `scope` argument is the filter key).
- **Redaction is enforced in the logger**, not left to callers:
  secret-shaped keys (`password`, `secret`, `token`, `authorization`,
  `cookie`, `databaseUrl`, …) → `[redacted]`; `user:pass@host` connection
  strings → `[redacted]@host`; inline `secret: value` fragments in messages →
  masked; strings truncated at 500 chars; arrays at 20 items; errors reduced
  to `name / message / stack / digest`.

### 2. Startup validation — `src/instrumentation.ts` → `register()`

Runs once before the server accepts traffic. Emits
`{"scope":"startup","msg":"environment validated"}` with **presence booleans
only** (never values), or prints the full `EnvValidationError` and refuses to
boot. Alert on the absence of the success line.

### 3. Uncaught server errors — `src/instrumentation.ts` → `onRequestError`

Every uncaught Server Component / Server Action / route-handler error becomes
one structured record with `path`, `method`, `routePath`, `routeType` and the
serialized error. **Request headers are deliberately never logged** (they
carry the session cookie).

### 4. Client-side errors — React error boundaries

`src/app/error.tsx`, `src/app/(app)/error.tsx`, `src/app/(auth)/error.tsx`
write to the browser console and show a safe generic UI. Nothing is sent over
the network from the browser.

### 5. Health probe — `GET /api/health`

`200 {"status":"ok","database":"ok","latencyMs":…}` when the database answers;
`503 {"status":"degraded"}` otherwise. No details leaked. Use it for uptime
checks.

### 6. Application audit trail (business events, not errors)

`AuditLog` (Phase 15) records who changed what inside the app — see
`/audit-log`. That is for compliance/investigation, not for alerting.

---

## Recommended integration points (nothing added yet)

| Provider type | Where to attach | Effort |
|---|---|---|
| **Vercel logs / any log drain** | Zero code: ship stdout JSON as-is (already structured). | None |
| **Sentry (errors + tracing)** | `src/instrumentation.ts` `register()` → init SDK; `onRequestError` → `Sentry.captureException(err, {request})`; optional client SDK in `src/instrumentation-client.ts`. | Small, approval required (paid service + SDK) |
| **OpenTelemetry (Datadog, Grafana, Honeycomb, New Relic)** | `register()` → `registerOTel('ams')` as in the Next.js instrumentation docs; exporter via `OTEL_*` env vars. | Medium, approval required |
| **Axiom / Loki / CloudWatch** | Already compatible: drain stdout JSON; index on `scope` + `level`. | Small |
| **Uptime (BetterStack, Pingdom, provider native)** | Point at `GET /api/health`, 1–5 min interval. | Config only |
| **Client-side error reporting** | Add an `error-reporting fetch` inside `src/app/error.tsx`'s `useEffect` (replace `console.error`). | Small, approval required |

Constraints respected by this phase: **no paid service, no external SDK, no
outbound network call was added.**

---

## What to alert on (once a sink exists)

1. **Boot failure** — no `environment validated` record after deploy.
2. **Error rate** — `level:error` count per 5 min, by `scope`.
3. **Health** — `/api/health` returning 503 for > 1 min.
4. **Auth anomalies** — repeated `sign-in` failures from one IP (needs log
   fields we do not emit yet: add a `scope:"auth"` record before building this).
5. **Database** — connection saturation / `P1xxx` codes appearing.
6. **Backups** — no successful dump in 24 h (from the backup job's own log).

## What must never be logged

- `AUTH_SECRET`, `DATABASE_URL` credentials, cookies, `Authorization` headers.
- Passwords or password hashes (the logger redacts the *keys*; don't pass
  values under other keys).
- Member PII beyond ids: avoid full names, emails, phone numbers, note
  contents, documents. Log `membershipId`/`associationId` instead.
- Raw request/response bodies in `meta`.

The logger makes the *accident* less likely, not impossible — callers still
choose what goes into `meta`.
