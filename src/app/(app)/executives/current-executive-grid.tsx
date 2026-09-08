import { User, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { CurrentExecutive } from "@/server/services/executive-service";

interface CurrentExecutiveGridProps {
  executives: CurrentExecutive[];
}

const appointmentTypeLabels: Record<string, string> = {
  ELECTED: "Elected",
  APPOINTED: "Appointed",
  ACTING: "Acting",
  INTERIM: "Interim",
};

export function CurrentExecutiveGrid({ executives }: CurrentExecutiveGridProps) {
  if (executives.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <User className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No executives appointed yet. Go to{" "}
            <a href="/executives/positions" className="text-primary underline-offset-4 hover:underline">
              Positions
            </a>{" "}
            to manage executive appointments.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by position
  const grouped = executives.reduce<Record<string, CurrentExecutive[]>>((acc, exec) => {
    if (!acc[exec.positionId]) acc[exec.positionId] = [];
    acc[exec.positionId].push(exec);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(grouped).map(([positionId, holders]) => {
        const position = holders[0];
        return (
          <Card key={positionId} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-3">
              <CardTitle className="text-base font-semibold">
                {position.positionTitle}
              </CardTitle>
              {position.positionDescription && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {position.positionDescription}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {holders.map((exec) => (
                <div key={exec.appointmentId} className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <User className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{exec.memberName}</p>
                    <p className="text-xs text-muted-foreground">
                      {exec.membershipNumber}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {format(exec.startDate, "MMM d, yyyy")}
                      </span>
                      {exec.endDate && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {format(exec.endDate, "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        )}
                      >
                        {appointmentTypeLabels[exec.appointmentType] ?? exec.appointmentType}
                      </span>
                      {exec.isExpiringSoon && exec.daysRemaining !== null && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                          {exec.daysRemaining}d left
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {holders.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Vacant</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
