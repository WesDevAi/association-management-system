import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liveness/readability probe (Phase 16).
 *
 * Intentionally:
 *   - unauthenticated (it exposes no data — only a status word and latency),
 *   - `no-store` so no CDN caches a stale "ok",
 *   - never reveals the underlying error message; details go to the structured
 *     logs instead (see docs/runbook.md §1).
 *
 * Use it for post-deploy smoke tests, uptime checks and load-balancer probes:
 *   200 {"status":"ok"}   → serving and the database is reachable
 *   503 {"status":"degraded"} → database unreachable / server unhealthy
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        database: "ok",
        latencyMs: Date.now() - startedAt,
        time: new Date().toISOString(),
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "unreachable", time: new Date().toISOString() },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
