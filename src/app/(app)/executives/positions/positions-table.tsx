"use client";

import { useTransition } from "react";
import { Power, PowerOff, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { deactivatePositionAction, activatePositionAction } from "@/server/services/executive-actions";
import type { ExecutivePositionListItem } from "@/server/services/executive-service";

interface PositionsTableProps {
  positions: ExecutivePositionListItem[];
  associationId: string;
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const [isPending, startTransition] = useTransition();

  function handleDeactivate(positionId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("positionId", positionId);
      await deactivatePositionAction(formData);
      window.location.reload();
    });
  }

  function handleActivate(positionId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("positionId", positionId);
      await activatePositionAction(formData);
      window.location.reload();
    });
  }

  return (
    <div className="rounded-md border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">#</th>
            <th className="px-4 py-3 text-left font-medium">Position</th>
            <th className="px-4 py-3 text-left font-medium">Occupants</th>
            <th className="px-4 py-3 text-left font-medium">Term</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr key={pos.id} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3 text-muted-foreground">{pos.order}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{pos.title}</div>
                {pos.description && (
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {pos.description}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="text-muted-foreground">
                  {pos.currentOccupants} / {pos.maxOccupants}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {pos.termLengthMonths ? `${pos.termLengthMonths} months` : "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    pos.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                  )}
                >
                  {pos.isActive ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <a
                    href={`/executives/${pos.id}/appoint`}
                    className={cn(
                      "inline-flex items-center justify-center rounded-md p-1.5 transition-colors",
                      pos.isActive && pos.currentOccupants < pos.maxOccupants
                        ? "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        : "cursor-not-allowed text-muted-foreground/40"
                    )}
                    title={pos.isActive && pos.currentOccupants < pos.maxOccupants ? "Appoint member" : "Cannot appoint"}
                  >
                    <UserPlus className="size-4" />
                  </a>
                  {pos.isActive ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeactivate(pos.id)}
                      disabled={isPending}
                      title="Deactivate"
                    >
                      <PowerOff className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleActivate(pos.id)}
                      disabled={isPending}
                      title="Activate"
                    >
                      <Power className="size-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {positions.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No positions defined yet. Create one above to get started.
        </div>
      )}
    </div>
  );
}
