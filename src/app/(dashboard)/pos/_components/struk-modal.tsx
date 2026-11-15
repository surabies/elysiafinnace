"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconPrinter } from "@tabler/icons-react";
import type { CompletedOrderPos } from "./pos-client-view";

interface StrukModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: CompletedOrderPos | null;
}

export function StrukModal({ open, onOpenChange, order }: StrukModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs p-6 bg-white dark:bg-zinc-950 font-mono text-xs">
        <DialogHeader className="border-b pb-3 text-center sm:text-center">
          <DialogTitle className="text-base font-bold text-center tracking-tight">
            SURABIEDEV POS
          </DialogTitle>
          <p className="text-[11px] text-muted-foreground">Elysia Finance Enterprise</p>
          <p className="text-[10px] text-muted-foreground">{order.nomorStruk}</p>
        </DialogHeader>

        <div className="py-2 space-y-1 text-[11px] border-b">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kasir:</span>
            <span>{order.kasirNama || "Kasir"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pelanggan:</span>
            <span>{order.namaPelanggan || "Umum"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Waktu:</span>
            <span>{new Date().toLocaleTimeString("id-ID")}</span>
          </div>
        </div>

        {/* Item Rows */}
        <div className="py-3 border-b space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="space-y-0.5">
              <p className="font-semibold">{it.namaItem}</p>
              <div className="flex justify-between text-muted-foreground text-[10px]">
                <span>
                  {Number(it.kuantitas)} x Rp {Number(it.hargaSatuan).toLocaleString("id-ID")}
                </span>
                <span className="font-medium text-foreground">
                  Rp {Number(it.subtotal).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="py-2 border-b space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rp {Number(order.subtotal || 0).toLocaleString("id-ID")}</span>
          </div>
          {Number(order.diskon || 0) > 0 && (
            <div className="flex justify-between text-rose-500">
              <span>Diskon:</span>
              <span>- Rp {Number(order.diskon).toLocaleString("id-ID")}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t">
            <span>TOTAL:</span>
            <span className="text-primary">Rp {Number(order.total || 0).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-muted-foreground pt-1">
            <span>{order.metodeBayar}:</span>
            <span>Rp {Number(order.jumlahBayar || 0).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Kembalian:</span>
            <span>Rp {Number(order.kembalian || 0).toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div className="text-center pt-2 text-[10px] text-muted-foreground">
          <p>Terima kasih atas kunjungan Anda!</p>
          <p>Struk ini merupakan bukti pembayaran sah.</p>
        </div>

        <div className="pt-2 flex justify-end gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <IconPrinter className="size-4" />
            Cetak Struk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
