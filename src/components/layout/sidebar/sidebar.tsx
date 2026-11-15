"use client";

import Link from "next/link";
import Image from "next/image";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { AnimatePresence, motion } from "motion/react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarNav } from "./sidebar-nav";
import { useSidebar } from "./sidebar-provider";
import Search from "../header/search";
import { cn } from "@/lib/utils";

/** Isi sidebar yang sama dipakai untuk desktop dan drawer mobile. */
function SidebarPanel({ collapsed }: { collapsed: boolean }) {
  return (
    <TooltipProvider delayDuration={0}>
      {/* Tier 1: Logo Brand (Tinggi h-14 sejajar dengan Header Top Row, transisi mulus zero-flicker) */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center overflow-hidden transition-[padding] duration-300 ease-in-out",
          collapsed ? "justify-center px-0" : "px-4 sm:px-5",
        )}
      >
        <Link
          href="/"
          aria-label="Surabie.Dev"
          className="flex items-center gap-2 overflow-hidden"
        >
          {/* Icon Logo selalu menetap di DOM, tidak pernah unmount sehingga bebas kedipan */}
          <div className="flex size-9 shrink-0 items-center justify-center">
            <Image
              src="/images/logos/logo.png"
              alt="Surabie.Dev"
              width={24}
              height={27}
              className="shrink-0"
              priority
            />
          </div>

          {/* Wordmark Text mengembang/mengempis dengan Motion secara mulus */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex items-center overflow-hidden shrink-0"
              >
                <Image
                  src="/images/logos/logo-light.png"
                  alt="Surabie.Dev"
                  width={120}
                  height={16}
                  className="block h-auto shrink-0 dark:hidden"
                  priority
                />
                <Image
                  src="/images/logos/logo-dark.png"
                  alt="Surabie.Dev"
                  width={120}
                  height={16}
                  className="hidden h-auto shrink-0 dark:block"
                  priority
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Tier 2: Search Box (Tinggi h-10 sejajar presisi dengan SubHeader Navbar, tanpa garis border pembatas) */}
      <div
        className={cn(
          "flex h-10 shrink-0 items-center",
          collapsed ? "justify-center px-2" : "px-3.5",
        )}
      >
        <Search collapsed={collapsed} />
      </div>

      {/* Tier 3: Menu Navigasi (Tinggi sisa viewport: 100dvh - 6rem [h-14 + h-10]) */}
      <SimpleBar className="h-[calc(100dvh-6rem)]">
        <SidebarNav collapsed={collapsed} />
      </SimpleBar>
    </TooltipProvider>
  );
}

export default function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop (xl+): menetap di kiri, lebar mengikuti --app-sidebar-width */}
      <aside
        id="app-sidebar"
        aria-label="Sidebar"
        data-collapsed={collapsed}
        className="fixed inset-y-0 inset-s-0 z-30 hidden w-(--app-sidebar-width) overflow-hidden border-e border-border bg-sidebar transition-[width] duration-300 ease-in-out xl:block"
      >
        <SidebarPanel collapsed={collapsed} />
      </aside>

      {/* Tablet (md - xl): drawer, sudut luar melengkung halus dan tepi dalam menempel rata ke layar. Di bawah md menggunakan mobile nav Vercel-style */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="hidden md:block xl:hidden w-72 bg-sidebar p-0 rounded-s-none rounded-e-2xl border-s-0 border-e border-border/80 overflow-hidden"
        >
          <VisuallyHidden>
            <SheetTitle>Menu navigasi</SheetTitle>
          </VisuallyHidden>
          <SidebarPanel collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}
