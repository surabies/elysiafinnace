import {
  IconBuildingStore,
  IconCreditCard,
  IconReceiptTax,
  IconUserCheck,
} from "@tabler/icons-react";
import type { KontakStats } from "../_lib/types";

interface KontakStatsStripProps {
  stats: KontakStats;
  entityTitle: string; // misal "Pelanggan" atau "Pemasok"
}

export function KontakStatsStrip({ stats, entityTitle }: KontakStatsStripProps) {
  const formattedBatasKredit = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(stats.totalBatasKredit);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Total {entityTitle}</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <IconBuildingStore className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
          {stats.total}
        </p>
        <span className="text-[11px] text-muted-foreground">Entitas Terdaftar</span>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Status Aktif</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconUserCheck className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
          {stats.aktif}
        </p>
        <span className="text-[11px] text-muted-foreground">Siap Bertransaksi</span>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Wajib Pajak PKP</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <IconReceiptTax className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
          {stats.pkpCount}
        </p>
        <span className="text-[11px] text-muted-foreground">Faktur Pajak Standar</span>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Total Plafon Kredit</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <IconCreditCard className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
          {formattedBatasKredit}
        </p>
        <span className="text-[11px] text-muted-foreground">Batas Maksimal</span>
      </div>
    </div>
  );
}
