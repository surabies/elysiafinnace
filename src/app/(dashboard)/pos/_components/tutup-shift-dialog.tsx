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
import { IconCheck, IconLoader2, IconLock } from "@tabler/icons-react";
import { toast } from "sonner";
import { getApi } from "@/lib/api-client";
import type { ShiftPosItem } from "./pos-client-view";

interface TutupShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: ShiftPosItem | null;
  onSuccess: () => void;
}

export function TutupShiftDialog({
  open,
  onOpenChange,
  shift,
  onSuccess,
}: TutupShiftDialogProps) {
  const [kasAkhirFisik, setKasAkhirFisik] = React.useState<string>("");
  const [catatan, setCatatan] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  if (!shift) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kasAkhirFisik) {
      toast.error("Hitung dan masukkan uang fisik kas di drawer.");
      return;
    }

    try {
      setLoading(true);
      const res = await getApi().keuangan.pos.shift.tutup.post({
        shiftId: shift.id,
        kasAkhirFisik: Number(kasAkhirFisik).toFixed(4),
        catatan: catatan.trim() || undefined,
      });

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message || "Gagal menutup shift kasir");
        return;
      }

      toast.success("Shift kasir berhasil ditutup dan direkonsiliasi!");
      onSuccess();
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
              <IconLock className="size-5 text-rose-500" />
              Tutup Shift Kasir ({shift.nomor})
            </DialogTitle>
            <DialogDescription>
              Hitung uang tunai di laci kasir secara fisik untuk mencatat selisih rekonsiliasi kas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Kas Awal:</span>
                <span className="font-semibold">Rp {Number(shift.kasAwal || 0).toLocaleString("id-ID")}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Waktu Buka:</span>
                <span>{new Date(shift.waktuBuka).toLocaleTimeString("id-ID")}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kasFisik">Uang Fisik Kasir (Rp)</Label>
              <Input
                id="kasFisik"
                type="number"
                value={kasAkhirFisik}
                onChange={(e) => setKasAkhirFisik(e.target.value)}
                placeholder="Jumlah total uang di laci..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catatanTutup">Catatan Rekonsiliasi (Opsional)</Label>
              <Textarea
                id="catatanTutup"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Keterangan bila ada kelebihan atau selisih..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" variant="destructive" disabled={loading} className="gap-1.5">
              {loading && <IconLoader2 className="size-4 animate-spin" />}
              <IconCheck className="size-4" />
              Tutup Shift & Rekonsiliasi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
