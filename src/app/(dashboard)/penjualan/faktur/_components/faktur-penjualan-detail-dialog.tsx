"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  IconCheck,
  IconCopy,
  IconFileInvoice,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { getApi } from "@/lib/api-client";
import type { ItemFakturPenjualan } from "./faktur-penjualan-client-view";

interface FakturPenjualanDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faktur: ItemFakturPenjualan | null;
  onStatusChanged: () => void;
}

export function FakturPenjualanDetailDialog({
  open,
  onOpenChange,
  faktur,
  onStatusChanged,
}: FakturPenjualanDetailDialogProps) {
  const [actionLoading, setActionLoading] = React.useState(false);
  const [fetchedId, setFetchedId] = React.useState<string | null>(null);
  const [detailData, setDetailData] = React.useState<{
    baris?: Array<{
      baris: {
        id: string;
        deskripsi?: string | null;
        kuantitas: string;
        hargaSatuan: string;
        diskonNominal: string;
        subtotal: string;
      };
      itemSku?: string | null;
      itemNama?: string | null;
    }>;
  } | null>(null);

  const isDataLoading = Boolean(open && faktur?.id && fetchedId !== faktur.id);
  const isLoading = isDataLoading || actionLoading;

  React.useEffect(() => {
    if (!open || !faktur?.id) return;
    let active = true;
    getApi()
      .keuangan.penjualan.faktur({ id: faktur.id })
      .get()
      .then((res) => {
        if (active) {
          setFetchedId(faktur.id);
          if (res.data) {
            setDetailData(res.data as unknown as typeof detailData);
          }
        }
      })
      .catch(() => {
        if (active) {
          setFetchedId(faktur.id);
        }
      });

    return () => {
      active = false;
    };
  }, [open, faktur?.id]);

  if (!faktur) return null;

  const handlePosting = async () => {
    try {
      setActionLoading(true);
      const res = await getApi().keuangan.penjualan.faktur({ id: faktur.id }).posting.post();
      if (res.error) {
        toast.error("Gagal memposting faktur: " + JSON.stringify(res.error.value));
        return;
      }
      toast.success(`Faktur ${faktur.nomor} berhasil diposting ke Buku Besar!`);
      onOpenChange(false);
      onStatusChanged();
    } catch {
      toast.error("Gagal memposting faktur.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatalkan = async () => {
    const alasan = prompt("Masukkan alasan pembatalan faktur:", "Pembatalan oleh pengguna");
    if (!alasan) return;

    try {
      setActionLoading(true);
      const res = await getApi()
        .keuangan.penjualan.faktur({ id: faktur.id })
        .batal.post({
          deskripsi: alasan,
          tanggal: new Date().toISOString().split("T")[0]!,
        });
      if (res.error) {
        toast.error("Gagal membatalkan faktur: " + JSON.stringify(res.error.value));
        return;
      }
      toast.success(`Faktur ${faktur.nomor} telah dibatalkan.`);
      onOpenChange(false);
      onStatusChanged();
    } catch {
      toast.error("Gagal membatalkan faktur.");
    } finally {
      setActionLoading(false);
    }
  };

  const copyNomor = () => {
    navigator.clipboard.writeText(faktur.nomor);
    toast.success(`Nomor faktur ${faktur.nomor} disalin ke clipboard.`);
  };

  const isLunas = Number(faktur.sisaTagihan || 0) <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <IconFileInvoice className="size-5 text-primary" />
              Rincian Faktur Penjualan
            </DialogTitle>
            <Badge
              variant={
                faktur.status === "POSTED"
                  ? "default"
                  : faktur.status === "DRAFT"
                    ? "secondary"
                    : "destructive"
              }
              className="text-xs"
            >
              {faktur.status}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Informasi lengkap dokumen komersial dan pencatatan buku besar piutang.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg border bg-muted/20">
            <div>
              <span className="text-muted-foreground block text-[11px]">Nomor Faktur</span>
              <div className="flex items-center gap-1 font-mono font-bold mt-0.5">
                <span>{faktur.nomor}</span>
                <button
                  type="button"
                  onClick={copyNomor}
                  className="hover:text-primary transition-colors"
                  title="Salin nomor"
                >
                  <IconCopy className="size-3.5" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Pelanggan</span>
              <span className="font-semibold block mt-0.5">
                {faktur.pelanggan?.nama ?? "-"}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {faktur.pelanggan?.kode ?? ""}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Tanggal Transaksi</span>
              <span className="font-medium block mt-0.5">
                {new Date(faktur.tanggal).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Jatuh Tempo</span>
              <span className="font-medium block mt-0.5">
                {faktur.tanggalJatuhTempo
                  ? new Date(faktur.tanggalJatuhTempo).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "-"}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Total Tagihan</span>
              <span className="font-bold text-sm text-primary block mt-0.5">
                Rp {Number(faktur.total || 0).toLocaleString("id-ID")}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Sisa Piutang</span>
              <div className="mt-0.5">
                {isLunas ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Lunas
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    Rp {Number(faktur.sisaTagihan || 0).toLocaleString("id-ID")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Baris Rincian */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
              <IconLoader2 className="size-4 animate-spin" />
              <span>Memuat rincian transaksi...</span>
            </div>
          ) : detailData?.baris && detailData.baris.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <div className="p-2.5 bg-muted/40 font-semibold border-b">
                Item & Komponen Faktur
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/20 border-b text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Item / Deskripsi</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Harga Satuan</th>
                    <th className="px-3 py-2 text-right">Diskon</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {detailData.baris.map((b) => (
                    <tr key={b.baris.id}>
                      <td className="px-3 py-2">
                        <div className="font-medium">{b.itemNama ?? b.baris.deskripsi ?? "Item"}</div>
                        {b.itemSku && (
                          <div className="text-[10px] text-muted-foreground font-mono">{b.itemSku}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{b.baris.kuantitas}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        Rp {Number(b.baris.hargaSatuan || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {Number(b.baris.diskonNominal || 0) > 0
                          ? `Rp ${Number(b.baris.diskonNominal).toLocaleString("id-ID")}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium">
                        Rp {Number(b.baris.subtotal || 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {faktur.catatan && (
            <div className="p-2.5 rounded-lg border bg-muted/10">
              <span className="text-[10px] text-muted-foreground block font-semibold mb-0.5">Catatan:</span>
              <p className="text-xs text-foreground">{faktur.catatan}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>

          {faktur.status === "DRAFT" && (
            <Button
              type="button"
              size="sm"
              disabled={isLoading}
              onClick={handlePosting}
              className="gap-1.5"
            >
              {isLoading && <IconLoader2 className="size-3.5 animate-spin" />}
              <IconCheck className="size-3.5" />
              Posting Faktur
            </Button>
          )}

          {faktur.status === "POSTED" && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isLoading}
              onClick={handleBatalkan}
              className="gap-1.5"
            >
              {isLoading && <IconLoader2 className="size-3.5 animate-spin" />}
              <IconX className="size-3.5" />
              Batalkan Faktur
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
