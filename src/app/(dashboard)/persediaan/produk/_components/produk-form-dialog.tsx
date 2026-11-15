"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  IconLoader2,
  IconPackage,
  IconCoins,
  IconBook2,
  IconPlus,
  IconSparkles,
  IconTag,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApi } from "@/lib/api-client";
import { ambilPratinjauNomor } from "@/lib/penomoran";
import { TagMultiSelect } from "@/components/form/tag-multi-select";
import { MataUangSelect } from "@/components/form/mata-uang-select";
import { produkFormSchema, type ProdukFormValues } from "../_lib/schema";
import type { ItemProduk, KategoriOption, SatuanOption, AkunOption } from "../_lib/types";
import { KategoriQuickCreateDialog } from "./kategori-quick-create-dialog";
import { SatuanQuickCreateDialog } from "./satuan-quick-create-dialog";

interface ProdukFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: ItemProduk | null;
  kategoriOptions: KategoriOption[];
  satuanOptions: SatuanOption[];
  akunOptions: AkunOption[];
  onSuccess: () => void;
}

export function ProdukFormDialog({
  open,
  onOpenChange,
  itemToEdit,
  kategoriOptions,
  satuanOptions,
  akunOptions,
  onSuccess,
}: ProdukFormDialogProps) {
  const isEditing = Boolean(itemToEdit);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("umum");
  const [kategoriList, setKategoriList] = React.useState<KategoriOption[]>(kategoriOptions);
  const [satuanList, setSatuanList] = React.useState<SatuanOption[]>(satuanOptions);
  const [quickKatOpen, setQuickKatOpen] = React.useState(false);
  const [quickSatuanOpen, setQuickSatuanOpen] = React.useState(false);

  React.useEffect(() => {
    setKategoriList(kategoriOptions);
  }, [kategoriOptions]);

  React.useEffect(() => {
    setSatuanList(satuanOptions);
  }, [satuanOptions]);

  const defaultSatuanId = satuanOptions[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProdukFormValues>({
    resolver: zodResolver(produkFormSchema),
    defaultValues: {
      sku: "",
      barcode: "",
      nama: "",
      deskripsi: "",
      tipeBarang: "BARANG_PERSEDIAAN",
      kategoriId: null,
      satuanId: defaultSatuanId,
      mataUangId: null,
      hargaBeliStandar: "0",
      hargaJualStandar: "0",
      stokMinimum: "0",
      akunPersediaanId: null,
      akunHppId: null,
      akunPendapatanId: null,
      tagIds: [],
      aktif: true,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedTipeBarang = watch("tipeBarang");

  React.useEffect(() => {
    if (itemToEdit) {
      reset({
        sku: itemToEdit.sku,
        barcode: itemToEdit.barcode ?? "",
        nama: itemToEdit.nama,
        deskripsi: itemToEdit.deskripsi ?? "",
        tipeBarang: itemToEdit.tipeBarang,
        kategoriId: itemToEdit.kategoriId ?? null,
        satuanId: itemToEdit.satuanId,
        mataUangId: itemToEdit.mataUangId ?? null,
        hargaBeliStandar: String(Number(itemToEdit.hargaBeliStandar || 0)),
        hargaJualStandar: String(Number(itemToEdit.hargaJualStandar || 0)),
        stokMinimum: String(Number(itemToEdit.stokMinimum || 0)),
        akunPersediaanId: itemToEdit.akunPersediaanId ?? null,
        akunHppId: itemToEdit.akunHppId ?? null,
        akunPendapatanId: itemToEdit.akunPendapatanId ?? null,
        tagIds: itemToEdit.tags?.map((t) => t.id) ?? [],
        aktif: itemToEdit.aktif,
      });
    } else if (open) {
      reset({
        sku: "",
        barcode: "",
        nama: "",
        deskripsi: "",
        tipeBarang: "BARANG_PERSEDIAAN",
        kategoriId: null,
        satuanId: defaultSatuanId,
        mataUangId: null,
        hargaBeliStandar: "0",
        hargaJualStandar: "0",
        stokMinimum: "0",
        akunPersediaanId: null,
        akunHppId: null,
        akunPendapatanId: null,
        tagIds: [],
        aktif: true,
      });

      // Ambil preview nomor seri SKU produk otomatis berikutnya (PRD)
      ambilPratinjauNomor("PRD").then((nomor) => {
        if (nomor) {
          setValue("sku", nomor);
        }
      });
    }
  }, [itemToEdit, defaultSatuanId, reset, setValue, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setActiveTab("umum");
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: ProdukFormValues) => {
    setIsSubmitting(true);
    const api = getApi();

    try {
      if (isEditing && itemToEdit) {
        const res = await api.keuangan.item({ id: itemToEdit.id }).patch({
          sku: values.sku,
          barcode: values.barcode || undefined,
          nama: values.nama,
          deskripsi: values.deskripsi || undefined,
          kategoriId: values.kategoriId || undefined,
          satuanId: values.satuanId,
          mataUangId: values.mataUangId || undefined,
          hargaBeliStandar: values.hargaBeliStandar,
          hargaJualStandar: values.hargaJualStandar,
          stokMinimum: values.stokMinimum,
          akunPersediaanId: values.akunPersediaanId || undefined,
          akunHppId: values.akunHppId || undefined,
          akunPendapatanId: values.akunPendapatanId || undefined,
          tagIds: values.tagIds,
          aktif: values.aktif,
        });

        if (res.error) {
          const msg = (res.error.value as { message?: string })?.message || "Gagal memperbarui data produk.";
          toast.error(msg);
          return;
        }

        toast.success(`Produk ${values.nama} berhasil diperbarui.`);
      } else {
        const res = await api.keuangan.item.post({
          sku: values.sku,
          barcode: values.barcode || undefined,
          nama: values.nama,
          deskripsi: values.deskripsi || undefined,
          tipeBarang: values.tipeBarang,
          kategoriId: values.kategoriId || undefined,
          satuanId: values.satuanId,
          mataUangId: values.mataUangId || undefined,
          hargaBeliStandar: values.hargaBeliStandar,
          hargaJualStandar: values.hargaJualStandar,
          stokMinimum: values.stokMinimum,
          akunPersediaanId: values.akunPersediaanId || undefined,
          akunHppId: values.akunHppId || undefined,
          akunPendapatanId: values.akunPendapatanId || undefined,
          tagIds: values.tagIds,
        });

        if (res.error) {
          const msg = (res.error.value as { message?: string })?.message || "Gagal membuat produk baru.";
          toast.error(msg);
          return;
        }

        toast.success(`Produk ${values.nama} berhasil ditambahkan.`);
      }

      handleOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const akunPersediaanList = akunOptions.filter((a) => a.tipeAkun === "ASET");
  const akunHppList = akunOptions.filter((a) => a.tipeAkun === "BEBAN");
  const akunPendapatanList = akunOptions.filter((a) => a.tipeAkun === "PENDAPATAN");

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        {/* Header Enterprise Modern & Bersih */}
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-foreground">
              <IconPackage className="size-5 text-foreground/80" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                {isEditing ? `Ubah Produk: ${itemToEdit?.nama}` : "Tambah Produk Baru"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Formulir data master produk dan jasa
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Navigasi Tab Segmented Modern */}
            <div className="border-b border-border/60 bg-muted/10 px-6 py-2.5">
              <TabsList className="grid w-full grid-cols-3 h-9 bg-muted/60 p-0.5 rounded-lg border border-border/40">
                <TabsTrigger
                  value="umum"
                  className="text-xs font-medium gap-1.5 data-[state=active]:shadow-xs transition-all"
                >
                  <IconPackage className="size-3.5" />
                  Informasi Umum
                </TabsTrigger>
                <TabsTrigger
                  value="harga"
                  className="text-xs font-medium gap-1.5 data-[state=active]:shadow-xs transition-all"
                >
                  <IconCoins className="size-3.5" />
                  Harga & Stok
                </TabsTrigger>
                <TabsTrigger
                  value="akuntansi"
                  className="text-xs font-medium gap-1.5 data-[state=active]:shadow-xs transition-all"
                >
                  <IconBook2 className="size-3.5" />
                  Akun Finansial
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Viewport Konten dengan Ketinggian Tetap (Zero Layout Shift) */}
            <div className="h-[430px] overflow-y-auto px-6 py-5">
              {/* TAB 1: INFORMASI UMUM */}
              <TabsContent
                value="umum"
                className="mt-0 space-y-4 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-150"
              >
                {/* Baris 1: Kode SKU & Nama Produk (Grid 2 Kolom Seimbang) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1">
                        SKU / Kode Item <span className="text-destructive">*</span>
                      </label>
                      {!isEditing && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          <IconSparkles className="size-3" /> Auto
                        </span>
                      )}
                    </div>
                    <Input
                      placeholder="Contoh: PRD/2026/00001"
                      className="font-mono text-xs uppercase w-full"
                      {...register("sku")}
                    />
                    {!isEditing && (
                      <p className="text-[10px] text-muted-foreground">
                        Terisi otomatis oleh sistem. Anda dapat membiarkannya atau menggantinya secara manual.
                      </p>
                    )}
                    {errors.sku && (
                      <p className="text-[11px] text-destructive">{errors.sku.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      Nama Produk / Layanan <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Contoh: Kertas HVS A4 80gr Sinar Dunia"
                      className="text-xs w-full"
                      {...register("nama")}
                    />
                    {errors.nama && (
                      <p className="text-[11px] text-destructive">{errors.nama.message}</p>
                    )}
                  </div>
                </div>

                {/* Baris 2: Tipe Produk & Satuan Dasar (Keduanya Wajib, Grid 2 Kolom Seimbang) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      Tipe Produk <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      name="tipeBarang"
                      control={control}
                      render={({ field }) => (
                        <Select
                          disabled={isEditing}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Pilih Tipe Produk..." />
                          </SelectTrigger>
                          <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                            <SelectItem value="BARANG_PERSEDIAAN">Barang Persediaan</SelectItem>
                            <SelectItem value="BARANG_NON_PERSEDIAAN">Non-Persediaan (Beban)</SelectItem>
                            <SelectItem value="JASA">Jasa & Layanan</SelectItem>
                            <SelectItem value="BUNDEL">Bundel / Rakitan</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground flex items-center gap-1">
                      Satuan Dasar <span className="text-destructive">*</span>
                    </label>
                    <Controller
                      name="satuanId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || undefined}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Pilih Satuan Dasar..." />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] max-h-60 overflow-y-auto">
                            {satuanList.length === 0 ? (
                              <div className="py-3 px-3 text-center text-xs text-muted-foreground">
                                Belum ada satuan terdaftar di sistem.
                              </div>
                            ) : (
                              satuanList.map((sat) => (
                                <SelectItem key={sat.id} value={sat.id}>
                                  {sat.kode} ({sat.nama})
                                </SelectItem>
                              ))
                            )}
                            <div className="p-1 border-t border-border/60 mt-1">
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setQuickSatuanOpen(true);
                                }}
                                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer select-none"
                              >
                                <IconPlus className="size-3.5 shrink-0" />
                                <span>Tambah Satuan Baru...</span>
                              </button>
                            </div>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.satuanId && (
                      <p className="text-[11px] text-destructive">{errors.satuanId.message}</p>
                    )}
                  </div>
                </div>

                {/* Baris 3: Kategori Produk & Barcode EAN (Grid 2 Kolom Seimbang) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Kategori Produk
                    </label>
                    <Controller
                      name="kategoriId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? "NONE"}
                          onValueChange={(val) => field.onChange(val === "NONE" ? null : val)}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Pilih Kategori..." />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] max-h-60 overflow-y-auto">
                            <SelectItem value="NONE">Tanpa Kategori</SelectItem>
                            {kategoriList.map((kat) => (
                              <SelectItem key={kat.id} value={kat.id}>
                                {kat.nama}
                              </SelectItem>
                            ))}
                            <div className="p-1 border-t border-border/60 mt-1">
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setQuickKatOpen(true);
                                }}
                                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer select-none"
                              >
                                <IconPlus className="size-3.5 shrink-0" />
                                <span>Tambah Kategori Baru...</span>
                              </button>
                            </div>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Barcode / EAN-13 (Opsional)
                    </label>
                    <Input
                      placeholder="Nomor barcode pemindai"
                      className="font-mono text-xs w-full"
                      {...register("barcode")}
                    />
                  </div>
                </div>

                {/* Tag Label Produk */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <IconTag className="size-3.5 text-muted-foreground" />
                    Tag Label Produk
                  </label>
                  <Controller
                    name="tagIds"
                    control={control}
                    render={({ field }) => (
                      <TagMultiSelect
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Pilih atau cari tag label produk..."
                      />
                    )}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Sematkan label warna untuk segmentasi katalog, pelaporan laba/rugi lini produk, dan filter persediaan.
                  </p>
                </div>

                {/* Baris 4: Status Produk Aktif */}
                <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-4">
                  <div className="space-y-0.5">
                    <label htmlFor="aktif" className="text-xs font-medium text-foreground block cursor-pointer">
                      Status Produk Aktif
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Produk nonaktif tidak dapat dipilih saat pembuatan transaksi baru.
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
              </TabsContent>

              {/* TAB 2: HARGA & MANAJEMEN STOK */}
              <TabsContent
                value="harga"
                className="mt-0 space-y-4 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-150"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Mata Uang Harga
                  </label>
                  <Controller
                    name="mataUangId"
                    control={control}
                    render={({ field }) => (
                      <MataUangSelect
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        placeholder="Mata uang dasar perusahaan (IDR)"
                      />
                    )}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Standar mata uang harga beli dan harga jual produk. Kosongkan untuk Rupiah (IDR).
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Harga Beli Standar
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      className="font-mono text-xs w-full"
                      {...register("hargaBeliStandar")}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Estimasi harga pokok saat pengadaan/pembelian.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Harga Jual Standar
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      className="font-mono text-xs w-full"
                      {...register("hargaJualStandar")}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Harga jual default sebelum diskon faktur.
                    </p>
                  </div>
                </div>

                {selectedTipeBarang === "BARANG_PERSEDIAAN" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Batas Stok Minimum (Buffer Stock)
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      className="font-mono text-xs w-full"
                      {...register("stokMinimum")}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Sistem akan memberi peringatan bila kuantitas fisik di gudang berada di bawah angka ini.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Deskripsi / Spesifikasi Produk
                  </label>
                  <Textarea
                    placeholder="Rincian teknis, dimensi produk, material, atau instruksi garansi..."
                    className="text-xs min-h-[90px] resize-none w-full"
                    {...register("deskripsi")}
                  />
                </div>
              </TabsContent>

              {/* TAB 3: PEMETAAN AKUN FINANSIAL */}
              <TabsContent
                value="akuntansi"
                className="mt-0 space-y-4 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-150"
              >
                <div className="rounded-lg border border-border/80 bg-card p-4 space-y-4">
                  <span className="text-xs font-semibold text-foreground block">
                    Penetapan Akun Buku Besar Otomatis
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Sistem akan menggunakan akun-akun ini secara otomatis saat faktur penjualan atau pembelian diterbitkan. Bila dikosongkan, sistem akan memakai akun default perusahaan.
                  </p>

                  {selectedTipeBarang === "BARANG_PERSEDIAAN" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Akun Persediaan (Aset Lancar)
                      </label>
                      <Controller
                        name="akunPersediaanId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value ?? "DEFAULT"}
                            onValueChange={(val) => field.onChange(val === "DEFAULT" ? null : val)}
                          >
                            <SelectTrigger className="w-full text-xs">
                              <SelectValue placeholder="Gunakan Akun Persediaan Default" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                              <SelectItem value="DEFAULT">Default Perusahaan (Persediaan)</SelectItem>
                              {akunPersediaanList.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  <span className="font-mono text-muted-foreground mr-1.5">{a.kode}</span>
                                  {a.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Akun Pendapatan Penjualan (Kredit)
                    </label>
                    <Controller
                      name="akunPendapatanId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? "DEFAULT"}
                          onValueChange={(val) => field.onChange(val === "DEFAULT" ? null : val)}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Gunakan Akun Pendapatan Default" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                            <SelectItem value="DEFAULT">Default Perusahaan (Pendapatan Penjualan)</SelectItem>
                            {akunPendapatanList.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                <span className="font-mono text-muted-foreground mr-1.5">{a.kode}</span>
                                {a.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Akun Beban Pokok Penjualan / HPP (Debit)
                    </label>
                    <Controller
                      name="akunHppId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? "DEFAULT"}
                          onValueChange={(val) => field.onChange(val === "DEFAULT" ? null : val)}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Gunakan Akun HPP Default" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                            <SelectItem value="DEFAULT">Default Perusahaan (Beban Pokok Penjualan)</SelectItem>
                            {akunHppList.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                <span className="font-mono text-muted-foreground mr-1.5">{a.kode}</span>
                                {a.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

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
                onClick={() => handleOpenChange(false)}
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
                  "Tambah Produk"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Quick Create Modal Kategori Produk */}
    <KategoriQuickCreateDialog
      open={quickKatOpen}
      onOpenChange={setQuickKatOpen}
      onSuccess={(newCat) => {
        setKategoriList((prev) => {
          const exists = prev.some((k) => k.id === newCat.id);
          return exists ? prev : [...prev, newCat];
        });
        setValue("kategoriId", newCat.id);
      }}
    />

    {/* Quick Create Modal Satuan Dasar */}
    <SatuanQuickCreateDialog
      open={quickSatuanOpen}
      onOpenChange={setQuickSatuanOpen}
      onSuccess={(newUnit) => {
        setSatuanList((prev) => {
          const exists = prev.some((s) => s.id === newUnit.id);
          return exists ? prev : [...prev, newUnit];
        });
        setValue("satuanId", newUnit.id);
      }}
    />
  </>
  );
}
