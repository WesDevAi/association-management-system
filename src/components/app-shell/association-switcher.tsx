"use client";

import { useState, useTransition } from "react";
import { ChevronsUpDown, Check, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setActiveAssociation } from "@/server/db/tenant-actions";

export type AssociationOption = {
  associationId: string;
  associationName: string;
  roleName: string;
};

export function AssociationSwitcher({
  associations,
  activeAssociationId,
}: {
  associations: AssociationOption[];
  activeAssociationId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // With only one association (the common case right after onboarding),
  // there's nothing to switch between — render a plain label instead of an
  // interactive control that would do nothing.
  if (associations.length <= 1) {
    const only = associations[0];
    return (
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground">
        <Building2 className="size-4" />
        <span className="truncate">{only?.associationName ?? "No association"}</span>
      </div>
    );
  }

  function handleSelect(associationId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setActiveAssociation(associationId);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  const active = associations.find((a) => a.associationId === activeAssociationId);

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-input px-2 py-1.5 text-sm hover:bg-accent [&::-webkit-details-marker]:hidden">
        <Building2 className="size-4" />
        <span className="max-w-[10rem] truncate">{active?.associationName ?? "Select association"}</span>
        <ChevronsUpDown className="size-3.5 text-muted-foreground" />
      </summary>
      <div className="absolute left-0 z-20 mt-2 w-64 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
        {associations.map((assoc) => (
          <button
            key={assoc.associationId}
            type="button"
            disabled={isPending}
            onClick={() => handleSelect(assoc.associationId)}
            className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <span className="flex flex-col truncate">
              <span className="truncate">{assoc.associationName}</span>
              <span className="text-xs text-muted-foreground">{assoc.roleName}</span>
            </span>
            {assoc.associationId === activeAssociationId ? (
              <Check className={cn("size-4 shrink-0")} />
            ) : null}
          </button>
        ))}
        {error ? <p className="px-2 py-1 text-xs text-destructive">{error}</p> : null}
      </div>
    </details>
  );
}
