import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * `import "server-only"` ensures a client component accidentally importing
 * this file fails the build loudly, rather than silently bundling
 * server-only auth logic into client JS.
 */

export type CurrentUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

/** Returns the signed-in user, or null. Does not redirect. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

/**
 * Returns the signed-in user or redirects to /login. This is the
 * convenience/UX layer described in the tenant docs — middleware already
 * redirects most unauthenticated page loads, but Server Actions and
 * directly-invoked Server Components aren't covered by middleware, so
 * every server-side entry point that needs a user must call this itself.
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
