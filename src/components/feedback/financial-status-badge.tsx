"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type FinancialStatusType =
  | "draft"
  | "terbuka"
  | "open"
  | "unpaid"
  | "menunggu_persetujuan"
  | "pending_approval"
  | "disetujui"
  | "approved"
  | "terposting"
  | "posted"
  | "sebagian"
  | "partial"
  | "lunas"
  | "paid"
  | "batal"
  | "void"
  | "cancelled"
  | "ditolak"
  | "rejected";

interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
  terbuka: {
    label: "Terbuka",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    dotClass: "bg-amber-500",
  },
  open: {
    label: "Terbuka",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    dotClass: "bg-amber-500",
  },
  unpaid: {
    label: "Belum Bayar",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
    dotClass: "bg-amber-500",
  },
  menunggu_persetujuan: {
    label: "Menunggu Persetujuan",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
    dotClass: "bg-blue-500 animate-pulse",
  },
  pending_approval: {
    label: "Menunggu Persetujuan",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
    dotClass: "bg-blue-500 animate-pulse",
  },
  disetujui: {
    label: "Disetujui",
    badgeClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
    dotClass: "bg-cyan-500",
  },
  approved: {
    label: "Disetujui",
    badgeClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
    dotClass: "bg-cyan-500",
  },
  terposting: {
    label: "Terposting",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    dotClass: "bg-emerald-500",
  },
  posted: {
    label: "Terposting",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    dotClass: "bg-emerald-500",
  },
  sebagian: {
    label: "Dibayar Sebagian",
    badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25",
    dotClass: "bg-indigo-500",
  },
  partial: {
    label: "Dibayar Sebagian",
    badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/25",
    dotClass: "bg-indigo-500",
  },
  lunas: {
    label: "Lunas",
    badgeClass: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/30",
    dotClass: "bg-emerald-600",
  },
  paid: {
    label: "Lunas",
    badgeClass: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/30",
    dotClass: "bg-emerald-600",
  },
  batal: {
    label: "Dibatalkan",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
    dotClass: "bg-rose-500",
  },
  void: {
    label: "Dibatalkan",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
    dotClass: "bg-rose-500",
  },
  cancelled: {
    label: "Dibatalkan",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
    dotClass: "bg-rose-500",
  },
  ditolak: {
    label: "Ditolak",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
    dotClass: "bg-rose-500",
  },
  rejected: {
    label: "Ditolak",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
    dotClass: "bg-rose-500",
  },
};

interface FinancialStatusBadgeProps {
  status: string;
  customLabel?: string;
  showDot?: boolean;
  className?: string;
}

export function FinancialStatusBadge({
  status,
  customLabel,
  showDot = true,
  className,
}: FinancialStatusBadgeProps) {
  const normalizedKey = status.toLowerCase().trim();
  const config = STATUS_CONFIG_MAP[normalizedKey] ?? {
    label: status,
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground",
  };

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none tracking-tight whitespace-nowrap shadow-2xs",
        config.badgeClass,
        className
      )}
    >
      {showDot && (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", config.dotClass)}
          aria-hidden="true"
        />
      )}
      <span>{customLabel ?? config.label}</span>
    </span>
  );
}
