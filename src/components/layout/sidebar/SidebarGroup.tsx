"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { NavGroup } from "../navigation/types";
import { hasActiveChild, isPathActive } from "../navigation/utils";
import { navItemClass, subLinkClass } from "../types/styles";

interface SidebarGroupProps {
  group: NavGroup;
  pathname: string;
}

/** Grup menu yang bisa dibuka-tutup (mode expanded). */
export function SidebarGroup({ group, pathname }: SidebarGroupProps) {
  const containsActive = hasActiveChild(group, pathname);
  const [open, setOpen] = useState(containsActive);
  const panelId = useId();

  // Buka otomatis saat halaman aktif berada di dalam grup ini.
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={navItemClass(containsActive ? "child-active" : "idle", false)}
      >
        <Icon icon={group.icon} width={21} height={21} className="shrink-0" />
        <span className="flex-1 truncate text-start">{group.label}</span>
        <Icon
          icon="solar:alt-arrow-right-linear"
          width={16}
          height={16}
          className={cn(
            "shrink-0 transition-transform duration-300 ease-in-out motion-reduce:transition-none",
            open && "rotate-90",
          )}
        />
      </button>

      {/* Animasi tinggi tanpa library: grid-rows 0fr → 1fr. `invisible` mencegah fokus ke item tersembunyi. */}
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows,visibility] duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "invisible grid-rows-[0fr]",
        )}
      >
        <ul className="ms-[22px] min-h-0 space-y-0.5 overflow-hidden ps-2 pe-1.5">
          {group.children.map((child) => {
            const active = isPathActive(pathname, child.href);
            return (
              <li key={child.id} className="first:mt-1 last:mb-1">
                <Link
                  href={child.href}
                  aria-current={active ? "page" : undefined}
                  className={subLinkClass(active)}
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      active ? "bg-primary" : "bg-muted-foreground/50",
                    )}
                  />
                  <span className="truncate">{child.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}