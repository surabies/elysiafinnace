import { Suspense } from "react";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "./header/header";
import Sidebar from "./sidebar/sidebar";
import { SidebarProvider } from "./sidebar/sidebar-provider";

const mainContentClass =
  "w-full min-w-0 px-3 pt-4 pb-8 sm:px-6 sm:pt-6 sm:pb-10 lg:px-8";

/**
 * Kerangka halaman dashboard: sidebar + header + konten.
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
          <Sidebar />
          <div className="transition-[margin] duration-300 ease-in-out xl:ms-(--app-sidebar-width)">
            <Header />
            <main className={mainContentClass}>
              {children}
            </main>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </Suspense>
  );
}
