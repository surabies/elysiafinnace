"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  IconBuilding,
  IconBuildingSkyscraper,
  IconCoin,
  IconLoader2,
  IconMail,
  IconMapPin,
  IconPhone,
  IconReceiptTax,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApi } from "@/lib/api-client";
import {
  perusahaanFormSchema,
  type PerusahaanFormValues,
} from "../_lib/schema";
import type { ItemPerusahaan, MataUangOption } from "../_lib/types";

interface PerusahaanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: MataUangOption[];
  companiesList: ItemPerusahaan[];
  itemToEdit?: ItemPerusahaan | null;
  onSuccess: () => void;
}

export function PerusahaanFormDialog({
  open,
  onOpenChange,
  currencies,
  companiesList,
  itemToEdit,
  onSuccess,
}: PerusahaanFormDialogProps) {
  const isEditing = Boolean(itemToEdit);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<PerusahaanFormValues>({
    resolver: zodResolver(perusahaanFormSchema),
    defaultValues: {
      kode: "",
      nama: "",
      npwp: "",
      alamat: "",
      telepon: "",
      email: "",
      mataUangDasarId: "",
      adalahHolding: false,
      indukId: "",
      logo: "",
      aktif: true,
    },
  });

  const adalahHolding = watch("adalahHolding");
  const logoUrl = watch("logo");

  React.useEffect(() => {
    if (itemToEdit) {
      reset({
        kode: itemToEdit.kode,
        nama: itemToEdit.nama,
        npwp: itemToEdit.npwp ?? "",
        alamat: itemToEdit.alamat ?? "",
        telepon: itemToEdit.telepon ?? "",
        email: itemToEdit.email ?? "",
        mataUangDasarId: itemToEdit.mataUangDasarId ?? "",
        adalahHolding: itemToEdit.adalahHolding ?? false,
        indukId: itemToEdit.indukId ?? "",
        logo: itemToEdit.logo ?? "",
        aktif: itemToEdit.aktif ?? true,
      });
    } else if (open) {
      reset({
        kode: "",
        nama: "",
        npwp: "",
        alamat: "",
        telepon: "",
        email: "",
        mataUangDasarId: currencies[0]?.id ?? "",
        adalahHolding: false,
        indukId: "",
        logo: "",
        aktif: true,
      });
    }
  }, [itemToEdit, open, currencies, reset]);

  const onSubmit = async (values: PerusahaanFormValues) => {
    setIsSubmitting(true);
    const api = getApi();

    try {
      if (isEditing && itemToEdit) {
        const res = await api.keuangan.kontrol.perusahaan({ id: itemToEdit.id }).put({
          nama: values.nama,
          npwp: values.npwp || undefined,
          alamat: values.alamat || undefined,
          telepon: values.telepon || undefined,
          email: values.email || undefined,
          mataUangDasarId: values.mataUangDasarId || undefined,
          adalahHolding: values.adalahHolding,
          indukId: values.adalahHolding ? undefined : values.indukId || undefined,
          logo: values.logo || undefined,
          aktif: values.aktif,
        });

        if (res.error) {
          const msg =
            (res.error.value as { message?: string })?.message ||
            "Gagal memperbarui profil perusahaan.";
          toast.error(msg);
          return;
        }

        toast.success(`Profil perusahaan ${values.nama} berhasil diperbarui.`);
      } else {
        const res = await api.keuangan.kontrol.perusahaan.post({
          kode: values.kode.toUpperCase().trim(),
          nama: values.nama.trim(),
          npwp: values.npwp || undefined,
          alamat: values.alamat || undefined,
          telepon: values.telepon || undefined,
          email: values.email || undefined,
          mataUangDasarId: values.mataUangDasarId || undefined,
          adalahHolding: values.adalahHolding,
          indukId: values.adalahHolding ? undefined : values.indukId || undefined,
          logo: values.logo || undefined,
        });

        if (res.error) {
          const msg =
            (res.error.value as { message?: string })?.message ||
            "Gagal menambahkan entitas perusahaan.";
          toast.error(msg);
          return;
        }

        toast.success(`Perusahaan ${values.nama} berhasil ditambahkan.`);
      }

      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat memproses entitas perusahaan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-primary">
              <IconBuildingSkyscraper className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                {isEditing ? `Ubah Profil: ${itemToEdit?.nama}` : "Tambah Entitas Perusahaan Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Konfigurasi badan usaha legal, NPWP, domisili, dan mata uang pembukuan.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Baris 1: Kode & Nama */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Kode Entitas <span className="text-destructive">*</span>
                </label>
                <Input
                  disabled={isEditing}
                  placeholder="mis. ENN / HOLDING"
                  maxLength={50}
                  className="font-mono uppercase text-xs"
                  {...register("kode")}
                />
                {errors.kode && (
                  <p className="text-[11px] text-destructive">{errors.kode.message}</p>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Nama Legal Perusahaan <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="mis. PT Surabie Solusi Digital"
                  maxLength={200}
                  className="text-xs"
                  {...register("nama")}
                />
                {errors.nama && (
                  <p className="text-[11px] text-destructive">{errors.nama.message}</p>
                )}
              </div>
            </div>

            {/* Baris 2: NPWP & Mata Uang Dasar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <IconReceiptTax className="size-3.5 text-muted-foreground" />
                  NPWP Perusahaan
                </label>
                <Input
                  placeholder="01.234.567.8-012.000"
                  maxLength={32}
                  className="font-mono text-xs"
                  {...register("npwp")}
                />
                {errors.npwp && (
                  <p className="text-[11px] text-destructive">{errors.npwp.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <IconCoin className="size-3.5 text-muted-foreground" />
                  Mata Uang Pembukuan
                </label>
                <Controller
                  control={control}
                  name="mataUangDasarId"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue placeholder="Pilih Mata Uang Dasar" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.kode} ({c.simbol}) — {c.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.mataUangDasarId && (
                  <p className="text-[11px] text-destructive">{errors.mataUangDasarId.message}</p>
                )}
              </div>
            </div>

            {/* Baris 3: Telepon & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <IconPhone className="size-3.5 text-muted-foreground" />
                  Nomor Telepon Kantor
                </label>
                <Input
                  placeholder="021-5550192"
                  maxLength={30}
                  className="text-xs"
                  {...register("telepon")}
                />
                {errors.telepon && (
                  <p className="text-[11px] text-destructive">{errors.telepon.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <IconMail className="size-3.5 text-muted-foreground" />
                  Email Korespondensi / Faktur
                </label>
                <Input
                  placeholder="finance@surabiedev.com"
                  maxLength={100}
                  className="text-xs"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-[11px] text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Baris 4: Alamat Operasional & Faktur */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <IconMapPin className="size-3.5 text-muted-foreground" />
                Alamat Domisili Legal / Kantor Pusat
              </label>
              <Textarea
                placeholder="Jl. Jend. Sudirman Kav. 52-53, Kawasan SCBD, Senayan, Jakarta Selatan 12190"
                rows={2}
                maxLength={1000}
                className="text-xs resize-none"
                {...register("alamat")}
              />
              {errors.alamat && (
                <p className="text-[11px] text-destructive">{errors.alamat.message}</p>
              )}
            </div>

            {/* Baris 5: URL Logo & Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                URL Logo Perusahaan (Untuk Cetak Faktur & Dokumen)
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="https://example.com/logo.png"
                  maxLength={500}
                  className="text-xs font-mono"
                  {...register("logo")}
                />
                {logoUrl && (
                  <div className="size-8 shrink-0 rounded border border-border/80 overflow-hidden flex items-center justify-center bg-muted/40 p-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Logo ini akan ditampilkan pada header cetak faktur komersial, kuitansi, dan bukti kas keluar.
              </p>
            </div>

            {/* Baris 6: Status Holding & Induk */}
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-foreground block">
                    Perusahaan Induk / Holding Group
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Tandai jika entitas ini membawahi beberapa anak perusahaan konsolidasi.
                  </span>
                </div>
                <Controller
                  control={control}
                  name="adalahHolding"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {!adalahHolding && companiesList.filter((c) => c.adalahHolding && c.id !== itemToEdit?.id).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <IconBuilding className="size-3.5 text-muted-foreground" />
                    Bernaung di Bawah Holding
                  </label>
                  <Controller
                    control={control}
                    name="indukId"
                    render={({ field }) => (
                      <Select value={field.value || "NONE"} onValueChange={(v) => field.onChange(v === "NONE" ? "" : v)}>
                        <SelectTrigger className="text-xs h-8.5 bg-background">
                          <SelectValue placeholder="Pilih Perusahaan Induk" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE" className="text-xs">
                            — Entitas Independen (Tanpa Induk) —
                          </SelectItem>
                          {companiesList
                            .filter((c) => c.adalahHolding && c.id !== itemToEdit?.id)
                            .map((h) => (
                              <SelectItem key={h.id} value={h.id} className="text-xs">
                                {h.kode} — {h.nama}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Switch Aktif saat Edit */}
            {isEditing && (
              <div className="flex items-center justify-between rounded-lg border border-border/80 p-3 bg-muted/30">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-foreground block">Status Operasional Entitas</span>
                  <span className="text-[11px] text-muted-foreground block">
                    Entitas nonaktif tidak dapat dipilih saat pembuatan transaksi baru.
                  </span>
                </div>
                <Controller
                  control={control}
                  name="aktif"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/70 bg-muted/20 px-6 py-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="h-8.5 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8.5 text-xs gap-1.5 cursor-pointer shadow-xs"
            >
              {isSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}
              {isEditing ? "Simpan Perubahan" : "Daftarkan Perusahaan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
