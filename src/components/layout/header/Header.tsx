"use client";

import { cn } from "@/lib/utils";
import FullLogo from "../shared/logo/FullLogo";
import { SidebarTrigger } from "../sidebar/SidebarTrigger";
import HeaderNav from "./HeaderNav";
import Notifications from "./Notifications";
import Profile from "./Profile";
import Search from "./Search";
import { ThemeToggle } from "../ThemeToggle";
import { useScrolled } from "../types/use-scrolled";

const Header = () => {
  const scrolled = useScrolled(50);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 transition-shadow",
        scrolled ? "bg-background shadow-md" : "bg-transparent",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-4 sm:pe-10">
        {/* Kiri: trigger sidebar, logo (mobile), pencarian, menu */}
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div className="xl:hidden">
            <FullLogo />
          </div>
          <div className="hidden md:block">
            <Search />
          </div>
          <div className="hidden xl:block">
            <HeaderNav />
          </div>
        </div>

        {/* Kanan: tema, notifikasi, profil */}
        <div className="flex items-center">
          <div className="px-15">
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
