"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection } from "./nav-config";
import { Button } from "@/components/ui/button";
import { NavIcon } from "./nav-icon";

export function MobileNav({ sections, associationName }: { sections: NavSection[]; associationName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open navigation">
        <Menu className="size-5" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="relative flex h-full w-72 flex-col bg-card shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="truncate font-semibold">{associationName}</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close navigation">
                <X className="size-5" />
              </Button>
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
                            <span className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground/50">
                              <NavIcon name={item.icon} className="size-4" />
                              {item.label}
                              <span className="ml-auto text-[10px] uppercase">Soon</span>
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                              isActive && "bg-accent font-medium"
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
