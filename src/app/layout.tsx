import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./css/globals.css";

export const metadata: Metadata = {
  title: { default: "Elysia Finance", template: "%s | Elysia Finance" },
  description:
    "Sistem ERP Keuangan & Laporan Akuntansi Double-Entry. Next.js, Elysia.js, PostgreSQL, Drizzle ORM, dan Better Auth.",
};
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
/**
 * Root layout: hanya <html>/<body> + style global.
 * Header/footer situs ada di (site)/layout.tsx,
 * sidebar/header dashboard ada di (dashboard)/dashboard/layout.tsx.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <head />
      <body
        className={`min-h-dvh antialiased ${geistSans.variable} ${geistMono.variable}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
