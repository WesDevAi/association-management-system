import type { DefaultSession } from "next-auth";

/**
 * Auth.js's default `Session["user"]` type doesn't include `id`. This
 * augmentation adds it, matching what our `session()` callback in
 * src/auth.ts actually puts there — keeps every `auth()` call site
 * correctly typed instead of needing `as` casts scattered around.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
