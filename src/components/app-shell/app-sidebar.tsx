"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavSection } from "./nav-config";
import { NavIcon } from "./nav-icon";

export function AppSidebar({
  sections,
  associationName,
  className,
}: {
  sections: NavSection[];
  associationName: string;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex h-full w-64 flex-col border-r border-border bg-card", className)}>
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="truncate font-semibold">{associationName}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;

                if (!item.implemented) {
                  return (
                    <li key={item.href}>
                      <span className="flex cursor-not-allowed items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground/50">
                        <NavIcon name={item.icon} className="size-4" />
                        {item.label}
                        <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      <NavIcon name={item.icon} className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
