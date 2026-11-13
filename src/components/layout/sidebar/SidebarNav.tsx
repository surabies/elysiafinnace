"use client";

import { usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SIDEBAR_MENU } from "../navigation/sidebar-menu";
import type { NavEntry } from "../navigation/types";
import { isNavGroup, isPathActive } from "../navigation/utils";
import { SidebarFlyout } from "./SidebarFlyout";
import { SidebarGroup } from "./SidebarGroup";
import { SidebarLink } from "./SidebarLink";

interface SidebarNavProps {
  collapsed: boolean;
}

interface EntryProps {
  entry: NavEntry;
  pathname: string;
  collapsed: boolean;
}

function SidebarEntry({ entry, pathname, collapsed }: EntryProps) {
  if (isNavGroup(entry)) {
    return collapsed ? (
      <SidebarFlyout group={entry} pathname={pathname} />
    ) : (
      <SidebarGroup group={entry} pathname={pathname} />
    );
  }
  return (
    <SidebarLink
      item={entry}
      active={isPathActive(pathname, entry.href)}
      collapsed={collapsed}
    />
  );
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <nav aria-label="Menu utama" className={cn("pb-6", collapsed ? "px-3" : "px-4")}>
        {SIDEBAR_MENU.map((section) => (
          <div key={section.id} role="group" aria-label={section.heading}>
            {section.heading &&
              (collapsed ? (
                <hr className="mx-auto my-3 w-6 border-border" />
              ) : (
                <p className="px-3 pb-1.5 pt-5 text-xs font-semibold text-muted-foreground">
                  {section.heading}
                </p>
              ))}
            <ul className="space-y-0.5">
              {section.items.map((entry) => (
                <li key={entry.id}>
                  <SidebarEntry entry={entry} pathname={pathname} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}
