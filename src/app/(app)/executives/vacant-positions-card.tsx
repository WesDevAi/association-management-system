import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExecutivePositionListItem } from "@/server/services/executive-service";

interface VacantPositionsCardProps {
  positions: ExecutivePositionListItem[];
}

export function VacantPositionsCard({ positions }: VacantPositionsCardProps) {
  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-300">
          <AlertTriangle className="size-4" />
          Vacant Positions ({positions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {positions.map((pos) => (
            <div
              key={pos.id}
              className="flex items-center justify-between rounded-md border border-amber-100 bg-amber-50/50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30"
            >
              <span className="text-sm font-medium">{pos.title}</span>
              <span className="text-xs text-muted-foreground">
                Order #{pos.order}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
