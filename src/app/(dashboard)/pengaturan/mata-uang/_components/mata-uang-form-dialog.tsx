"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconCoin, IconLoader2 } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getApi } from "@/lib/api-client";
import {
  mataUangFormSchema,
  type MataUangFormValues,
} from "../_lib/schema";
import type { ItemMataUang } from "../_lib/types";

interface MataUangFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: ItemMataUang | null;
  onSuccess: () => void;
}

export function MataUangFormDialog({
  open,
  onOpenChange,
  itemToEdit,
  onSuccess,
}: MataUangFormDialogProps) {
  const isEditing = Boolean(itemToEdit);
  const isBaseCurrency = Boolean(itemToEdit?.adalahMataUangDasar);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MataUangFormValues>({
    resolver: zodResolver(mataUangFormSchema),
    defaultValues: {
      kode: "",
      nama: "",
      simbol: "",
      jumlahDesimal: 2,
      aktif: true,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const aktifValue = watch("aktif");

  React.useEffect(() => {
    if (itemToEdit) {
      reset({
        kode: itemToEdit.kode,
        nama: itemToEdit.nama,
        simbol: itemToEdit.simbol,
        jumlahDesimal: itemToEdit.jumlahDesimal,
        aktif: itemToEdit.aktif,
      });
    } else if (open) {
      reset({
        kode: "",
        nama: "",
        simbol: "",
        jumlahDesimal: 2,
        aktif: true,
      });
    }
  }, [itemToEdit, open, reset]);

  const onSubmit = async (values: MataUangFormValues) => {
    setIsSubmitting(true);
    const api = getApi();

    try {
      if (isEditing && itemToEdit) {
        const res = await api.keuangan["mata-uang"]({ id: itemToEdit.id }).patch({
          nama: values.nama,
          simbol: values.simbol,
          jumlahDesimal: values.jumlahDesimal,
          aktif: isBaseCurrency ? true : values.aktif,
        });

        if (res.error) {
          const msg = (res.error.value as { message?: string })?.message || "Gagal memperbarui mata uang.";
          toast.error(msg);
          return;
        }

        toast.success(`Mata uang ${values.kode} berhasil diperbarui.`);
      } else {
        const res = await api.keuangan["mata-uang"].post({
          kode: values.kode.toUpperCase(),
          nama: values.nama,
          simbol: values.simbol,
          jumlahDesimal: values.jumlahDesimal,
        });

        if (res.error) {
          const msg = (res.error.value as { message?: string })?.message || "Gagal menambahkan mata uang.";
          toast.error(msg);
          return;
        }

        toast.success(`Mata uang ${values.kode.toUpperCase()} berhasil ditambahkan.`);
      }

      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat memproses mata uang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-foreground">
              <IconCoin className="size-5 text-foreground/80" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                {isEditing ? `Ubah Mata Uang: ${itemToEdit?.kode}` : "Tambah Mata Uang Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Konfigurasi standar ISO 4217 untuk transaksi multi-currency.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Kode ISO <span className="text-destructive">*</span>
                </label>
                <Input
                  disabled={isEditing}
                  placeholder="mis. USD"
                  maxLength={3}
                  className="font-mono uppercase text-xs"
                  {...register("kode")}
                />
                {errors.kode && (
                  <p className="text-[11px] text-destructive">{errors.kode.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Simbol <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="mis. $, €, ¥"
                  maxLength={10}
                  className="font-mono text-xs"
                  {...register("simbol")}
                />
                {errors.simbol && (
                  <p className="text-[11px] text-destructive">{errors.simbol.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Mata Uang <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="mis. Dolar Amerika Serikat"
                className="text-xs"
                {...register("nama")}
              />
              {errors.nama && (
                <p className="text-[11px] text-destructive">{errors.nama.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Jumlah Desimal
              </label>
              <Input
                type="number"
                min={0}
                max={8}
                className="font-mono text-xs"
                {...register("jumlahDesimal", { valueAsNumber: true })}
              />
              <p className="text-[10px] text-muted-foreground">
                Standar: 2 desimal (mis. USD, EUR, IDR) atau 0 desimal (mis. JPY).
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-4">
              <div className="space-y-0.5">
                <label htmlFor="aktif" className="text-xs font-medium text-foreground block cursor-pointer">
                  Status Aktif
                </label>
                <p className="text-[11px] text-muted-foreground">
                  {isBaseCurrency
                    ? "Mata uang dasar perusahaan wajib selalu aktif."
                    : "Mata uang aktif dapat dipilih pada modul transaksi & kontak."}
                </p>
              </div>
              <Switch
                id="aktif"
                disabled={isBaseCurrency}
                checked={aktifValue}
                onCheckedChange={(val) => setValue("aktif", val)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-border/70 px-6 py-4 bg-muted/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <IconLoader2 className="mr-1.5 size-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : isEditing ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Mata Uang"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
