import Link from "next/link";
import {
  IconBuildingBank,
  IconWallet,
  IconArrowUpRight,
  IconShieldCheck,
  IconCoins,
} from "@tabler/icons-react";
import { formatRupiah } from "@/lib/format";
import type { BankAccountSummary } from "../_lib/types";

interface BankAccountsCardProps {
  accounts: BankAccountSummary[];
}

export function BankAccountsCard({ accounts }: BankAccountsCardProps) {
  // Hitung total likuiditas terintegrasi
  const totalLikuiditas = accounts.reduce((acc, curr) => {
    try {
      const val = curr.saldo ? BigInt(curr.saldo) : BigInt(0);
      return acc + val;
    } catch {
      return acc;
    }
  }, BigInt(0));

  const bankCount = accounts.filter((a) => a.jenis === "BANK").length;
  const kasCount = accounts.filter((a) => a.jenis === "KAS").length;

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex flex-1 flex-col">
        {/* Header Widget */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <IconCoins className="size-3.5" />
              <span>Likuiditas & Kas</span>
            </div>
            <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Rekening Kas & Bank
            </h3>
            <p className="text-xs text-muted-foreground">
              Posisi saldo riil buku besar multi-rekening operasional
            </p>
          </div>

          <Link
            href="/kas_bank"
            className="group inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <span>Kelola</span>
            <IconArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Total Highlight */}
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Likuiditas Terkonsolidasi
            </span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <IconShieldCheck className="size-3" />
                Live Sync
              </span>
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
              {formatRupiah(totalLikuiditas)}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{bankCount} Bank Operasional</span>
            <span>•</span>
            <span>{kasCount} Kas Tunai / Petty Cash</span>
          </div>
        </div>

        {/* Daftar Akun Bank & Kas */}
        <div className="mt-4 flex-1 space-y-2.5">
          {accounts.length === 0 ? (
            <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 py-6 text-center">
              <IconBuildingBank className="size-8 text-muted-foreground/60" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Belum ada rekening kas atau bank yang aktif
              </p>
              <Link
                href="/kas_bank"
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                + Tambah Rekening Pertama
              </Link>
            </div>
          ) : (
            accounts.slice(0, 4).map((rek) => {
              const isBank = rek.jenis === "BANK";
              return (
                <div
                  key={rek.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/60 p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        isBank
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isBank ? (
                        <IconBuildingBank className="size-4.5" />
                      ) : (
                        <IconWallet className="size-4.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {rek.nama}
                        </p>
                        <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-semibold uppercase text-muted-foreground">
                          {rek.jenis}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {isBank && rek.namaBank
                          ? `${rek.namaBank} • ${rek.nomorRekening ?? "No Rek -"}`
                          : rek.kodeAkunCoa
                            ? `Akun ${rek.kodeAkunCoa}`
                            : rek.kode}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatRupiah(rek.saldo ?? "0")}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {rek.kodeMataUang}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Sinkronisasi Kas & Bank */}
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <IconShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Tersinkronisasi Buku Jurnal</span>
        </span>
        <Link
          href="/kas_bank"
          className="font-medium hover:text-foreground transition-colors"
        >
          {accounts.length > 4 ? `Lihat semua ${accounts.length} rekening →` : "Kelola Kas & Bank →"}
        </Link>
      </div>
    </div>
  );
}
