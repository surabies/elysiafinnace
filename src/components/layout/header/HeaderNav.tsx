"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HEADER_LINKS } from "../navigation/header-links";
import { isPathActive } from "../navigation/utils";
import MegaMenu from "./MegaMenu";
import { headerNavItemClass } from "../types/styles";

/** Menu teks di header: "Aplikasi" (mega menu) + tautan polos. */
export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      <MegaMenu />
      {HEADER_LINKS.map((link) => {
        const active = isPathActive(pathname, link.matchPrefix ?? link.href);
        return (
          <Link
            key={link.id}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(headerNavItemClass, active && "text-primary")}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
