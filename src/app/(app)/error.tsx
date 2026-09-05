"use client";

import { useEffect } from "react";
import { ShieldAlert, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Consistent error handling (Phase 3.21): never render a raw error message
 * or stack trace to the user. `ForbiddenError` (thrown by
 * requirePermission()/requireRole()) gets a clear, specific message;
 * everything else — validation errors that slipped through, database
 * errors, unexpected exceptions — gets a generic message. The actual error
 * is logged server-side (Next.js does this automatically for uncaught
 * errors in Server Components) for diagnostics without exposing detail to
 * the client.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isForbidden = error.name === "ForbiddenError";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      {isForbidden ? (
        <ShieldAlert className="size-10 text-muted-foreground" />
      ) : (
        <TriangleAlert className="size-10 text-muted-foreground" />
      )}
      <h2 className="text-lg font-semibold">
        {isForbidden ? "You don't have permission to view this" : "Something went wrong"}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {isForbidden
          ? "If you think this is a mistake, contact your association administrator."
          : "Please try again. If the problem continues, contact support."}
      </p>
      {!isForbidden ? (
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
