"use client";

import * as React from "react";
import {
  IconFileTypePdf,
  IconPrinter,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { angkaKeTerbilang } from "@/lib/terbilang";
import type { InvoiceDocumentData } from "./types";

interface InvoiceDocumentProps {
  data: InvoiceDocumentData;
  showActions?: boolean;
}

export function InvoiceDocument({ data, showActions = true }: InvoiceDocumentProps) {
  const terbilangText = data.terbilang || angkaKeTerbilang(data.grandTotal);

  const formatUang = (nominal: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: data.mataUang || "IDR",
      maximumFractionDigits: 0,
    }).format(nominal);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Action Toolbar (Tidak dicetak saat window.print) */}
      {showActions && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-2xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">
              Dokumen Faktur Penjualan: <span className="font-mono">{data.nomorInvoice}</span>
            </span>
            <Badge
              variant={
                data.status === "LUNAS"
                  ? "success-light"
                  : data.status === "BATAL"
                  ? "destructive-light"
                  : "warning-light"
              }
              size="sm"
            >
              {data.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <IconPrinter className="size-4" />
              Cetak Faktur
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5"
            >
              <IconFileTypePdf className="size-4" />
              Simpan PDF
            </Button>
          </div>
        </div>
      )}

      {/* Dokumen Faktur Standar A4 */}
      <div className="w-full max-w-[210mm] mx-auto rounded-xl border border-border bg-background p-8 md:p-12 shadow-sm print:p-0 print:border-none print:shadow-none print:max-w-none text-foreground font-sans">
        {/* Header Dokumen: Kop & Judul */}
        <div className="flex flex-row items-start justify-between border-b border-border pb-6 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wider">
                EF
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                {data.perusahaan.nama}
              </span>
            </div>
            {data.perusahaan.alamat && (
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                {data.perusahaan.alamat}
                {data.perusahaan.kota && `, ${data.perusahaan.kota}`}
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground pt-1">
              {data.perusahaan.telepon && <span>Telp: {data.perusahaan.telepon}</span>}
              {data.perusahaan.email && <span>Email: {data.perusahaan.email}</span>}
              {data.perusahaan.npwp && <span>NPWP: {data.perusahaan.npwp}</span>}
            </div>
          </div>

          <div className="text-right space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground uppercase">
              FAKTUR PENJUALAN
            </h1>
            <p className="font-mono text-xs font-semibold text-primary">
              {data.nomorInvoice}
            </p>
            <div className="text-[11px] text-muted-foreground pt-1 space-y-0.5">
              <div>Tanggal: <span className="text-foreground font-medium">{data.tanggal}</span></div>
              <div>Jatuh Tempo: <span className="text-foreground font-medium">{data.jatuhTempo}</span></div>
              {data.terminPembayaran && (
                <div>Syarat: <span className="text-foreground font-medium">{data.terminPembayaran}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Informasi Tagihan Kepada (Bill To) */}
        <div className="grid grid-cols-2 gap-6 py-6 border-b border-border text-xs">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Tagihan Ditujukan Kepada:
            </span>
            <span className="text-sm font-bold text-foreground block">
              {data.pelanggan.nama}
            </span>
            {data.pelanggan.alamat && (
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                {data.pelanggan.alamat}
              </p>
            )}
            <div className="mt-1 text-[11px] text-muted-foreground space-y-0.5">
              {data.pelanggan.telepon && <div>Telp: {data.pelanggan.telepon}</div>}
              {data.pelanggan.email && <div>Email: {data.pelanggan.email}</div>}
              {data.pelanggan.npwp && <div>NPWP: {data.pelanggan.npwp}</div>}
            </div>
          </div>

          <div className="text-right flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Status Pembayaran:
              </span>
              <span className="inline-block text-xs font-bold px-2.5 py-1 rounded border border-border bg-muted/30">
                {data.status === "LUNAS" ? "LUNAS (PAID)" : "BELUM LUNAS (UNPAID)"}
              </span>
            </div>

            {data.rekeningPembayaran && (
              <div className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground block">Rekening Pembayaran:</span>
                <div>{data.rekeningPembayaran.namaBank}: <span className="font-mono text-foreground font-semibold">{data.rekeningPembayaran.nomorRekening}</span></div>
                <div>a/n {data.rekeningPembayaran.atasNama}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabel Rincian Barang / Jasa */}
        <div className="py-6">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-border text-left">
                <th className="py-2.5 px-2 font-semibold text-muted-foreground w-10 text-center">#</th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground">Deskripsi Barang / Jasa</th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground text-center w-20">Qty</th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right w-28">Harga Satuan</th>
                {data.items.some((i) => i.diskonNominal || i.diskonPersen) && (
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right w-24">Diskon</th>
                )}
                <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-muted/10">
                  <td className="py-3 px-2 text-center text-muted-foreground font-mono">{index + 1}</td>
                  <td className="py-3 px-3 font-medium text-foreground">
                    <div>{item.deskripsi}</div>
                    <span className="text-[10px] text-muted-foreground">{item.satuan}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{item.kuantitas}</td>
                  <td className="py-3 px-3 text-right font-mono">{formatUang(item.hargaSatuan)}</td>
                  {data.items.some((i) => i.diskonNominal || i.diskonPersen) && (
                    <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                      {item.diskonNominal ? formatUang(item.diskonNominal) : `${item.diskonPersen || 0}%`}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-foreground">
                    {formatUang(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rangkuman Finansial & Terbilang */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Terbilang:
              </span>
              <p className="text-xs font-semibold italic text-foreground mt-0.5">
                &ldquo;{terbilangText}&rdquo;
              </p>
            </div>

            {data.catatan && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground block text-[11px]">Catatan:</span>
                <p className="mt-0.5 leading-relaxed">{data.catatan}</p>
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-mono font-semibold text-foreground">{formatUang(data.subtotal)}</span>
            </div>

            {Boolean(data.diskonGlobal) && (
              <div className="flex justify-between py-1 border-b border-border/50 text-emerald-600 dark:text-emerald-400">
                <span>Diskon Tambahan:</span>
                <span className="font-mono font-semibold">- {formatUang(data.diskonGlobal || 0)}</span>
              </div>
            )}

            {Boolean(data.ppnNominal) && (
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">PPN (Pajak Pertambahan Nilai):</span>
                <span className="font-mono font-semibold text-foreground">{formatUang(data.ppnNominal || 0)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b-2 border-border text-sm font-bold">
              <span className="text-foreground">Total Tagihan:</span>
              <span className="font-mono text-primary text-base">{formatUang(data.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Kolom Tanda Tangan & Otorisasi */}
        <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
          <div className="space-y-16">
            <span className="text-muted-foreground font-medium block">
              Diterima Oleh (Pelanggan),
            </span>
            <div className="border-b border-border w-48 mx-auto" />
          </div>

          <div className="space-y-16">
            <span className="text-muted-foreground font-medium block">
              Hormat Kami, {data.perusahaan.nama}
            </span>
            <div className="border-b border-border w-48 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
