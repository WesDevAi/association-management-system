"use client";

import Link from "next/link";
import { FileQuestion, ShieldAlert, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shared presentation for every error boundary / 404 surface (Phase 16).
 *
 * The rule from Phase 3.21 still holds: users never see a raw exception,
 * stack trace, or database message — the detail is logged server-side
 * (see src/lib/logger.ts + src/instrumentation.ts) and the UI shows one of
 * these three safe shapes.
 *
 * Used by:
 *   - src/app/error.tsx            (root boundary, outside the app shell)
 *   - src/app/(app)/error.tsx      (protected area, inside the app shell)
 *   - src/app/(auth)/error.tsx     (login/register)
 *   - src/app/not-found.tsx        (404)
 */
export type ErrorStateVariant = "error" | "forbidden" | "not-found";

type ErrorStateProps = {
  variant?: ErrorStateVariant;
  title?: string;
  description?: string;
  /** When provided, renders a "Try again" button that re-renders the segment. */
  onRetry?: () => void;
  /** When provided, renders a link back to this href (e.g. "/dashboard"). */
  backHref?: string;
  backLabel?: string;
};

const DEFAULTS: Record<
  ErrorStateVariant,
  { title: string; description: string; icon: typeof TriangleAlert }
> = {
  error: {
    title: "Something went wrong",
    description: "Please try again. If the problem continues, contact support.",
    icon: TriangleAlert,
  },
  forbidden: {
    title: "You don't have permission to view this",
    description:
      "If you think this is a mistake, contact your association administrator.",
    icon: ShieldAlert,
  },
  "not-found": {
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has moved.",
    icon: FileQuestion,
  },
};

export function ErrorState({
  variant = "error",
  title,
  description,
  onRetry,
  backHref,
  backLabel,
}: ErrorStateProps) {
  const defaults = DEFAULTS[variant];
  const Icon = defaults.icon;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <Icon className="size-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{title ?? defaults.title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {description ?? defaults.description}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            {backLabel ?? "Go back"}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
