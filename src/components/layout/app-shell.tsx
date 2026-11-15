import { Suspense } from "react";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Header from "./header/header";
import Sidebar from "./sidebar/sidebar";
import { SidebarProvider } from "./sidebar/sidebar-provider";
import { MobileNav, MobileNavProvider } from "./mobile-nav";

const mainContentClass =
  "w-full min-w-0 px-3 pt-4 pb-8 sm:px-6 sm:pt-6 sm:pb-10 lg:px-8";

/**
 * Kerangka halaman dashboard: sidebar + header + konten + mobile nav Vercel-style.
 * Konten bergeser mengikuti lebar sidebar lewat padding `--app-sidebar-width`.
 */
export default function AppShell({
  children,
  initialCollapsed,
  initialOpenGroups,
}: {
  children: ReactNode;
  initialCollapsed: boolean;
  initialOpenGroups?: string[];
}) {
  return (
    <Suspense
      fallback={
        <main
          aria-busy="true"
          className={`${mainContentClass} text-copy-14 text-muted-foreground`}
        >
          Memuat aplikasi...
        </main>
      }
    >
      <TooltipProvider delayDuration={0}>
        <SidebarProvider
          initialCollapsed={initialCollapsed}
          initialOpenGroups={initialOpenGroups}
        >
          <MobileNavProvider>
            <Sidebar />
            <div className="transition-[margin] duration-300 ease-in-out xl:ms-(--app-sidebar-width)">
              <Header />
              <main className={cn(mainContentClass, "pb-24 md:pb-8 sm:pb-10")}>
                {children}
              </main>
            </div>
            <MobileNav />
          </MobileNavProvider>
        </SidebarProvider>
      </TooltipProvider>
    </Suspense>
  );
}
