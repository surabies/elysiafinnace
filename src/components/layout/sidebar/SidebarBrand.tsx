"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import FullLogo from "../shared/logo/FullLogo";

export function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex h-18 shrink-0 items-center overflow-hidden",
        collapsed ? "justify-center" : "px-6",
      )}
    >
      {collapsed ? (
        // Ganti dengan logo mark (versi kecil) milik aplikasi.
        <Link
          href="/"
          aria-label="Beranda"
          className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          <Icon icon="solar:wallet-linear" width={22} height={22} />
        </Link>
      ) : (
        <FullLogo />
      )}
    </div>
  );
}
