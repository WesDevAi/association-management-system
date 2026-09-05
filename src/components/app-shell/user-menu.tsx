"use client";

import { LogOut, User } from "lucide-react";
import { logoutAction } from "@/server/auth/actions";

export function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent [&::-webkit-details-marker]:hidden">
        <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <User className="size-4" />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[10rem] truncate font-medium">{name}</span>
        </span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
        <div className="px-2 py-1.5 text-sm">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <div className="my-1 h-px bg-border" />
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
