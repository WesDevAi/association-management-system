import "server-only";
import { z } from "zod";

/**
 * Startup environment validation (Phase 16).
 *
 * Why this exists:
 *   A missing AUTH_SECRET or DATABASE_URL otherwise surfaces as a confusing
 *   runtime failure (Auth.js throws mid-request, Prisma fails on first query).
 *   Validating once, at server startup, turns that into one clear, complete
 *   error message listing every problem.
 *
 * Rules enforced here:
 *   - DATABASE_URL: required everywhere, must be a postgres:// or
 *     postgresql:// URL. Never logged, never exposed to the browser.
 *   - AUTH_SECRET: REQUIRED in production, minimum 32 characters. Optional in
 *     development (Auth.js generates a throwaway dev secret) but validated for
 *     length when present.
 *   - NEXT_PUBLIC_APP_URL: required everywhere, absolute http(s) URL. This is
 *     the ONLY variable intentionally visible to the browser bundle; everything
 *     else in this file is server-only and must never be prefixed NEXT_PUBLIC.
 *   - AUTH_URL / DEFAULT_CURRENCY: optional, format-checked when present.
 *
 * `import "server-only"` makes an accidental client-side import fail the build
 * instead of silently shipping server configuration to the browser.
 *
 * This module is called from `src/instrumentation.ts` (server startup) and is
 * deliberately NOT imported at module scope anywhere else, so a build without
 * production secrets can still compile — the hard failure happens when the
 * server actually boots.
 */

export class EnvValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(
      [
        "Invalid environment configuration — the server cannot start:",
        ...issues.map((issue) => `  - ${issue}`),
        "",
        "Fix the variables above in your .env (local) or host environment",
        "settings (production), then restart. See .env.example for every",
        "required variable and docs/deployment-checklist.md for the full",
        "setup sequence.",
      ].join("\n")
    );
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

export type AppEnv = {
  nodeEnv: "development" | "test" | "production";
  DATABASE_URL: string;
  AUTH_SECRET: string | undefined;
  AUTH_URL: string | undefined;
  NEXT_PUBLIC_APP_URL: string;
  DEFAULT_CURRENCY: string;
};

const postgresUrl = z
  .string()
  .trim()
  .min(1, "must not be empty")
  .refine((value) => /^postgres(ql)?:\/\/\S+$/.test(value), {
    message: 'must be a postgres:// or postgresql:// connection string',
  });

const optionalHttpUrl = z
  .string()
  .trim()
  .refine((value) => /^https?:\/\/\S+$/.test(value), {
    message: 'must be an absolute http:// or https:// URL',
  });

/**
 * Parses and validates a raw environment source.
 *
 * Kept pure (takes the source as an argument, no module state) so it can be
 * unit-tested without touching process.env.
 */
export function parseEnv(
  source: Record<string, string | undefined>,
  options: { nodeEnv?: AppEnv["nodeEnv"] } = {}
): AppEnv {
  const nodeEnv =
    options.nodeEnv ??
    ((source.NODE_ENV as AppEnv["nodeEnv"] | undefined) ?? "development");
  const isProduction = nodeEnv === "production";

  const issues: string[] = [];

  const databaseUrl = source.DATABASE_URL?.trim();
  if (!databaseUrl) {
    issues.push("DATABASE_URL is required (PostgreSQL connection string).");
  } else {
    const parsed = postgresUrl.safeParse(databaseUrl);
    if (!parsed.success) {
      issues.push(`DATABASE_URL ${parsed.error.issues[0]?.message}.`);
    }
  }

  const authSecret = source.AUTH_SECRET?.trim() || undefined;
  if (isProduction) {
    if (!authSecret) {
      issues.push(
        "AUTH_SECRET is required in production (generate one with: openssl rand -base64 32)."
      );
    } else if (authSecret.length < 32) {
      issues.push(
        `AUTH_SECRET must be at least 32 characters in production (got ${authSecret.length}).`
      );
    }
  } else if (authSecret && authSecret.length < 16) {
    issues.push("AUTH_SECRET must be at least 16 characters when set.");
  }

  const appUrl = source.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) {
    issues.push(
      "NEXT_PUBLIC_APP_URL is required (absolute URL of this deployment)."
    );
  } else if (!/^https?:\/\/\S+$/.test(appUrl)) {
    issues.push("NEXT_PUBLIC_APP_URL must be an absolute http:// or https:// URL.");
  } else if (isProduction && appUrl.startsWith("http://") && !appUrl.includes("localhost")) {
    issues.push(
      "NEXT_PUBLIC_APP_URL must use https:// in production (cookies and auth callbacks depend on it)."
    );
  }

  const authUrl = source.AUTH_URL?.trim() || undefined;
  if (authUrl && !optionalHttpUrl.safeParse(authUrl).success) {
    issues.push("AUTH_URL must be an absolute http:// or https:// URL.");
  }

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  const defaultCurrency = (source.DEFAULT_CURRENCY?.trim() || "NGN").toUpperCase();
  if (!/^[A-Z]{3}$/.test(defaultCurrency)) {
    throw new EnvValidationError([
      `DEFAULT_CURRENCY must be a 3-letter ISO currency code (got "${defaultCurrency}").`,
    ]);
  }

  return Object.freeze({
    nodeEnv,
    DATABASE_URL: databaseUrl as string,
    AUTH_SECRET: authSecret,
    AUTH_URL: authUrl,
    NEXT_PUBLIC_APP_URL: appUrl as string,
    DEFAULT_CURRENCY: defaultCurrency,
  });
}

let cached: AppEnv | null = null;

/** Validates `process.env` once per server process and memoizes the result. */
export function getEnv(): AppEnv {
  if (!cached) {
    cached = parseEnv(process.env);
  }
  return cached;
}

/** Test-only helper: clears the memoized environment. */
export function resetEnvCache(): void {
  cached = null;
}
