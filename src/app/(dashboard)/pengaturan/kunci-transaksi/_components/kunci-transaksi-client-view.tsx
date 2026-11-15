"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  IconCalendarEvent,
  IconCalendarStats,
  IconCheck,
  IconFileAlert,
  IconInfoCircle,
  IconLoader2,
  IconLock,
  IconLockOpen,
  IconShieldCheck,
  IconShieldLock,
  IconUserShield,
  IconX,
} from "@tabler/icons-react";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApi } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import {
  kunciTransaksiSchema,
  type KunciTransaksiFormValues,
} from "../_lib/schema";
import type { DataKunciTransaksi, KunciTransaksiStats } from "../_lib/types";

interface KunciTransaksiClientViewProps {
  initialData: DataKunciTransaksi;
  stats: KunciTransaksiStats;
  companyId?: string | null;
}

export function KunciTransaksiClientView({
  initialData,
  stats,
  companyId,
}: KunciTransaksiClientViewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<KunciTransaksiFormValues>({
    resolver: zodResolver(kunciTransaksiSchema),
    defaultValues: {
      kunciSemuaSebelum: initialData.kunciSemuaSebelum ?? "",
      kunciNonAdminSebelum: initialData.kunciNonAdminSebelum ?? "",
      catatan: initialData.catatan ?? "",
    },
  });

  const kunciSemuaWatch = watch("kunciSemuaSebelum");
  const kunciNonAdminWatch = watch("kunciNonAdminSebelum");

  const onSubmit = async (values: KunciTransaksiFormValues) => {
    setIsSubmitting(true);
    const api = getApi();

    try {
      const res = await api.keuangan.kontrol["kunci-transaksi"].post({
        perusahaanId: companyId ?? undefined,
        kunciSemuaSebelum: values.kunciSemuaSebelum || undefined,
        kunciNonAdminSebelum: values.kunciNonAdminSebelum || undefined,
        catatan: values.catatan?.trim() || undefined,
      });

      if (res.error) {
        const msg =
          (res.error.value as { message?: string })?.message ||
          "Gagal menyimpan konfigurasi kunci transaksi.";
        toast.error(msg);
        return;
      }

      toast.success("Konfigurasi tanggal kunci transaksi berhasil disimpan.");
      router.refresh();
    } catch {
      toast.error("Terjadi galat sistem saat menyimpan kunci transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper pintasan tanggal cepat
  const setQuickDate = (field: "kunciSemuaSebelum" | "kunciNonAdminSebelum", type: "last-month" | "last-year") => {
    const now = new Date();
    if (type === "last-month") {
      // Hari terakhir bulan lalu
      const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const str = lastDayOfPrevMonth.toISOString().split("T")[0]!;
      setValue(field, str, { shouldValidate: true, shouldDirty: true });
    } else if (type === "last-year") {
      // 31 Desember tahun lalu
      const str = `${now.getFullYear() - 1}-12-31`;
      setValue(field, str, { shouldValidate: true, shouldDirty: true });
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {/* KPI Stats Strip Seragam Standar Enterprise */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
              stats.statusKunci === "TERKUNCI"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : stats.statusKunci === "PARSIAL"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {stats.statusKunci === "TERKUNCI" ? (
              <IconLock className="size-5" />
            ) : stats.statusKunci === "PARSIAL" ? (
              <IconShieldLock className="size-5" />
            ) : (
              <IconLockOpen className="size-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Status Pembukuan</span>
            <span className="text-lg font-bold text-foreground truncate block">
              {stats.statusKunci === "TERKUNCI"
                ? "Terkunci Penuh"
                : stats.statusKunci === "PARSIAL"
                  ? "Kunci Terbatas"
                  : "Buku Terbuka"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <IconShieldLock className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Kunci Semua Pengguna</span>
            <span className="text-sm font-bold font-mono text-foreground truncate block">
              {stats.kunciSemua ? formatDate(stats.kunciSemua) : "Tidak Terkunci"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <IconUserShield className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Kunci Non-Admin</span>
            <span className="text-sm font-bold font-mono text-foreground truncate block">
              {stats.kunciNonAdmin ? formatDate(stats.kunciNonAdmin) : "Tidak Terkunci"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 shadow-2xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <IconCalendarStats className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground block font-medium truncate">Proteksi Periode</span>
            <span className="text-sm font-bold text-foreground truncate block">
              Kepatuhan PSAK
            </span>
          </div>
        </div>
      </div>

      {/* Frame Form Kunci Transaksi */}
      <Frame className="w-full" stacked dense>
        <FrameHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <FrameTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
              <IconLock className="size-4.5 text-primary" />
              Batas Tanggal Penguncian Transaksi (Lock Date)
            </FrameTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mencegah entri data mundur (backdating) dan perubahan tidak sah pada periode akuntansi yang telah ditutup atau diaudit.
            </p>
          </div>

          <Badge variant="outline" className="text-xs font-medium">
            Entitas: {stats.perusahaanNama}
          </Badge>
        </FrameHeader>

        <FramePanel className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Opsi 1: Kunci Semua Transaksi (Termasuk Admin) */}
              <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
                <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <IconShieldLock className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Kunci Semua Transaksi (Lock All)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Berlaku mutlak untuk seluruh pengguna termasuk Administrator.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground block">
                    Kunci Transaksi Sebelum atau Pada Tanggal:
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      className="text-xs font-mono h-9"
                      {...register("kunciSemuaSebelum")}
                    />
                    {kunciSemuaWatch && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Hapus kunci semua"
                        onClick={() => setValue("kunciSemuaSebelum", "", { shouldDirty: true })}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <IconX className="size-4" />
                      </Button>
                    )}
                  </div>
                  {errors.kunciSemuaSebelum && (
                    <p className="text-[11px] text-destructive">{errors.kunciSemuaSebelum.message}</p>
                  )}

                  {/* Pintasan Tanggal */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Pintasan:</span>
                    <button
                      type="button"
                      onClick={() => setQuickDate("kunciSemuaSebelum", "last-month")}
                      className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      Akhir Bulan Lalu
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate("kunciSemuaSebelum", "last-year")}
                      className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      Akhir Tahun Buku Lalu
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground/90 leading-relaxed bg-muted/30 p-2.5 rounded-md border border-border/50">
                  <span className="font-semibold text-foreground">Dampak Keamanan:</span> Seluruh pembuatan faktur, pembayaran, dan posting jurnal di bawah tanggal ini akan ditolak secara ketat oleh sistem.
                </p>
              </div>

              {/* Opsi 2: Kunci Pengguna Non-Admin */}
              <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
                <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <IconUserShield className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Kunci Pengguna Non-Admin
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Operator & staf tidak dapat mengedit; Admin tetap berwenang.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground block">
                    Kunci Pengguna Biasa Sebelum Tanggal:
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      className="text-xs font-mono h-9"
                      {...register("kunciNonAdminSebelum")}
                    />
                    {kunciNonAdminWatch && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Hapus kunci non-admin"
                        onClick={() => setValue("kunciNonAdminSebelum", "", { shouldDirty: true })}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <IconX className="size-4" />
                      </Button>
                    )}
                  </div>
                  {errors.kunciNonAdminSebelum && (
                    <p className="text-[11px] text-destructive">{errors.kunciNonAdminSebelum.message}</p>
                  )}

                  {/* Pintasan Tanggal */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Pintasan:</span>
                    <button
                      type="button"
                      onClick={() => setQuickDate("kunciNonAdminSebelum", "last-month")}
                      className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      Akhir Bulan Lalu
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground/90 leading-relaxed bg-muted/30 p-2.5 rounded-md border border-border/50">
                  <span className="font-semibold text-foreground">Tujuan Operasional:</span> Memberikan fleksibilitas bagi manajer/admin keuangan untuk melakukan audit rekonsiliasi bulanan sementara kasir/staf penjualan tidak dapat mengubah data lama.
                </p>
              </div>
            </div>

            {/* Catatan Alasan Penguncian */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <IconInfoCircle className="size-3.5 text-muted-foreground" />
                Catatan Alasan Penguncian Transaksi (Audit Trail)
              </label>
              <Textarea
                placeholder="mis. Periode audit KAP eksternal tahun buku 2025 telah selesai dan SPT Tahunan 1771 resmi dilaporkan."
                rows={2}
                maxLength={500}
                className="text-xs resize-none"
                {...register("catatan")}
              />
              {errors.catatan && (
                <p className="text-[11px] text-destructive">{errors.catatan.message}</p>
              )}
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/70">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8.5 text-xs gap-1.5 cursor-pointer shadow-xs"
              >
                {isSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}
                <IconShieldCheck className="size-3.5" />
                Simpan Konfigurasi Kunci
              </Button>
            </div>
          </form>
        </FramePanel>
      </Frame>

      {/* Kartu Panduan Standar Akuntansi & Dampak Sistem */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
            <IconCalendarEvent className="size-4 text-primary" />
            Prinsip Tutup Buku Akuntansi
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Sesuai standar PSAK, transaksi yang telah ditutup dan diaudit tidak boleh diubah langsung. Setiap koreksi wajib dilakukan melalui jurnal penyesuaian atau jurnal balik pada periode berjalan.
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
            <IconFileAlert className="size-4 text-amber-500" />
            Cakupan Modul Terdampak
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Penguncian tanggal mencakup Faktur Penjualan (AR), Pembelian (AP), Kas & Bank, Jurnal Memorial Umum, Biaya Operasional, dan Penyusutan Aset Tetap.
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
            <IconCheck className="size-4 text-emerald-500" />
            Integritas Laporan Keuangan
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Memastikan angka Neraca, Laba Rugi, dan Arus Kas historis yang telah diserahkan kepada pemegang saham atau otoritas pajak tetap valid dan tidak mengalami pergeseran saldo.
          </p>
        </div>
      </div>
    </div>
  );
}
