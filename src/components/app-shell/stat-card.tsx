import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  emptyHint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  /** Shown under the value when it's genuinely zero/empty, to make clear this is real data, not a placeholder. */
  emptyHint?: string;
}) {
  const isEmpty = value === 0 || value === "—";
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          {isEmpty && emptyHint ? <p className="mt-1 text-xs text-muted-foreground">{emptyHint}</p> : null}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  );
}
