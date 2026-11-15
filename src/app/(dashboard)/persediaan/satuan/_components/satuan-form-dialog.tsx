"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconScale, IconLoader2 } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getApi } from "@/lib/api-client";
import type { SatuanItem } from "../_lib/types";

interface SatuanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: SatuanItem | null;
  onSuccess: () => void;
}

export function SatuanFormDialog({
  open,
  onOpenChange,
  itemToEdit,
  onSuccess,
}: SatuanFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        <SatuanFormContent
          key={itemToEdit ? itemToEdit.id : "new"}
          itemToEdit={itemToEdit}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

function SatuanFormContent({
  itemToEdit,
  onClose,
  onSuccess,
}: {
  itemToEdit?: SatuanItem | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(itemToEdit);
  const [kode, setKode] = React.useState(itemToEdit?.kode ?? "");
  const [nama, setNama] = React.useState(itemToEdit?.nama ?? "");
  const [aktif, setAktif] = React.useState(itemToEdit?.aktif ?? true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim()) {
      toast.error("Kode satuan wajib diisi (contoh: PCS, BOX).");
      return;
    }
    if (!nama.trim()) {
      toast.error("Nama satuan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const api = getApi();

    try {
      if (isEditing && itemToEdit) {
        const res = await api.keuangan.satuan({ id: itemToEdit.id }).patch({
          kode: kode.trim().toUpperCase(),
          nama: nama.trim(),
          aktif,
        });

        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message ?? "Gagal memperbarui satuan.");
          return;
        }

        toast.success(`Satuan "${kode.toUpperCase()}" berhasil diperbarui.`);
      } else {
        const res = await api.keuangan.satuan.post({
          kode: kode.trim().toUpperCase(),
          nama: nama.trim(),
        });

        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message ?? "Gagal menambahkan satuan.");
          return;
        }

        toast.success(`Satuan "${kode.toUpperCase()}" berhasil dibuat.`);
      }

      onClose();
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan satuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-foreground">
            <IconScale className="size-5 text-foreground/80" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              {isEditing ? `Ubah Satuan: ${itemToEdit?.kode}` : "Tambah Satuan Pengukuran"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulir master unit of measurement (UOM)
            </DialogDescription>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="satuanKode" className="text-xs font-medium text-foreground flex items-center gap-1">
              Kode Satuan <span className="text-destructive">*</span>
            </label>
            <Input
              id="satuanKode"
              placeholder="Contoh: PCS, BOX, DUS, KG, METER"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              className="font-mono text-xs uppercase w-full font-bold"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="satuanNama" className="text-xs font-medium text-foreground flex items-center gap-1">
              Nama Lengkap Satuan <span className="text-destructive">*</span>
            </label>
            <Input
              id="satuanNama"
              placeholder="Contoh: Pieces (Buah), Kotak Kemasan, Kilogram"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="text-xs w-full"
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-3">
              <div className="space-y-0.5">
                <label htmlFor="satuanAktif" className="text-xs font-medium text-foreground block cursor-pointer">
                  Status Satuan Aktif
                </label>
                <p className="text-[10px] text-muted-foreground">
                  Satuan nonaktif tidak dapat dipilih saat mendaftarkan produk baru.
                </p>
              </div>
              <Switch
                id="satuanAktif"
                checked={aktif}
                onCheckedChange={setAktif}
              />
            </div>
          )}
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
            ) : isEditing ? (
              "Simpan Perubahan"
            ) : (
              "Tambah Satuan"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
