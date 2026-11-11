import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/public-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { AuthNav } from "@/components/auth-nav";

export const metadata: Metadata = {
  title: { default: "Elysia Finance", template: "%s | Elysia Finance" },
  description:
    "Sistem ERP Keuangan & Laporan Akuntansi Double-Entry. Next.js, Elysia.js, PostgreSQL, Drizzle ORM, dan Better Auth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="flex min-h-dvh flex-col">
        <header className="border-b">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
            <Link href="/" className="font-display text-lg font-semibold tracking-tight">
              Elysia Finance
            </Link>
            <nav aria-label="Main" className="flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/playground"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Playground
              </Link>
              <AuthNav />
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t">
          <div className="mx-auto w-full max-w-5xl px-4 py-5 text-sm text-muted-foreground flex justify-between">
            <span>Sistem Informasi Laporan Keuangan Enterprise</span>
            <span>API Health: <code className="font-mono">GET /api/health</code></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
