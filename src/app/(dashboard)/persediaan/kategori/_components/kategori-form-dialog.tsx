"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconCategory, IconLoader2, IconSparkles, IconTag } from "@tabler/icons-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApi } from "@/lib/api-client";
import { ambilPratinjauNomor } from "@/lib/penomoran";
import { TagMultiSelect } from "@/components/form/tag-multi-select";
import type { KategoriItem } from "../_lib/types";

interface KategoriFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: KategoriItem | null;
  daftarKategori: KategoriItem[];
  onSuccess: () => void;
}

export function KategoriFormDialog({
  open,
  onOpenChange,
  itemToEdit,
  daftarKategori,
  onSuccess,
}: KategoriFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        <KategoriFormContent
          key={itemToEdit ? itemToEdit.id : "new"}
          itemToEdit={itemToEdit}
          daftarKategori={daftarKategori}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

function KategoriFormContent({
  itemToEdit,
  daftarKategori,
  onClose,
  onSuccess,
}: {
  itemToEdit?: KategoriItem | null;
  daftarKategori: KategoriItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = Boolean(itemToEdit);
  const [nama, setNama] = React.useState(itemToEdit?.nama ?? "");
  const [kode, setKode] = React.useState(itemToEdit?.kode ?? "");
  const [indukId, setIndukId] = React.useState<string | null>(itemToEdit?.indukId ?? null);
  const [tagIds, setTagIds] = React.useState<string[]>(itemToEdit?.tags?.map((t) => t.id) ?? []);
  const [keterangan, setKeterangan] = React.useState(itemToEdit?.keterangan ?? "");
  const [aktif, setAktif] = React.useState(itemToEdit?.aktif ?? true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!itemToEdit) {
      ambilPratinjauNomor("CAT").then((nomor) => {
        if (nomor) {
          setKode(nomor);
        }
      });
    }
  }, [itemToEdit]);

  // Kandidat induk kategori: tidak boleh memilih diri sendiri
  const opsiInduk = daftarKategori.filter((k) => !itemToEdit || k.id !== itemToEdit.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const api = getApi();

    try {
      if (isEditing && itemToEdit) {
        const res = await api.keuangan["kategori-produk"]({ id: itemToEdit.id }).patch({
          nama: nama.trim(),
          kode: kode.trim() || undefined,
          indukId: indukId || null,
          keterangan: keterangan.trim() || undefined,
          tagIds,
          aktif,
        });

        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message ?? "Gagal memperbarui kategori.");
          return;
        }

        toast.success(`Kategori "${nama}" berhasil diperbarui.`);
      } else {
        const res = await api.keuangan["kategori-produk"].post({
          nama: nama.trim(),
          kode: kode.trim() || undefined,
          indukId: indukId || undefined,
          keterangan: keterangan.trim() || undefined,
          tagIds,
        });

        if (res.error) {
          toast.error((res.error.value as { message?: string })?.message ?? "Gagal menambahkan kategori.");
          return;
        }

        toast.success(`Kategori "${nama}" berhasil dibuat.`);
      }

      onClose();
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan kategori.");
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
            <IconCategory className="size-5 text-foreground/80" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              {isEditing ? `Ubah Kategori: ${itemToEdit?.nama}` : "Tambah Kategori Produk"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulir master klasifikasi produk dan jasa
            </DialogDescription>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="kategoriNama" className="text-xs font-medium text-foreground flex items-center gap-1">
              Nama Kategori <span className="text-destructive">*</span>
            </label>
            <Input
              id="kategoriNama"
              placeholder="Contoh: Suku Cadang Elektronik / Makanan Ringan"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="text-xs w-full font-medium"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="kategoriKode" className="text-xs font-medium text-foreground">
                Kode Kategori (Opsional)
              </label>
              {!isEditing && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  <IconSparkles className="size-3" /> Auto
                </span>
              )}
            </div>
            <Input
              id="kategoriKode"
              placeholder="Contoh: CAT/2026/00001"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              className="font-mono text-xs uppercase w-full"
            />
            {!isEditing && (
              <p className="text-[10px] text-muted-foreground">
                Terisi otomatis oleh sistem. Anda dapat membiarkannya atau menggantinya secara manual.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Induk Kategori (Hierarki Bertingkat)
            </label>
            <Select
              value={indukId ?? "NONE"}
              onValueChange={(val) => setIndukId(val === "NONE" ? null : val)}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Pilih Induk Kategori (Opsional)..." />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] max-h-56 overflow-y-auto">
                <SelectItem value="NONE">Sebagai Kategori Utama (Tanpa Induk)</SelectItem>
                {opsiInduk.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.nama} ({k.kode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <IconTag className="size-3.5 text-muted-foreground" />
              Tag Label Kategori
            </label>
            <TagMultiSelect
              value={tagIds}
              onChange={setTagIds}
              placeholder="Pilih atau cari tag label kategori..."
            />
            <p className="text-[10px] text-muted-foreground">
              Label warna untuk pengelompokan divisi, departemen, atau lini bisnis kategori.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="kategoriDeskripsi" className="text-xs font-medium text-foreground">
              Keterangan / Catatan (Opsional)
            </label>
            <Textarea
              id="kategoriDeskripsi"
              placeholder="Deskripsi pengelompokan jenis barang atau layanan..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="text-xs min-h-[65px] resize-none w-full"
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-3">
              <div className="space-y-0.5">
                <label htmlFor="kategoriAktif" className="text-xs font-medium text-foreground block cursor-pointer">
                  Status Kategori Aktif
                </label>
                <p className="text-[10px] text-muted-foreground">
                  Kategori nonaktif tidak muncul pada pilihan input produk baru.
                </p>
              </div>
              <Switch
                id="kategoriAktif"
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
              "Tambah Kategori"
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
