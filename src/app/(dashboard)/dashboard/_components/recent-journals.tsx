"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconClock,
  IconFileText,
  IconReceipt2,
} from "@tabler/icons-react";
import { formatDate, formatRupiah } from "@/lib/format";
import type { DashboardJournalActivity } from "../_lib/types";
import { ROUTES } from "@/components/layout/sidebar/routes";

export function RecentJournals({
  activity,
}: {
  activity: DashboardJournalActivity;
}) {
  return (
    <article className="w-full rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all">
      {/* Header Eksekutif */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconReceipt2 size={20} stroke={1.8} />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground tracking-tight">
              Aktivitas Jurnal & Transaksi Terposting
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Audit trail buku besar umum dan mutasi double-entry terkini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activity.draftCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <IconClock size={13} stroke={2} />
              <span>{activity.draftCount} Draft Menunggu</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span>Seluruh Jurnal Sinkron</span>
            </span>
          )}

          <Link
            href={ROUTES.accounting.journals}
            className="group inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted/80 cursor-pointer"
          >
            <span>Buku Jurnal</span>
            <IconArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>

      {/* Konten Daftar Jurnal Enterprise */}
      {activity.entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
            <IconFileText size={24} stroke={1.5} />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Belum Ada Aktivitas Jurnal
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Semua transaksi penjualan, pembelian, dan kas otomatis menghasilkan
            jurnal double-entry di sini.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {activity.entries.map((entry) => (
            <li
              key={entry.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 transition-colors hover:bg-muted/30 px-2 rounded-xl"
            >
              {/* Kolom Kiri: Ikon, Nomor Voucher, dan Deskripsi */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/50 text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                  <IconFileText size={16} stroke={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground tracking-tight">
                      {entry.nomor}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <IconCheck size={10} stroke={3} />
                      POSTED
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {entry.deskripsi || "Tanpa deskripsi transaksi"}
                  </p>
                </div>
              </div>

              {/* Kolom Kanan: Tanggal & Nilai Debit = Kredit */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pl-11 sm:pl-0">
                <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                  {formatRupiah(entry.total)}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <IconCalendar size={12} className="opacity-70" />
                  <time dateTime={entry.tanggal}>
                    {formatDate(entry.tanggal)}
                  </time>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
