"use client";

import * as React from "react";
import {
  IconPackage,
  IconBox,
  IconTools,
  IconTag,
} from "@tabler/icons-react";
import type { ProdukStats } from "../_lib/types";

interface ProdukStatsStripProps {
  stats: ProdukStats;
}

export function ProdukStatsStrip({ stats }: ProdukStatsStripProps) {
  const cards = [
    {
      title: "Total Katalog",
      value: stats.totalItem,
      desc: "Semua varian & jasa",
      icon: IconPackage,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Barang Persediaan",
      value: stats.totalPersediaan,
      desc: "Stok fisik terlacak",
      icon: IconBox,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Non-Persediaan",
      value: stats.totalNonPersediaan,
      desc: "Konsumabel & operasional",
      icon: IconTag,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "Jasa & Layanan",
      value: stats.totalJasa,
      desc: "Non-fisik / konsultasi",
      icon: IconTools,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.title}
            className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3 shadow-2xs"
          >
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${card.bg} ${card.color}`}
            >
              <IconComponent className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-muted-foreground block truncate">
                {card.title}
              </span>
              <div className="text-base font-bold tracking-tight text-foreground">
                {card.value.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
