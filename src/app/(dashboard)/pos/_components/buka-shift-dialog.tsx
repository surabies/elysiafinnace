"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconCashRegister, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import type { ShiftPosItem } from "./pos-client-view";

interface BukaShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registerId: string;
  registerNama: string;
  onSuccess: (shift: ShiftPosItem) => void;
}

export function BukaShiftDialog({
  open,
  onOpenChange,
  registerId,
  registerNama,
  onSuccess,
}: BukaShiftDialogProps) {
  const [kasAwal, setKasAwal] = React.useState<string>("200000");
  const [catatan, setCatatan] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerId) {
      toast.error("Pilih mesin kasir terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);
      const res = await getApi().keuangan.pos.shift.buka.post({
        registerId,
        kasAwal: Number(kasAwal).toFixed(4),
        catatan: catatan.trim() || undefined,
      });

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message || "Gagal membuka shift kasir");
        return;
      }

      toast.success("Shift kasir berhasil dibuka. Siap melayani transaksi!");
      if (res.data) onSuccess(res.data as ShiftPosItem);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCashRegister className="size-5 text-primary" />
              Buka Shift Kasir ({registerNama})
            </DialogTitle>
            <DialogDescription>
              Masukkan modal kas kecil awal di laci kasir (drawer) untuk uang kembalian.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="kasAwal">Modal Awal Kas Fisik (Rp)</Label>
              <Input
                id="kasAwal"
                type="number"
                value={kasAwal}
                onChange={(e) => setKasAwal(e.target.value)}
                placeholder="200000"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catatanShift">Catatan Buka Shift (Opsional)</Label>
              <Textarea
                id="catatanShift"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Shift Pagi / Reguler..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <IconLoader2 className="size-4 animate-spin" />}
              Buka Shift Sekarang
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
