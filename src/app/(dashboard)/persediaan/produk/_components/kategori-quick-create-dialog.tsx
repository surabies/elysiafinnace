"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconCategory, IconLoader2, IconSparkles, IconPlus } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApi } from "@/lib/api-client";
import { ambilPratinjauNomor } from "@/lib/penomoran";
import type { KategoriOption } from "../_lib/types";

interface KategoriQuickCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newCategory: KategoriOption) => void;
}

export function KategoriQuickCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: KategoriQuickCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        <KategoriQuickCreateForm
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

function KategoriQuickCreateForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (newCategory: KategoriOption) => void;
}) {
  const [nama, setNama] = React.useState("");
  const [kode, setKode] = React.useState("");
  const [keterangan, setKeterangan] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    ambilPratinjauNomor("CAT").then((nomor) => {
      if (nomor) {
        setKode(nomor);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const api = getApi();

    try {
      const res = await api.keuangan["kategori-produk"].post({
        nama: nama.trim(),
        kode: kode.trim() || undefined,
        keterangan: keterangan.trim() || undefined,
      });

      if (res.error) {
        toast.error((res.error.value as { message?: string })?.message ?? "Gagal membuat kategori.");
        return;
      }

      const created = res.data?.data as { id: string; kode: string; nama: string };
      toast.success(`Kategori "${created.nama}" berhasil dibuat.`);
      onClose();
      onSuccess({
        id: created.id,
        kode: created.kode,
        nama: created.nama,
      });
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan kategori baru.");
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
            <IconCategory className="size-5 text-foreground/80" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              Tambah Kategori Cepat
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulir pembuatan kategori produk secara langsung tanpa meninggalkan layar
            </DialogDescription>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="quickNamaKat" className="text-xs font-medium text-foreground flex items-center gap-1">
              Nama Kategori <span className="text-destructive">*</span>
            </label>
            <Input
              id="quickNamaKat"
              placeholder="Contoh: Alat Tulis Kantor, Suku Cadang, Makanan"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="text-xs w-full"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="quickKodeKat" className="text-xs font-medium text-foreground">
                Kode Kategori (Opsional)
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                <IconSparkles className="size-3" /> Auto
              </span>
            </div>
            <Input
              id="quickKodeKat"
              placeholder="Contoh: CAT/2026/00001"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              className="font-mono text-xs uppercase w-full"
            />
            <p className="text-[10px] text-muted-foreground">
              Terisi otomatis oleh sistem. Anda dapat membiarkannya atau menggantinya secara manual.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quickKetKat" className="text-xs font-medium text-foreground">
              Keterangan (Opsional)
            </label>
            <Textarea
              id="quickKetKat"
              placeholder="Catatan klasifikasi kelompok barang..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="text-xs min-h-[60px] resize-none w-full"
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
