"use client";

import Link from "next/link";
import Image from "next/image";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { AnimatePresence, motion } from "motion/react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import FullLogo from "../shared/logo/FullLogo";
import { SidebarNav } from "./SidebarNav";
import { useSidebar } from "./SidebarProvider";
import { cn } from "@/lib/utils";

/** Isi sidebar yang sama dipakai untuk desktop dan drawer mobile. */
function SidebarPanel({ collapsed }: { collapsed: boolean }) {
  return (
    <>
      <div
        className={cn(
          "flex h-18 shrink-0 items-center overflow-hidden",
          collapsed ? "justify-center" : "px-6",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex size-10 items-center justify-center"
            >
              <Link
                href="/"
                aria-label="Beranda"
                className="flex size-10 items-center justify-center"
              >
                <Image
                  src="/images/logos/logo.png"
                  alt=""
                  width={32}
                  height={36}
                  className="shrink-0"
                  priority
                />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="full-logo"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <FullLogo />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* 4.5rem = tinggi baris logo (h-18). */}
      <SimpleBar className="h-[calc(100dvh-4.5rem)]">
        <SidebarNav collapsed={collapsed} />
      </SimpleBar>
    </>
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

      {/* Mobile & tablet: drawer, selalu dalam mode expanded */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 xl:hidden">
          <VisuallyHidden>
            <SheetTitle>Menu navigasi</SheetTitle>
          </VisuallyHidden>
          <SidebarPanel collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}
