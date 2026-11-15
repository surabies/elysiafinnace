"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  IconLoader2,
  IconBuildingWarehouse,
  IconSparkles,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getApi } from "@/lib/api-client";
import { ambilPratinjauNomor } from "@/lib/penomoran";
import { gudangFormSchema, type GudangFormValues } from "../_lib/schema";
import type { GudangItem } from "../_lib/types";

interface GudangFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gudangToEdit?: GudangItem | null;
  onSuccess: () => void;
}

export function GudangFormDialog({
  open,
  onOpenChange,
  gudangToEdit,
  onSuccess,
}: GudangFormDialogProps) {
  const isEditing = Boolean(gudangToEdit);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<GudangFormValues>({
    resolver: zodResolver(gudangFormSchema),
    defaultValues: {
      kode: "",
      nama: "",
      alamat: "",
      penanggungJawab: "",
      adalahGudangUtama: false,
      keterangan: "",
      aktif: true,
    },
  });

  React.useEffect(() => {
    if (gudangToEdit) {
      reset({
        kode: gudangToEdit.kode,
        nama: gudangToEdit.nama,
        alamat: gudangToEdit.alamat ?? "",
        penanggungJawab: gudangToEdit.penanggungJawab ?? "",
        adalahGudangUtama: gudangToEdit.adalahGudangUtama,
        keterangan: gudangToEdit.keterangan ?? "",
        aktif: gudangToEdit.aktif,
      });
    } else if (open) {
      reset({
        kode: "",
        nama: "",
        alamat: "",
        penanggungJawab: "",
        adalahGudangUtama: false,
        keterangan: "",
        aktif: true,
      });

      // Ambil preview nomor seri gudang otomatis berikutnya (GDG)
      ambilPratinjauNomor("GDG").then((nomor) => {
        if (nomor) {
          setValue("kode", nomor);
        }
      });
    }
  }, [gudangToEdit, reset, setValue, open]);

  const onSubmit = async (values: GudangFormValues) => {
    setIsSubmitting(true);
    const api = getApi();

    try {
      if (isEditing && gudangToEdit) {
        const res = await api.keuangan.gudang({ id: gudangToEdit.id }).patch({
          kode: values.kode,
          nama: values.nama,
          alamat: values.alamat || undefined,
          penanggungJawab: values.penanggungJawab || undefined,
          adalahGudangUtama: values.adalahGudangUtama,
          keterangan: values.keterangan || undefined,
          aktif: values.aktif,
        });

        if (res.error) {
          const msg = (res.error.value as { message?: string })?.message || "Gagal memperbarui data gudang.";
          toast.error(msg);
          return;
        }

        toast.success(`Gudang ${values.nama} berhasil diperbarui.`);
      } else {
        const res = await api.keuangan.gudang.post({
          kode: values.kode,
          nama: values.nama,
          alamat: values.alamat || undefined,
          penanggungJawab: values.penanggungJawab || undefined,
          adalahGudangUtama: values.adalahGudangUtama,
          keterangan: values.keterangan || undefined,
        });

        if (res.error) {
          const msg = (res.error.value as { message?: string })?.message || "Gagal menambahkan gudang baru.";
          toast.error(msg);
          return;
        }

        toast.success(`Gudang ${values.nama} berhasil ditambahkan.`);
      }

      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan gudang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        {/* Header Enterprise Modern & Bersih */}
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-foreground">
              <IconBuildingWarehouse className="size-5 text-foreground/80" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                {isEditing ? `Ubah Gudang: ${gudangToEdit?.nama}` : "Tambah Gudang Baru"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Formulir data gudang dan lokasi penyimpanan persediaan
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-4 max-h-[500px] overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    Kode Gudang <span className="text-destructive">*</span>
                  </label>
                  {!isEditing && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      <IconSparkles className="size-3" /> Auto
                    </span>
                  )}
                </div>
                <Input
                  placeholder="Contoh: GDG/2026/00001"
                  className="font-mono text-xs uppercase"
                  {...register("kode")}
                />
                {!isEditing && (
                  <p className="text-[10px] text-muted-foreground">
                    Terisi otomatis oleh sistem. Anda dapat membiarkannya atau menggantinya secara manual.
                  </p>
                )}
                {errors.kode && (
                  <p className="text-[11px] text-destructive">{errors.kode.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  Nama Gudang / Lokasi <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Contoh: Gudang Utama Cakung"
                  className="text-xs"
                  {...register("nama")}
                />
                {errors.nama && (
                  <p className="text-[11px] text-destructive">{errors.nama.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Penanggung Jawab Gudang (PIC)
              </label>
              <Input
                placeholder="Contoh: Bpk. Bambang Sutrisno"
                className="text-xs"
                {...register("penanggungJawab")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Alamat Fisik Gudang</label>
              <Textarea
                placeholder="Jl. Raya Cakung No. 88, Kawasan Industri, Jakarta Timur"
                className="text-xs min-h-[65px] resize-none"
                {...register("alamat")}
              />
            </div>

            {/* Konfigurasi Gudang: Utama & Status */}
            <div className="rounded-lg border border-border/80 bg-card p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="adalahGudangUtama" className="text-xs font-medium text-foreground block cursor-pointer">
                    Gudang Utama (Default Warehouse)
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Gudang utama akan terpilih otomatis saat transaksi penerimaan dan pengiriman barang.
                  </p>
                </div>
                <Controller
                  name="adalahGudangUtama"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="adalahGudangUtama"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="space-y-0.5">
                  <label htmlFor="aktif" className="text-xs font-medium text-foreground block cursor-pointer">
                    Status Gudang Aktif
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Gudang nonaktif tidak dapat digunakan untuk mutasi atau penyimpanan stok baru.
                  </p>
                </div>
                <Controller
                  name="aktif"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="aktif"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Catatan / Keterangan</label>
              <Textarea
                placeholder="Kapasitas penyimpanan, fasilitas pendingin, jam operasional bongkar muat..."
                className="text-xs min-h-[55px] resize-none"
                {...register("keterangan")}
              />
            </div>
          </div>

          {/* Footer Enterprise dengan Garis Pemisah */}
          <div className="flex items-center justify-between border-t border-border/70 px-6 py-3.5 bg-muted/20">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="text-destructive">*</span> Kolom wajib diisi
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="min-w-[125px]">
                {isSubmitting ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : isEditing ? (
                  "Simpan Perubahan"
                ) : (
                  "Tambah Gudang"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
