"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import type { NavLink } from "../navigation/types";
import { RailTooltip } from "./RailTooltip";
import { navItemClass } from "../types/styles";

interface SidebarLinkProps {
  item: NavLink;
  active: boolean;
  collapsed: boolean;
}

/** Menu tingkat atas tanpa anak. */
export function SidebarLink({ item, active, collapsed }: SidebarLinkProps) {
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={navItemClass(active ? "active" : "idle", collapsed)}
    >
      {item.icon && <Icon icon={item.icon} width={21} height={21} className="shrink-0" />}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  return collapsed ? <RailTooltip label={item.label}>{link}</RailTooltip> : link;
}
