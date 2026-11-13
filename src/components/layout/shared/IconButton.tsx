"use client";

import type { ComponentProps } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ComponentProps<"button"> {
  icon: string;
  /** Dipakai sebagai aria-label dan tooltip bawaan browser. */
  label: string;
  /** Tampilan "menyala" (latar biru muda), mis. untuk sidebar trigger. */
  active?: boolean;
}

/** Tombol ikon bulat 40px yang dipakai bersama oleh header. */
export function IconButton({
  icon,
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
        "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40",
        active
          ? "bg-lightprimary text-primary"
          : "text-foreground hover:bg-lightprimary hover:text-primary dark:text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Icon icon={icon} width={20} height={20} />
    </button>
  );
}
