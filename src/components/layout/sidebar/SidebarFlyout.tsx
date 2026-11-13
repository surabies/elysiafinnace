"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@iconify/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { NavGroup } from "../navigation/types";
import { hasActiveChild, isPathActive } from "../navigation/utils";
import { RailTooltip } from "./RailTooltip";
import { navItemClass } from "../types/styles";

interface SidebarFlyoutProps {
  group: NavGroup;
  pathname: string;
}

/** Grup menu saat sidebar collapsed: klik ikon → submenu muncul di sisi kanan. */
export function SidebarFlyout({ group, pathname }: SidebarFlyoutProps) {
  const [open, setOpen] = useState(false);
  const containsActive = hasActiveChild(group, pathname);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <RailTooltip label={group.label} suppressed={open}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={group.label}
            className={navItemClass(containsActive ? "active" : "idle", true)}
          >
            <Icon icon={group.icon} width={21} height={21} />
          </button>
        </DropdownMenuTrigger>
      </RailTooltip>

      <DropdownMenuContent side="right" align="start" sideOffset={14} className="min-w-52">
        <DropdownMenuLabel className="text-sm font-semibold">{group.label}</DropdownMenuLabel>
        {group.children.map((child) => {
          const active = isPathActive(pathname, child.href);
          return (
            <DropdownMenuItem
              key={child.id}
              asChild
              className={cn("cursor-pointer", active && "bg-lightprimary text-primary")}
            >
              <Link href={child.href} aria-current={active ? "page" : undefined}>
                {child.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
