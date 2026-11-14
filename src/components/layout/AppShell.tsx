import { Suspense } from "react";
import type { ReactNode } from "react";
import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import { SidebarProvider } from "./sidebar/SidebarProvider";

const mainContentClass =
  "w-full min-w-0 px-4 pt-2 pb-8 sm:px-6 sm:pt-3 sm:pb-10 lg:px-8";

/**
 * Kerangka halaman dashboard: sidebar + header + konten.
 * Konten bergeser mengikuti lebar sidebar lewat padding `--app-sidebar-width`.
 */
export default function AppShell({
  children,
  initialCollapsed,
}: {
  children: ReactNode;
  initialCollapsed: boolean;
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
      <SidebarProvider initialCollapsed={initialCollapsed}>
        <Sidebar />
        <div className="transition-[margin] duration-300 ease-in-out xl:ms-(--app-sidebar-width)">
          <Header />
          <main className={mainContentClass}>
            {children}
          </main>
        </div>
      </SidebarProvider>
    </Suspense>
  );
}
