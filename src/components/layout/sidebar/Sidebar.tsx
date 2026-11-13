"use client";

import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarNav } from "./SidebarNav";
import { useSidebar } from "./SidebarProvider";

/** Isi sidebar yang sama dipakai untuk desktop dan drawer mobile. */
function SidebarPanel({ collapsed }: { collapsed: boolean }) {
  return (
    <>
      <SidebarBrand collapsed={collapsed} />
      {/* 4.5rem = tinggi SidebarBrand (h-18) */}
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
        className="fixed inset-y-0 start-0 z-30 hidden w-(--app-sidebar-width) overflow-hidden border-e border-border bg-sidebar transition-[width] duration-300 ease-in-out xl:block"
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
