"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";

/**
 * Error boundary for the login/register route group (Phase 16). Kept separate
 * from the root boundary so a failure here still renders inside the centered
 * auth layout and offers a retry instead of dumping the user out of the shell.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ams] auth segment error", error);
  }, [error]);

  return (
    <ErrorState
      title="Sign-in is temporarily unavailable"
      description="We couldn't complete that request. Please try again in a moment."
      onRetry={reset}
      backHref="/login"
      backLabel="Back to sign in"
    />
  );
}
