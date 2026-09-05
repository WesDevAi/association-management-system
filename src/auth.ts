import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/server/auth/password";
import { loginSchema } from "@/server/validation/auth";

/**
 * Auth.js (next-auth v5) configuration.
 *
 * Deliberately NOT using a database adapter: our schema doesn't have
 * (and this phase wasn't approved to add) Account/Session/VerificationToken
 * tables, and a Credentials-only provider doesn't need them. Sessions are
 * stateless JWTs signed with AUTH_SECRET (required env var, never
 * hardcoded — see .env.example).
 *
 * This file must only ever be imported from server-side code (route
 * handlers, Server Components, Server Actions, middleware) — never from a
 * "use client" component. `auth()` itself is safe to call from Server
 * Components; never expose `authorize()`'s access to prisma/bcrypt to the
 * client.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        // Same generic failure path whether the user doesn't exist, has no
        // password set (e.g. invite-only account), or the password is
        // wrong, or the account isn't ACTIVE — never reveal which case it
        // was to the client.
        if (!user || !user.passwordHash) return null;
        if (user.status !== "ACTIVE") return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        // Only the minimal identity fields — never the password hash —
        // ever leave this function.
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
