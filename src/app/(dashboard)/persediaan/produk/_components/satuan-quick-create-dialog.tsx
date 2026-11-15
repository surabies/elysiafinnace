"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconScale, IconLoader2, IconPlus } from "@tabler/icons-react";
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
import type { SatuanOption } from "../_lib/types";

interface SatuanQuickCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newUnit: SatuanOption) => void;
}

export function SatuanQuickCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: SatuanQuickCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        <SatuanQuickCreateForm
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

function SatuanQuickCreateForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (newUnit: SatuanOption) => void;
}) {
  const [kode, setKode] = React.useState("");
  const [nama, setNama] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim()) {
      toast.error("Kode satuan wajib diisi (misal: PCS, BOX).");
      return;
    }
    if (!nama.trim()) {
      toast.error("Nama lengkap satuan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const api = getApi();

    try {
      const res = await api.keuangan.satuan.post({
        kode: kode.trim().toUpperCase(),
        nama: nama.trim(),
      });

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message ?? "Gagal membuat satuan.");
        return;
      }

      const created = res.data?.data as { id: string; kode: string; nama: string };
      toast.success(`Satuan "${created.kode} - ${created.nama}" berhasil dibuat.`);
      onClose();
      onSuccess({
        id: created.id,
        kode: created.kode,
        nama: created.nama,
      });
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan satuan baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header Enterprise Bersih */}
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-4 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-foreground">
            <IconScale className="size-5 text-foreground/80" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Tambah Satuan Pengukuran
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulir pembuatan satuan pengukuran baru secara langsung
            </DialogDescription>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="quickKodeSatuan" className="text-xs font-medium text-foreground flex items-center gap-1">
              Kode Satuan <span className="text-destructive">*</span>
            </label>
            <Input
              id="quickKodeSatuan"
              placeholder="Contoh: PCS, UNIT, BOX, LITER"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              className="font-mono text-xs uppercase w-full font-bold"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quickNamaSatuan" className="text-xs font-medium text-foreground flex items-center gap-1">
              Nama Lengkap Satuan <span className="text-destructive">*</span>
            </label>
            <Input
              id="quickNamaSatuan"
              placeholder="Contoh: Pieces (Buah), Kotak Kemasan, Kilogram"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="text-xs w-full"
            />
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
          <Button type="submit" size="sm" disabled={isSubmitting} className="min-w-24 gap-1.5">
            {isSubmitting ? (
              <>
                <IconLoader2 className="size-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <IconPlus className="size-3.5" />
                Simpan & Pilih
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
