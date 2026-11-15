import { cookies } from "next/headers";
import { Suspense, type ReactNode } from "react";
import AppShell from "@/components/layout/app-shell";
import {
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_OPEN_GROUPS_COOKIE,
} from "@/components/layout/types/constants";
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

  const rawOpenGroups = cookieStore.get(SIDEBAR_OPEN_GROUPS_COOKIE)?.value;
  let initialOpenGroups: string[] = [];
  try {
    if (rawOpenGroups) {
      const parsed = JSON.parse(decodeURIComponent(rawOpenGroups));
      if (Array.isArray(parsed)) {
        initialOpenGroups = parsed.filter((x): x is string => typeof x === "string");
      }
    }
  } catch {}

  return (
    <AppShell
      initialCollapsed={initialCollapsed}
      initialOpenGroups={initialOpenGroups}
    >
      {children}
    </AppShell>
  );
}