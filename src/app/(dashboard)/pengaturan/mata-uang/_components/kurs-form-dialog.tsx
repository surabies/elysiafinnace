"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconExchange, IconLoader2 } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApi } from "@/lib/api-client";
import {
  kursFormSchema,
  type KursFormValues,
} from "../_lib/schema";
import type { ItemKurs, ItemMataUang } from "../_lib/types";

interface KursFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: ItemMataUang[];
  itemToEdit?: ItemKurs | null;
  onSuccess: () => void;
}

export function KursFormDialog({
  open,
  onOpenChange,
  currencies,
  itemToEdit,
  onSuccess,
}: KursFormDialogProps) {
  const isEditing = Boolean(itemToEdit);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Filter hanya mata uang asing yang aktif
  const foreignCurrencies = React.useMemo(() => {
    return currencies.filter((c) => !c.adalahMataUangDasar && c.aktif);
  }, [currencies]);

  const defaultDate = React.useMemo(() => {
    return new Date().toISOString().split("T")[0]!;
  }, []);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<KursFormValues>({
    resolver: zodResolver(kursFormSchema),
    defaultValues: {
      mataUangId: foreignCurrencies[0]?.id ?? "",
      tanggalBerlaku: defaultDate,
      kurs: "",
      sumber: "Bank Indonesia (JISDOR)",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedCurrencyId = watch("mataUangId");
  const selectedCurrency = React.useMemo(() => {
    return currencies.find((c) => c.id === selectedCurrencyId);
  }, [currencies, selectedCurrencyId]);

  React.useEffect(() => {
    if (itemToEdit) {
      reset({
        mataUangId: itemToEdit.mataUangId,
        tanggalBerlaku: itemToEdit.tanggalBerlaku,
        kurs: String(Number(itemToEdit.kurs)),
        sumber: itemToEdit.sumber ?? "Bank Indonesia (JISDOR)",
      });
    } else if (open) {
      reset({
        mataUangId: foreignCurrencies[0]?.id ?? "",
        tanggalBerlaku: defaultDate,
        kurs: "",
        sumber: "Bank Indonesia (JISDOR)",
      });
    }
  }, [itemToEdit, open, foreignCurrencies, defaultDate, reset]);

  const onSubmit = async (values: KursFormValues) => {
    setIsSubmitting(true);
    const api = getApi();

    try {
      const res = await api.keuangan.kurs.put({
        mataUangId: values.mataUangId,
        tanggalBerlaku: values.tanggalBerlaku,
        kurs: values.kurs,
        sumber: values.sumber || "Manual",
      });

      if (res.error) {
        const msg = (res.error.value as { message?: string })?.message || "Gagal menyimpan nilai kurs.";
        toast.error(msg);
        return;
      }

      toast.success(
        `Kurs ${selectedCurrency?.kode ?? "valas"} per ${values.tanggalBerlaku} berhasil disimpan.`,
      );
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat memperbarui kurs.");
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
              <IconExchange className="size-5 text-foreground/80" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                {isEditing ? "Perbarui Kurs Valuta Asing" : "Entri Kurs Valas Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Nilai konversi 1 unit valuta asing terhadap mata uang dasar (Rupiah).
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Mata Uang Asing <span className="text-destructive">*</span>
              </label>
              <Controller
                name="mataUangId"
                control={control}
                render={({ field }) => (
                  <Select
                    disabled={isEditing}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Pilih Valas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {foreignCurrencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="font-bold mr-1.5 font-mono">{c.kode}</span>
                          <span className="text-muted-foreground">({c.simbol}) - {c.nama}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.mataUangId && (
                <p className="text-[11px] text-destructive">{errors.mataUangId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Tanggal Berlaku <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                disabled={isEditing}
                className="text-xs"
                {...register("tanggalBerlaku")}
              />
              {errors.tanggalBerlaku && (
                <p className="text-[11px] text-destructive">{errors.tanggalBerlaku.message}</p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Transaksi pada tanggal ini atau sesudahnya akan menggunakan kurs ini sampai ada kurs yang lebih baru.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nilai Kurs per 1 {selectedCurrency?.kode ?? "Valas"} (Rp) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                step="any"
                min="0.00000001"
                placeholder="mis. 16250.00"
                className="font-mono text-xs"
                {...register("kurs")}
              />
              {errors.kurs && (
                <p className="text-[11px] text-destructive">{errors.kurs.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Sumber Referensi Kurs
              </label>
              <Input
                placeholder="mis. Bank Indonesia (JISDOR), Kurs Pajak, Bank Mandiri"
                className="text-xs"
                {...register("sumber")}
              />
              {errors.sumber && (
                <p className="text-[11px] text-destructive">{errors.sumber.message}</p>
              )}
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
                "Perbarui Kurs"
              ) : (
                "Simpan Kurs"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
