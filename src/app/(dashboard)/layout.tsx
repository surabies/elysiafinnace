import { cookies } from "next/headers";
import { Suspense, type ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import { SIDEBAR_COOKIE_NAME } from "@/components/layout/types/constants";
import "@/app/css/globals.css";

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-dvh bg-background" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}

async function DashboardShell({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const initialCollapsed =
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "1";

  return (
    <AppShell initialCollapsed={initialCollapsed}>{children}</AppShell>
  );
}