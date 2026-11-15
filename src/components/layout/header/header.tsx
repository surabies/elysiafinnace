"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { IconButton } from "../shared/icon-button";
import { useSidebar } from "../sidebar/sidebar-provider";
import { HEADER_LINKS } from "../navigation/header-links";
import { isPathActive } from "../navigation/utils";
import Notifications from "./notifications";
import Profile from "./profile";
import { ThemeToggle } from "../theme-toggle";
import { useScrolled } from "../types/use-scrolled";
import MegaMenu from "./mega-menu";
import { SubHeader } from "./sub-header";

const Header = () => {
  const scrolled = useScrolled(20);
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 transition-all border-b border-border/70 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85",
        scrolled ? "shadow-xs" : "",
      )}
    >
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 border-b border-border/40">
        {/* Kiri: trigger sidebar & menu navigasi enterprise */}
        <div className="flex items-center gap-2 min-w-0">
          <IconButton
            icon={<IconMenu2 size={20} />}
            label="Ciutkan atau lebarkan sidebar (Ctrl+B)"
            aria-controls="app-sidebar"
            aria-expanded={!collapsed}
            onClick={toggle}
            className="-ms-1 sm:-ms-2 size-9 sm:size-10 rounded-lg shrink-0"
          />

          {/* Navigasi Desktop Executive: Ghost/Palette Menu Buttons (Aplikasi, Laporan, Kalender, Bantuan) */}
          <div className="hidden xl:block">
            <nav
              aria-label="Navigasi header"
              className="flex items-center gap-1"
            >
              <MegaMenu />
              {HEADER_LINKS.map((link) => {
                const active = isPathActive(
                  pathname,
                  link.matchPrefix ?? link.href,
                );
                const IconComp = link.icon;
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    {IconComp && (
                      <IconComp
                        size={14}
                        stroke={1.75}
                        className={
                          active
                            ? "text-primary"
                            : "text-muted-foreground/80 transition-colors"
                        }
                      />
                    )}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Kanan: tema, notifikasi, profil */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          <ThemeToggle />
          <Notifications />
          <Profile />
        </div>
      </div>

      {/* Subheader: Tombol Kembali, Breadcrumb Navigasi & Status Workspace */}
      <SubHeader />
    </header>
  );
};

export default Header;
