"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconLoader2, IconFolderPlus } from "@tabler/icons-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApi } from "@/lib/api-client";
import { MataUangSelect } from "@/components/form/mata-uang-select";
import type { PeranSistem } from "@/db/schema/keuangan";
import { akunFormSchema, type AkunFormValues } from "../_lib/schema";
import type { AkunItem, TipeAkun } from "../_lib/types";

interface CoaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountToEdit?: AkunItem | null;
  defaultParentId?: string | null;
  headerAccounts: AkunItem[];
  onSuccess: () => void;
}

export function CoaFormDialog({
  open,
  onOpenChange,
  accountToEdit,
  defaultParentId,
  headerAccounts,
  onSuccess,
}: CoaFormDialogProps) {
  const isEditing = Boolean(accountToEdit);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AkunFormValues>({
    resolver: zodResolver(akunFormSchema),
    defaultValues: {
      kode: "",
      nama: "",
      tipeAkun: "ASET",
      indukId: null,
      bisaDiposting: true,
      adalahAkunKontra: false,
      normalBalance: "DEBIT",
      peranSistem: null,
      mataUangId: null,
      keterangan: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedTipe = watch("tipeAkun");
  const isKontra = watch("adalahAkunKontra");

  // Filter header accounts sesuai tipe akun yang dipilih
  const availableParents = React.useMemo(() => {
    return headerAccounts.filter(
      (acc) => acc.tipeAkun === selectedTipe && acc.id !== accountToEdit?.id,
    );
  }, [headerAccounts, selectedTipe, accountToEdit]);

  // Otomatisasi Saldo Normal berdasarkan tipe akun & status kontra
  React.useEffect(() => {
    if (selectedTipe === "ASET" || selectedTipe === "BEBAN") {
      setValue("normalBalance", isKontra ? "KREDIT" : "DEBIT");
    } else {
      setValue("normalBalance", isKontra ? "DEBIT" : "KREDIT");
    }
  }, [selectedTipe, isKontra, setValue]);

  // Reset form saat modal dibuka atau accountToEdit berubah
  React.useEffect(() => {
    if (open) {
      if (accountToEdit) {
        reset({
          kode: accountToEdit.kode,
          nama: accountToEdit.nama,
          tipeAkun: accountToEdit.tipeAkun,
          indukId: accountToEdit.indukId ?? null,
          bisaDiposting: accountToEdit.bisaDiposting,
          adalahAkunKontra: accountToEdit.adalahAkunKontra,
          normalBalance: accountToEdit.normalBalance,
          peranSistem: accountToEdit.peranSistem ?? null,
          mataUangId: accountToEdit.mataUangId ?? null,
          keterangan: accountToEdit.keterangan ?? "",
        });
      } else {
        reset({
          kode: "",
          nama: "",
          tipeAkun: "ASET",
          indukId: defaultParentId ?? null,
          bisaDiposting: true,
          adalahAkunKontra: false,
          normalBalance: "DEBIT",
          peranSistem: null,
          mataUangId: null,
          keterangan: "",
        });
      }
    }
  }, [open, accountToEdit, defaultParentId, reset]);

  const onSubmit = async (values: AkunFormValues) => {
    setIsSubmitting(true);
    const api = getApi();

    try {
      if (isEditing && accountToEdit) {
        const res = await api.keuangan.akun({ id: accountToEdit.id }).patch({
          kode: values.kode,
          nama: values.nama,
          keterangan: values.keterangan ?? undefined,
          indukId: values.indukId ?? undefined,
          mataUangId: values.mataUangId ?? undefined,
        });

        if (res.error) {
          const errData = res.error.value as { error?: { message?: string } };
          throw new Error(errData?.error?.message ?? "Gagal memperbarui akun");
        }
        toast.success(`Akun ${values.kode} berhasil diperbarui`);
      } else {
        const res = await api.keuangan.akun.post({
          kode: values.kode,
          nama: values.nama,
          tipeAkun: values.tipeAkun,
          indukId: values.indukId ?? undefined,
          bisaDiposting: values.bisaDiposting,
          adalahAkunKontra: values.adalahAkunKontra,
          normalBalance: values.normalBalance,
          peranSistem: (values.peranSistem as PeranSistem) || undefined,
          mataUangId: values.mataUangId ?? undefined,
          keterangan: values.keterangan ?? undefined,
        });

        if (res.error) {
          const errData = res.error.value as { error?: { message?: string } };
          throw new Error(errData?.error?.message ?? "Gagal menambahkan akun");
        }
        toast.success(`Akun ${values.kode} berhasil dibuat`);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan sistem";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogTitle = isEditing
    ? `Ubah Akun: ${accountToEdit?.kode} — ${accountToEdit?.nama}`
    : defaultParentId
      ? "Tambah Sub-Akun Baru"
      : "Tambah Akun Baru";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        {/* Header Enterprise Modern & Bersih */}
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-foreground">
              <IconFolderPlus className="size-5 text-foreground/80" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground truncate max-w-[500px]">
                {dialogTitle}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Formulir spesifikasi Bagan Akun pembukuan
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-4 max-h-[500px] overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="kode" className="text-xs font-medium text-foreground flex items-center gap-1">
                  Kode Akun <span className="text-destructive">*</span>
                </label>
                <Input
                  id="kode"
                  placeholder="misal 1-10001"
                  className="font-mono text-xs uppercase"
                  {...register("kode")}
                />
                {errors.kode && (
                  <p className="text-[11px] text-destructive">
                    {errors.kode.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tipeAkun" className="text-xs font-medium text-foreground flex items-center gap-1">
                  Tipe Akun <span className="text-destructive">*</span>
                </label>
                <Controller
                  control={control}
                  name="tipeAkun"
                  render={({ field }) => (
                    <Select
                      disabled={isEditing}
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val as TipeAkun);
                        setValue("indukId", null);
                      }}
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Pilih Tipe..." />
                      </SelectTrigger>
                      <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="ASET">Aset</SelectItem>
                        <SelectItem value="KEWAJIBAN">Kewajiban</SelectItem>
                        <SelectItem value="EKUITAS">Ekuitas</SelectItem>
                        <SelectItem value="PENDAPATAN">Pendapatan</SelectItem>
                        <SelectItem value="BEBAN">Beban</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="nama" className="text-xs font-medium text-foreground flex items-center gap-1">
                  Nama Akun <span className="text-destructive">*</span>
                </label>
                <Input
                  id="nama"
                  placeholder="misal Kas Operasional Rupiah"
                  className="text-xs"
                  {...register("nama")}
                />
                {errors.nama && (
                  <p className="text-[11px] text-destructive">
                    {errors.nama.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="indukId" className="text-xs font-medium text-foreground">
                  Akun Induk (Header Grup)
                </label>
                <Controller
                  control={control}
                  name="indukId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? "NONE"}
                      onValueChange={(val) =>
                        field.onChange(val === "NONE" ? null : val)
                      }
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Tanpa Induk (Tingkat Teratas)" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="NONE">
                          Tanpa Induk (Tingkat Teratas)
                        </SelectItem>
                        {availableParents.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            <span className="font-mono text-muted-foreground mr-1.5">
                              {parent.kode}
                            </span>
                            {parent.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Mata Uang Akun */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Mata Uang Akun
              </label>
              <Controller
                control={control}
                name="mataUangId"
                render={({ field }) => (
                  <MataUangSelect
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="Mata uang dasar perusahaan (IDR)"
                  />
                )}
              />
              <p className="text-[11px] text-muted-foreground">
                Kosongkan untuk akun umum. Rekening kas/bank atau piutang/hutang valas dapat dikunci ke mata uang tertentu (mis. USD).
              </p>
            </div>

            {/* Toggle Konfigurasi Akun */}
            <div className="rounded-lg border border-border/80 bg-card p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">Bisa Diposting Jurnal</p>
                  <p className="text-[11px] text-muted-foreground">
                    Jika dinonaktifkan, akun ini berfungsi sebagai Header/Grup klasifikasi.
                  </p>
                </div>
                <Controller
                  control={control}
                  name="bisaDiposting"
                  render={({ field }) => (
                    <Switch
                      disabled={isEditing}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div>
                  <p className="text-xs font-medium text-foreground">Akun Kontra</p>
                  <p className="text-[11px] text-muted-foreground">
                    Membalik saldo normal (misal Akumulasi Penyusutan pada Aset).
                  </p>
                </div>
                <Controller
                  control={control}
                  name="adalahAkunKontra"
                  render={({ field }) => (
                    <Switch
                      disabled={isEditing}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="keterangan" className="text-xs font-medium text-foreground">
                Keterangan / Catatan Tambahan
              </label>
              <Textarea
                id="keterangan"
                placeholder="Catatan peruntukan atau rincian kebijakan akun..."
                className="text-xs min-h-[60px] resize-none"
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
                  "Buat Akun"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
