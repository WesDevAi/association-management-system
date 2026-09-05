import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Route-protection convenience layer only. Redirecting an unauthenticated
 * visitor away from a protected path here is a UX nicety — it is NOT the
 * security boundary. Every Server Component/Server Action/route handler
 * under the protected paths must still independently call requireAuth()/
 * requireAssociationContext() (see src/server/permissions/guards.ts),
 * because middleware can be bypassed by directly invoking a Server Action
 * or route handler, and because it has no way to enforce tenant- or
 * permission-scoped authorization — only "is there a session at all."
 */
export default auth((req) => {
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
