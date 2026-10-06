"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

/**
 * Consistent error handling (Phase 3.21, reworked in Phase 16): never render
 * a raw error message or stack trace to the user. `ForbiddenError` (thrown by
 * requirePermission()/requireRole()) gets a clear, specific message;
 * everything else — validation errors that slipped through, database errors,
 * unexpected exceptions — gets a generic message.
 *
 * The detail goes to the browser console here; the server-side detail for
 * uncaught errors is captured structured and redacted by `onRequestError` in
 * src/instrumentation.ts (see docs/monitoring.md).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ams] app segment error", error);
  }, [error]);

  return (
    <ErrorState
      variant={error.name === "ForbiddenError" ? "forbidden" : "error"}
      onRetry={error.name === "ForbiddenError" ? undefined : reset}
      backHref="/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
