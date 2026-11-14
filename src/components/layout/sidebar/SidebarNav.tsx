"use client";

import Link from "next/link";
import { createContext, useContext, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { IconChevronRight } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SIDEBAR_MENU } from "../navigation/sidebar-menu";
import type { NavEntry, NavGroup, NavLink } from "../navigation/types";
import { hasActiveChild, isNavGroup, isPathActive } from "../navigation/utils";
import { navItemClass, subLinkClass } from "../types/styles";
import { RailTooltip } from "./RailTooltip";

interface SidebarHoverContextValue {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}

const SidebarHoverContext = createContext<SidebarHoverContextValue>({
  hoveredId: null,
  setHoveredId: () => {},
});

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
      <SidebarGroup
        key={`${entry.id}-${hasActiveChild(entry, pathname)}`}
        group={entry}
        pathname={pathname}
      />
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

function SidebarLink({
  item,
  active,
  collapsed,
}: {
  item: NavLink;
  active: boolean;
  collapsed: boolean;
}) {
  const { hoveredId, setHoveredId } = useContext(SidebarHoverContext);
  const isHovered = hoveredId === item.id;
  const IconComp = item.icon;

  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      onMouseEnter={() => setHoveredId(item.id)}
      className={cn(
        navItemClass(active ? "active" : "idle", collapsed),
        "relative",
      )}
    >
      {/* Indikator bilah aktif di sisi kiri untuk membedakan halaman aktif dari hover */}
      {active && !collapsed && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary"
        />
      )}

      {/* Kapsul hover berseluncur tunggal */}
      {isHovered && !collapsed && (
        <motion.span
          layoutId="sidebar-hover-pill"
          className="absolute inset-0 rounded-lg bg-sidebar-accent/50 pointer-events-none"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 38,
          }}
        />
      )}
      {IconComp && (
        <IconComp size={20} stroke={1.75} className="relative z-10 shrink-0" />
      )}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative z-10 truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  return collapsed ? <RailTooltip label={item.label}>{link}</RailTooltip> : link;
}

function SidebarGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const containsActive = hasActiveChild(group, pathname);
  const [open, setOpen] = useState(containsActive);
  const panelId = useId();
  const IconComp = group.icon;
  const { hoveredId, setHoveredId } = useContext(SidebarHoverContext);
  const isHovered = hoveredId === group.id;

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setHoveredId(group.id)}
        className={cn(
          navItemClass(containsActive ? "child-active" : "idle", false),
          "relative",
        )}
      >
        {/* Kapsul hover berseluncur tunggal */}
        {isHovered && (
          <motion.span
            layoutId="sidebar-hover-pill"
            className="absolute inset-0 rounded-lg bg-sidebar-accent/50 pointer-events-none"
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 38,
            }}
          />
        )}
        <IconComp size={20} stroke={1.75} className="relative z-10 shrink-0" />
        <span className="relative z-10 flex-1 truncate text-start">
          {group.label}
        </span>
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative z-10 shrink-0 text-muted-foreground"
        >
          <IconChevronRight size={16} stroke={1.75} />
        </motion.div>
      </button>

      {/* Accordion sub-menu dengan Motion AnimatePresence yang ultra-smooth */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: {
                  type: "spring",
                  stiffness: 350,
                  damping: 32,
                },
                opacity: { duration: 0.18, delay: 0.04 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: {
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                },
                opacity: { duration: 0.12 },
              },
            }}
            className="relative overflow-hidden"
          >
            <ul className="relative min-h-0 space-y-0.5 py-0.5">
              {group.children.map((child, index) => {
                const active = isPathActive(pathname, child.href);
                const isLast = index === group.children.length - 1;
                const isChildHovered = hoveredId === child.id;
                return (
                  <li key={child.id} className="relative first:mt-0.5 last:mb-0.5">
                    {/* Garis pemandu vertikal atas (berhenti sebelum dot agar tidak menempel) */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-[21.5px] top-0 h-2 w-px bg-border/50"
                    />

                    {/* Garis pemandu vertikal bawah (mulai setelah dot, berhenti di item terakhir) */}
                    {!isLast && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute bottom-[-2px] left-[21.5px] h-2.5 w-px bg-border/50"
                      />
                    )}

                    <Link
                      href={child.href}
                      aria-current={active ? "page" : undefined}
                      onMouseEnter={() => setHoveredId(child.id)}
                      className={subLinkClass(active)}
                    >
                      {/* Kapsul hover berseluncur tunggal */}
                      {isChildHovered && (
                        <motion.span
                          layoutId="sidebar-hover-pill"
                          className="absolute inset-0 rounded-lg bg-sidebar-accent/50 pointer-events-none"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 38,
                          }}
                        />
                      )}
                      {/* Slot indikator 20px (tepat segaris di bawah kolom ikon grup) */}
                      <div className="relative z-10 flex size-5 shrink-0 items-center justify-center">
                        <span
                          className={cn(
                            "rounded-full transition-all duration-200",
                            active
                              ? "h-2 w-3.5 bg-primary shadow-xs"
                              : "size-2 bg-muted-foreground/20 border border-border/80 group-hover/sub:bg-muted-foreground/40 group-hover/sub:scale-110",
                          )}
                        />
                      </div>
                      <span className="relative z-10 truncate">{child.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarFlyout({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const containsActive = hasActiveChild(group, pathname);
  const IconComp = group.icon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <RailTooltip label={group.label} suppressed={open}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={group.label}
            className={navItemClass(containsActive ? "active" : "idle", true)}
          >
            <IconComp size={20} stroke={1.75} className="shrink-0" />
          </button>
        </DropdownMenuTrigger>
      </RailTooltip>

      <DropdownMenuContent side="right" align="start" sideOffset={14} className="min-w-56 p-1.5 rounded-xl shadow-xl">
        <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {group.label}
        </DropdownMenuLabel>
        {group.children.map((child) => {
          const active = isPathActive(pathname, child.href);
          return (
            <DropdownMenuItem
              key={child.id}
              asChild
              className={cn(
                "cursor-pointer flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active && "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
              )}
            >
              <Link href={child.href} aria-current={active ? "page" : undefined}>
                <span
                  className={cn(
                    "rounded-full transition-all duration-200",
                    active
                      ? "h-2 w-3.5 bg-primary shadow-xs"
                      : "size-2 bg-muted-foreground/20 border border-border/80",
                  )}
                />
                <span className="truncate">{child.label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <SidebarHoverContext.Provider
      value={{
        hoveredId,
        setHoveredId,
      }}
    >
      <TooltipProvider delayDuration={0}>
        <nav
          aria-label="Menu utama"
          onMouseLeave={() => setHoveredId(null)}
          className={cn("pb-6", collapsed ? "px-3" : "px-4")}
        >
          {SIDEBAR_MENU.map((section) => (
            <div key={section.id} role="group" aria-label={section.heading}>
              {section.heading && (
                <AnimatePresence mode="wait" initial={false}>
                  {collapsed ? (
                    <motion.hr
                      key="collapsed-divider"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="mx-auto my-3 w-6 border-border"
                    />
                  ) : (
                    <motion.p
                      key="expanded-heading"
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.15 }}
                      className="px-3 pb-1.5 pt-5 text-label-12 font-semibold text-muted-foreground"
                    >
                      {section.heading}
                    </motion.p>
                  )}
                </AnimatePresence>
              )}
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
    </SidebarHoverContext.Provider>
  );
}
