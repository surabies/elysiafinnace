import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Panel } from "@/app/(dashboard)/dashboard/_components/panel";
import { quickLinks } from "../_data/menu-items";

export function QuickAccess() {
  return (
    <Panel
      title="Akses cepat"
      description="Pintasan ke modul pembukuan dan laporan"
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              title={link.desc}
              prefetch={false}
              className="group flex h-10 items-center justify-between gap-3 rounded-lg border px-3 text-sm font-medium transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="truncate">{link.title}</span>
              <ArrowUpRight
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
