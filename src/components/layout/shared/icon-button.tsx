"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ComponentProps<"button"> {
  icon?: ReactNode;
  children?: ReactNode;
  /** Dipakai sebagai aria-label dan tooltip bawaan browser. */
  label: string;
  /** Tampilan aktif dengan latar aksen, mis. untuk sidebar trigger. */
  active?: boolean;
}

/** Tombol ikon bulat 40px yang dipakai bersama oleh header. */
export function IconButton({
  icon,
  children,
  label,
  active = false,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    >
      {icon ?? children}
    </button>
  );
}
