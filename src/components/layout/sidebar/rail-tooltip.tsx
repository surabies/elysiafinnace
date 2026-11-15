"use client";

import { useState, type ReactElement } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RailTooltipProps {
  label: string;
  /** Sembunyikan tooltip, mis. saat flyout menu sedang terbuka. */
  suppressed?: boolean;
  children: ReactElement;
}

/** Tooltip di sisi kanan untuk item sidebar yang sedang collapsed. */
export function RailTooltip({ label, suppressed = false, children }: RailTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open && !suppressed} onOpenChange={setOpen}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
