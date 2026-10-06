import { ErrorState } from "@/components/error-state";

/**
 * Global 404 (Phase 16). Rendered for unmatched routes and for any
 * `notFound()` thrown while rendering. Deliberately a server component so it
 * costs no client JS; it links back to the app root.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <ErrorState variant="not-found" backHref="/" backLabel="Go home" />
    </main>
  );
}
