import { Suspense } from "react";
import { requireSession } from "@/lib/session";

/**
 * Server-side gate: validates the session against the database (the proxy only
 * checks that a cookie exists). The session read sits behind Suspense, as
 * Cache Components requires, so the rest of the shell streams immediately.
 */
async function AuthGate({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-5xl px-4 py-10">
          <div aria-hidden className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        </main>
      }
    >
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
