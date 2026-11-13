import type { ReactNode } from "react";
import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import { SidebarProvider } from "./sidebar/SidebarProvider";

/**
 * Kerangka halaman dashboard: sidebar + header + konten.
 * Konten bergeser mengikuti lebar sidebar lewat padding `--app-sidebar-width`.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar />
      <div className="flex min-h-screen w-full flex-col bg-background transition-[padding] duration-300 ease-in-out xl:ps-(--app-sidebar-width)">
        <Header />
        <main className="container mx-auto flex-1 px-6 py-30">{children}</main>
      </div>
    </SidebarProvider>
  );
}