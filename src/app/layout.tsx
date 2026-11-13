import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/public-sans";
import "@fontsource-variable/jetbrains-mono";
import { ThemeProvider } from "next-themes";
import "./css/globals.css";

export const metadata: Metadata = {
  title: { default: "Elysia Finance", template: "%s | Elysia Finance" },
  description:
    "Sistem ERP Keuangan & Laporan Akuntansi Double-Entry. Next.js, Elysia.js, PostgreSQL, Drizzle ORM, dan Better Auth.",
};

/**
 * Root layout: hanya <html>/<body> + style global.
 * Header/footer situs ada di (site)/layout.tsx,
 * sidebar/header dashboard ada di (dashboard)/dashboard/layout.tsx.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <body className="min-h-dvh antialiased">{children}</body>
      </ThemeProvider>
    </html>
  );
}
