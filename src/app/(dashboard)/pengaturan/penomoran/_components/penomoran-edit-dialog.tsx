"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconNumbers, IconLoader2, IconSparkles } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApi } from "@/lib/api-client";
import type { ItemPenomoran } from "../_lib/types";

interface PenomoranEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemPenomoran | null;
  onSuccess: () => void;
}

export function PenomoranEditDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: PenomoranEditDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        <PenomoranEditForm
          key={`${item.prefiks}-${item.tahun}`}
          item={item}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

function PenomoranEditForm({
  item,
  onClose,
  onSuccess,
}: {
  item: ItemPenomoran;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [nilaiBaru, setNilaiBaru] = React.useState<number>(item.nilaiTerakhir);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const nomorBerikutnyaBaru = Number.isFinite(nilaiBaru) && nilaiBaru >= 0
    ? `${item.prefiks}/${item.tahun}/${String(Number(nilaiBaru) + 1).padStart(5, "0")}`
    : "-";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nilaiBaru < 0) {
      toast.error("Nilai counter tidak boleh negatif.");
      return;
    }

    setIsSubmitting(true);
    const api = getApi();

    try {
      const res = await api.keuangan.penomoran({ prefiks: item.prefiks }).put({
        nilaiTerakhir: nilaiBaru,
        tahun: item.tahun,
      });

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message ?? "Gagal memperbarui nomor urut.");
        return;
      }

      toast.success(`Nomor urut ${item.nama} berhasil diperbarui.`);
      onClose();
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat memperbarui penomoran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header Enterprise Bersih */}
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-foreground">
            <IconNumbers className="size-5 text-foreground/80" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Sesuaikan Counter: {item.nama}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulir penyesuaian nomor urut counter dokumen
            </DialogDescription>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {item.deskripsi}. Dokumen ini menggunakan pola format bawaan sistem.
            </p>
          </div>

          {/* Informasi Prefiks & Tahun */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-muted/30 p-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">Prefiks Dokumen</span>
              <span className="font-mono text-xs font-semibold text-foreground tracking-wide">
                {item.prefiks}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Tahun Berjalan</span>
              <span className="font-mono text-xs font-semibold text-foreground">
                {item.tahun}
              </span>
            </div>
          </div>

          {/* Input Counter Terakhir */}
          <div className="space-y-1.5">
            <label htmlFor="nilaiTerakhir" className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>Nilai Counter Terakhir</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Angka sebelum nomor berikutnya
              </span>
            </label>
            <Input
              id="nilaiTerakhir"
              type="number"
              min={0}
              max={99999}
              value={nilaiBaru}
              onChange={(e) => setNilaiBaru(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="font-mono text-sm w-full font-bold"
            />
          </div>

          {/* Preview Nomor Dokumen Berikutnya */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <IconSparkles className="size-4 shrink-0" />
              <span>Pratinjau Nomor Berikutnya:</span>
            </div>
            <div className="font-mono text-sm font-semibold tracking-wider text-foreground pl-5.5">
              {nomorBerikutnyaBaru}
            </div>
            <p className="text-[10px] text-muted-foreground pl-5.5">
              Nomor ini yang akan otomatis disematkan pada transaksi berikutnya di tahun {item.tahun}.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-6 py-3.5 sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Batal
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="min-w-24">
            {isSubmitting ? (
              <>
                <IconLoader2 className="mr-1.5 size-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
