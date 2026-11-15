"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  IconTag,
  IconLoader2,
  IconPalette,
  IconCheck,
} from "@tabler/icons-react";
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
import { Switch } from "@/components/ui/switch";
import { getApi } from "@/lib/api-client";
import { PRESET_WARNA_TAG, type ItemTag } from "../_lib/types";

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: ItemTag | null;
  onSuccess: () => void;
}

export function TagFormDialog({
  open,
  onOpenChange,
  itemToEdit,
  onSuccess,
}: TagFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        <TagFormContent
          key={itemToEdit ? itemToEdit.id : "new"}
          itemToEdit={itemToEdit}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

function TagFormContent({
  itemToEdit,
  onClose,
  onSuccess,
}: {
  itemToEdit?: ItemTag | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(itemToEdit);
  const [nama, setNama] = React.useState(itemToEdit ? itemToEdit.nama.replace(/^#/, "") : "");
  const [warna, setWarna] = React.useState<string>(itemToEdit?.warna || "#2563eb");
  const [keterangan, setKeterangan] = React.useState(itemToEdit?.keterangan || "");
  const [aktif, setAktif] = React.useState(itemToEdit ? itemToEdit.aktif : true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const previewFormattedName = nama.trim()
    ? (nama.trim().startsWith("#") ? nama.trim() : `#${nama.trim()}`)
    : "#LabelTag";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      toast.error("Nama tag transaksi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const api = getApi();

    try {
      if (isEditing && itemToEdit) {
        const res = await api.keuangan.dimensi.tag({ id: itemToEdit.id }).put({
          nama: nama.trim(),
          warna,
          keterangan: keterangan.trim() || undefined,
          aktif,
        });

        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message ?? "Gagal memperbarui tag.");
          return;
        }

        toast.success(`Tag ${previewFormattedName} berhasil diperbarui.`);
      } else {
        const res = await api.keuangan.dimensi.tag.post({
          nama: nama.trim(),
          warna,
          keterangan: keterangan.trim() || undefined,
          aktif,
        });

        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message ?? "Gagal menambahkan tag.");
          return;
        }

        toast.success(`Tag ${previewFormattedName} berhasil dibuat.`);
      }

      onClose();
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan data tag.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header Bersih Enterprise */}
      <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-foreground">
            <IconTag className="size-5 text-foreground/80" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              {isEditing ? `Ubah Tag: ${itemToEdit?.nama}` : "Tambah Tag Transaksi Baru"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulir pengelolaan master tag transaksi dan filter laporan
            </DialogDescription>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          {/* Input Nama Tag */}
          <div className="space-y-1.5">
            <label htmlFor="namaTag" className="text-xs font-medium text-foreground flex items-center gap-1">
              Nama Tag <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-mono text-xs text-muted-foreground select-none">
                #
              </span>
              <Input
                id="namaTag"
                placeholder="Contoh: Event-Expo / Cabang-Bali / Promosi"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="pl-7 text-xs w-full font-medium"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Simbol tagar (#) akan otomatis ditambahkan di awal nama.
            </p>
          </div>

          {/* Pilihan Warna Tag (Color Palette Swatch) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <IconPalette className="size-3.5 text-muted-foreground" />
                Warna Identitas Tag
              </span>
              <span className="font-mono text-[11px] text-muted-foreground uppercase">
                {warna}
              </span>
            </label>

            {/* Grid Preset Warna */}
            <div className="grid grid-cols-5 gap-2 pt-0.5">
              {PRESET_WARNA_TAG.map((preset) => {
                const isSelected = warna.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.label}
                    onClick={() => setWarna(preset.hex)}
                    className="group relative flex h-8 items-center justify-center rounded-md border border-border/60 transition-all hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && (
                      <IconCheck className="size-4 text-white drop-shadow-md" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Input Custom HEX */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                type="color"
                value={warna}
                onChange={(e) => setWarna(e.target.value)}
                className="size-8 p-0.5 cursor-pointer rounded border border-border/80 shrink-0"
              />
              <Input
                type="text"
                placeholder="#000000"
                value={warna}
                onChange={(e) => setWarna(e.target.value)}
                className="font-mono text-xs uppercase h-8"
                maxLength={7}
              />
            </div>
          </div>

          {/* Live Preview Badge */}
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-1.5">
            <span className="text-[11px] text-muted-foreground block font-medium">
              Pratinjau Badge Transaksi:
            </span>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-2xs"
                style={{
                  backgroundColor: `${warna}15`,
                  color: warna,
                  border: `1px solid ${warna}40`,
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: warna }}
                />
                {previewFormattedName}
              </span>
            </div>
          </div>

          {/* Input Keterangan */}
          <div className="space-y-1.5">
            <label htmlFor="keteranganTag" className="text-xs font-medium text-foreground">
              Keterangan / Tujuan Penggunaan (Opsional)
            </label>
            <Textarea
              id="keteranganTag"
              placeholder="Misal: Digunakan untuk memfilter pendapatan & beban operasional proyek..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="text-xs min-h-[70px] resize-none w-full"
            />
          </div>

          {/* Status Aktif Switch */}
          <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-3">
            <div className="space-y-0.5">
              <label htmlFor="tagAktif" className="text-xs font-medium text-foreground block cursor-pointer">
                Tag Aktif
              </label>
              <p className="text-[10px] text-muted-foreground">
                Tag nonaktif tidak dapat disematkan pada transaksi baru.
              </p>
            </div>
            <Switch
              id="tagAktif"
              checked={aktif}
              onCheckedChange={setAktif}
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
          <Button type="submit" size="sm" disabled={isSubmitting} className="min-w-24">
            {isSubmitting ? (
              <>
                <IconLoader2 className="mr-1.5 size-3.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              isEditing ? "Simpan Perubahan" : "Buat Tag Baru"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
