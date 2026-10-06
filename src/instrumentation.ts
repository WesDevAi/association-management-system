import type { Instrumentation } from "next";
import { EnvValidationError, getEnv } from "@/lib/env";
import { logger, serializeError } from "@/lib/logger";

/**
 * Server instrumentation (Phase 16).
 *
 * `register()` runs exactly once when a Next.js server instance boots —
 * before it accepts traffic — which is where we validate the environment so
 * a misconfigured production deploy fails immediately and legibly instead of
 * breaking on the first login or the first database query.
 *
 * `onRequestError` receives every uncaught server-side error (Server
 * Components, Server Actions, route handlers) and emits one structured JSON
 * record. Request headers are deliberately NOT logged — they contain the
 * session cookie — and error payloads pass through the logger's redaction.
 */

export async function register(): Promise<void> {
  // `next build` also boots workers; validation belongs to the running server,
  // so a build machine without production secrets can still compile the app.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  // Middleware/edge runtime has no process lifecycle to guard; the Node
  // runtime register() below is the one that must gate server startup.
  if (process.env.NEXT_RUNTIME === "edge") return;

  try {
    const env = getEnv();
    logger.info("startup", "environment validated", {
      nodeEnv: env.nodeEnv,
      appUrl: env.NEXT_PUBLIC_APP_URL,
      defaultCurrency: env.DEFAULT_CURRENCY,
      // Presence only — never the value.
      authSecretConfigured: Boolean(env.AUTH_SECRET),
      databaseConfigured: Boolean(env.DATABASE_URL),
    });
  } catch (error) {
    if (error instanceof EnvValidationError) {
      // The message is already formatted for a human reading a boot log.
      // Then exit: a server that boots with an invalid configuration would
      // otherwise serve 500s while looking "up" to process managers and load
      // balancers.
      //
      // `process` is resolved through `globalThis` on purpose: webpack's edge
      // analyzer flags any statically written `process.*` member access found
      // in the middleware (edge) layer, and this module is compiled into that
      // layer even though the NEXT_RUNTIME guard above means the code never
      // runs there. In the Node runtime the lookup always succeeds.
      const nodeProcess = (
        globalThis as unknown as {
          process: {
            stderr: { write: (chunk: string, cb: () => void) => boolean };
            exit: (code?: number) => never;
          };
        }
      ).process;
      nodeProcess.stderr.write(`\n${error.message}\n`, () => nodeProcess.exit(1));
      setTimeout(() => nodeProcess.exit(1), 500);
      // Also fail the hook itself so Next marks startup as failed and stops
      // accepting requests while the exit below lands.
      throw error;
    } else {
      logger.error("startup", "environment validation crashed", {
        error: serializeError(error),
      });
      throw error;
    }
  }
}

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context
) => {
  // request.headers is intentionally omitted: it carries Authorization/Cookie.
  logger.error("request", "unhandled server error", {
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    error: serializeError(error),
  });
};
