import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/playground", label: "Playground" },
] as const;

const linkClass =
  "rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight"
        >
          Elysia Finance
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
