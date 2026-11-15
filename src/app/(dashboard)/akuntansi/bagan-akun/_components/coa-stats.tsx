import {
  IconBuildingBank,
  IconCoins,
  IconCreditCard,
  IconReceipt2,
  IconScale,
} from "@tabler/icons-react";
import type { CoaStats } from "../_lib/types";

export function CoaStatsStrip({ stats }: { stats: CoaStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <div className="rounded-lg border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Aset</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <IconBuildingBank className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
          {stats.totalAset}
        </p>
        <span className="text-[11px] text-muted-foreground">Saldo Normal: Debit</span>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Kewajiban</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <IconCreditCard className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
          {stats.totalKewajiban}
        </p>
        <span className="text-[11px] text-muted-foreground">Saldo Normal: Kredit</span>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Ekuitas</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <IconScale className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
          {stats.totalEkuitas}
        </p>
        <span className="text-[11px] text-muted-foreground">Saldo Normal: Kredit</span>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Pendapatan</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <IconCoins className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
          {stats.totalPendapatan}
        </p>
        <span className="text-[11px] text-muted-foreground">Saldo Normal: Kredit</span>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-2xs col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Beban</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <IconReceipt2 className="size-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
          {stats.totalBeban}
        </p>
        <span className="text-[11px] text-muted-foreground">Saldo Normal: Debit</span>
      </div>
    </div>
  );
}
