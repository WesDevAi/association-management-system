"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

/**
 * Root error boundary (Phase 16) — catches anything that escapes a more
 * specific boundary (root layout failures, errors outside the (app) shell).
 *
 * Browser console only: no request context or secrets are available here and
 * nothing is sent over the network. Uncaught SERVER-side errors are captured
 * with full request context by `onRequestError` in src/instrumentation.ts,
 * which is where a future error-tracking SDK should be attached.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ams] unhandled client error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <ErrorState
        variant={error.name === "ForbiddenError" ? "forbidden" : "error"}
        onRetry={reset}
        backHref="/"
        backLabel="Go home"
      />
    </main>
  );
}
