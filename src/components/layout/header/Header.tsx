"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import FullLogo from "../shared/logo/FullLogo";
import { IconButton } from "../shared/IconButton";
import { useSidebar } from "../sidebar/SidebarProvider";
import { HEADER_LINKS } from "../navigation/header-links";
import { isPathActive } from "../navigation/utils";
import { headerNavItemClass } from "../types/styles";
import Notifications from "./Notifications";
import Profile from "./Profile";
import Search from "./Search";
import { ThemeToggle } from "../ThemeToggle";
import { useScrolled } from "../types/use-scrolled";
import MegaMenu from "./MegaMenu";

const Header = () => {
  const scrolled = useScrolled(50);
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 transition-shadow",
        scrolled ? "bg-background shadow-sm" : "bg-transparent",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-4 sm:pe-10">
        {/* Kiri: trigger sidebar, logo (mobile), pencarian, menu */}
        <div className="flex items-center gap-2">
          <IconButton
            icon={<IconMenu2 size={20} />}
            label="Ciutkan atau lebarkan sidebar (Ctrl+B)"
            aria-controls="app-sidebar"
            aria-expanded={!collapsed}
            onClick={toggle}
          />
          <div className="xl:hidden">
            <FullLogo compact />
          </div>
          <div className="hidden md:block">
            <Search />
          </div>
          <div className="hidden xl:block">
            <nav aria-label="Navigasi header" className="flex items-center gap-1">
              <MegaMenu />
              {HEADER_LINKS.map((link) => {
                const active = isPathActive(
                  pathname,
                  link.matchPrefix ?? link.href,
                );
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(headerNavItemClass, active && "text-primary")}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Kanan: tema, notifikasi, profil */}
        <div className="flex items-center">
          <div className="px-4">
            <ThemeToggle />
          </div>
          <Notifications />
          <Profile />
        </div>
      </div>
    </header>
  );
};

export default Header;
