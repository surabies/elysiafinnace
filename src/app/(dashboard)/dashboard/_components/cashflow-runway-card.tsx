import Link from "next/link";
import {
  IconReceipt2,
  IconClockExclamation,
  IconScale,
  IconArrowUpRight,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { formatRupiah } from "@/lib/format";
import type { AgingBucketSummary } from "../_lib/types";

interface CashflowRunwayCardProps {
  piutang: AgingBucketSummary | null;
  hutang: AgingBucketSummary | null;
}

function toBigIntSafe(val?: string | null): bigint {
  if (!val) return BigInt(0);
  try {
    const clean = val.split(".")[0];
    return BigInt(clean ?? "0");
  } catch {
    return BigInt(0);
  }
}

export function CashflowRunwayCard({ piutang, hutang }: CashflowRunwayCardProps) {
  const totalPiutang = toBigIntSafe(piutang?.total);
  const currentPiutang = toBigIntSafe(piutang?.current);
  const overduePiutang =
    totalPiutang > currentPiutang ? totalPiutang - currentPiutang : BigInt(0);

  const totalHutang = toBigIntSafe(hutang?.total);
  const currentHutang = toBigIntSafe(hutang?.current);
  const overdueHutang =
    totalHutang > currentHutang ? totalHutang - currentHutang : BigInt(0);

  // Modal kerja bersih operasional (Net Working Capital)
  const netPosition = totalPiutang - totalHutang;
  const isNetPositive = netPosition >= BigInt(0);

  // Persentase tagihan lancar
  const pctLancarPiutang =
    totalPiutang > BigInt(0)
      ? Math.min(100, Math.max(0, Number((currentPiutang * BigInt(100)) / totalPiutang)))
      : 100;

  const pctLancarHutang =
    totalHutang > BigInt(0)
      ? Math.min(100, Math.max(0, Number((currentHutang * BigInt(100)) / totalHutang)))
      : 100;

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex flex-1 flex-col">
        {/* Header Widget */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
              <IconScale className="size-3.5" />
              <span>Modal Kerja & Runway</span>
            </div>
            <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Tagihan & Kewajiban Jatuh Tempo
            </h3>
            <p className="text-xs text-muted-foreground">
              Monitoring umur piutang pelanggan vs jadwal jatuh tempo kewajiban
            </p>
          </div>

          <Link
            href="/laporan"
            className="group inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <span>Analisis</span>
            <IconArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Net Working Capital Delta Banner */}
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Posisi Tagihan Bersih (AR - AP)
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                isNetPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isNetPositive ? (
                <>
                  <IconCheck className="size-3" />
                  Surplus Tagihan
                </>
              ) : (
                <>
                  <IconAlertTriangle className="size-3" />
                  Kewajiban Melebihi
                </>
              )}
            </span>
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <p
              className={`text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${
                isNetPositive ? "text-foreground" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {isNetPositive ? `+${formatRupiah(netPosition)}` : formatRupiah(netPosition)}
            </p>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {isNetPositive
              ? "Klaim piutang usaha mencukupi untuk melunasi seluruh kewajiban pemasok saat ini."
              : "Perhatian: Kewajiban jangka pendek lebih besar dibanding saldo piutang berjalan."}
          </p>
        </div>

        {/* Perbandingan AR vs AP */}
        <div className="mt-4 grid flex-1 gap-3 sm:grid-cols-2">
          {/* Piutang Pelanggan (AR) */}
          <div className="flex flex-col justify-between rounded-xl border border-border/50 bg-background/60 p-3.5 space-y-2.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <IconReceipt2 className="size-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Piutang Usaha
                  </span>
                </div>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {pctLancarPiutang}% Lancar
                </span>
              </div>

              <div>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {formatRupiah(totalPiutang)}
                </p>
                <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="bg-teal-500 transition-all duration-500"
                    style={{ width: `${pctLancarPiutang}%` }}
                  />
                  <div
                    className="bg-amber-500 transition-all duration-500"
                    style={{ width: `${100 - pctLancarPiutang}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-teal-500" />
                Lancar: {formatRupiah(currentPiutang)}
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <span className="size-2 rounded-full bg-amber-500" />
                Jt Tempo: {formatRupiah(overduePiutang)}
              </span>
            </div>
          </div>

          {/* Hutang Pemasok (AP) */}
          <div className="flex flex-col justify-between rounded-xl border border-border/50 bg-background/60 p-3.5 space-y-2.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <IconClockExclamation className="size-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hutang Usaha
                  </span>
                </div>
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  {pctLancarHutang}% Lancar
                </span>
              </div>

              <div>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {formatRupiah(totalHutang)}
                </p>
                <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="bg-indigo-500 transition-all duration-500"
                    style={{ width: `${pctLancarHutang}%` }}
                  />
                  <div
                    className="bg-rose-500 transition-all duration-500"
                    style={{ width: `${100 - pctLancarHutang}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-indigo-500" />
                Lancar: {formatRupiah(currentHutang)}
              </span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                <span className="size-2 rounded-full bg-rose-500" />
                Jt Tempo: {formatRupiah(overdueHutang)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Link */}
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <Link
          href="/penjualan/faktur"
          className="font-medium hover:text-foreground transition-colors"
        >
          Tagihan Pelanggan →
        </Link>
        <Link
          href="/pembelian/faktur"
          className="font-medium hover:text-foreground transition-colors"
        >
          Kewajiban Pemasok →
        </Link>
      </div>
    </div>
  );
}
