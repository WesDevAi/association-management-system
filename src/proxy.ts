import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Proxy (formerly "middleware" — renamed by Next.js 16; the old file
 * convention is deprecated). Runs before a request is rendered.
 *
 * Route-protection convenience layer only. Redirecting an unauthenticated
 * visitor away from a protected path here is a UX nicety — it is NOT the
 * security boundary. Every Server Component/Server Action/route handler
 * under the protected paths must still independently call requireAuth()/
 * requireAssociationContext() (see src/server/permissions/guards.ts),
 * because the proxy can be bypassed by directly invoking a Server Action
 * or route handler, and because it has no way to enforce tenant- or
 * permission-scoped authorization — only "is there a session at all."
 *
 * Keep this file free of app imports beyond `@/auth`: the proxy runs in the
 * edge runtime and should stay tiny.
 */
export const proxy = auth((req) => {
  const isAuthenticated = !!req.auth;

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
