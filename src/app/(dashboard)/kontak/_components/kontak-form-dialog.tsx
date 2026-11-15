"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  IconLoader2,
  IconBuildingSkyscraper,
  IconUser,
  IconReceiptTax,
  IconCreditCard,
  IconInfoCircle,
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
import { kontakFormSchema, type KontakFormValues } from "../_lib/schema";
import type { KontakItem, TerminOption } from "../_lib/types";

interface KontakFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kontakToEdit?: KontakItem | null;
  defaultJenis?: "PELANGGAN" | "PEMASOK";
  terminOptions: TerminOption[];
  onSuccess: () => void;
}

export function KontakFormDialog({
  open,
  onOpenChange,
  kontakToEdit,
  defaultJenis = "PELANGGAN",
  terminOptions,
  onSuccess,
}: KontakFormDialogProps) {
  const isEditing = Boolean(kontakToEdit);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>("dasar");

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<KontakFormValues>({
    resolver: zodResolver(kontakFormSchema),
    defaultValues: {
      kode: "",
      nama: "",
      adalahPelanggan: defaultJenis === "PELANGGAN",
      adalahPemasok: defaultJenis === "PEMASOK",
      npwp: "",
      nik: "",
      adalahPkp: false,
      grup: "",
      namaKontak: "",
      email: "",
      telepon: "",
      alamat: "",
      kota: "",
      provinsi: "",
      kodePos: "",
      negara: "Indonesia",
      terminPembayaranId: null,
      mataUangId: null,
      batasKredit: "0",
      catatan: "",
      tagIds: [],
      aktif: true,
    },
  });

  React.useEffect(() => {
    if (kontakToEdit) {
      reset({
        kode: kontakToEdit.kode,
        nama: kontakToEdit.nama,
        adalahPelanggan: kontakToEdit.adalahPelanggan,
        adalahPemasok: kontakToEdit.adalahPemasok,
        npwp: kontakToEdit.npwp ?? "",
        nik: kontakToEdit.nik ?? "",
        adalahPkp: kontakToEdit.adalahPkp,
        grup: kontakToEdit.grup ?? "",
        namaKontak: kontakToEdit.namaKontak ?? "",
        email: kontakToEdit.email ?? "",
        telepon: kontakToEdit.telepon ?? "",
        alamat: kontakToEdit.alamat ?? "",
        kota: kontakToEdit.kota ?? "",
        provinsi: kontakToEdit.provinsi ?? "",
        kodePos: kontakToEdit.kodePos ?? "",
        negara: kontakToEdit.negara || "Indonesia",
        terminPembayaranId: kontakToEdit.terminPembayaranId,
        mataUangId: kontakToEdit.mataUangId ?? null,
        batasKredit: kontakToEdit.batasKredit || "0",
        catatan: kontakToEdit.catatan ?? "",
        tagIds: kontakToEdit.tags?.map((t) => t.id) ?? [],
        aktif: kontakToEdit.aktif,
      });
    } else if (open) {
      reset({
        kode: "",
        nama: "",
        adalahPelanggan: defaultJenis === "PELANGGAN",
        adalahPemasok: defaultJenis === "PEMASOK",
        npwp: "",
        nik: "",
        adalahPkp: false,
        grup: "",
        namaKontak: "",
        email: "",
        telepon: "",
        alamat: "",
        kota: "",
        provinsi: "",
        kodePos: "",
        negara: "Indonesia",
        terminPembayaranId: null,
        mataUangId: null,
        batasKredit: "0",
        catatan: "",
        tagIds: [],
        aktif: true,
      });

      // Ambil preview nomor seri otomatis berikutnya (CUST atau SUPP)
      const prefiks = defaultJenis === "PELANGGAN" ? "CUST" : "SUPP";
      ambilPratinjauNomor(prefiks).then((nomor) => {
        if (nomor) {
          setValue("kode", nomor);
        }
      });
    }
  }, [kontakToEdit, defaultJenis, reset, setValue, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setActiveTab("dasar");
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: KontakFormValues) => {
    setIsSubmitting(true);
    const api = getApi();

    try {
      if (isEditing && kontakToEdit) {
        const res = await api.keuangan.kontak({ id: kontakToEdit.id }).patch({
          kode: values.kode,
          nama: values.nama,
          adalahPelanggan: values.adalahPelanggan,
          adalahPemasok: values.adalahPemasok,
          npwp: values.npwp || null,
          nik: values.nik || null,
          adalahPkp: values.adalahPkp,
          grup: values.grup || null,
          namaKontak: values.namaKontak || null,
          email: values.email || null,
          telepon: values.telepon || null,
          alamat: values.alamat || null,
          kota: values.kota || null,
          provinsi: values.provinsi || null,
          kodePos: values.kodePos || null,
          negara: values.negara,
          terminPembayaranId: values.terminPembayaranId || null,
          mataUangId: values.mataUangId || null,
          batasKredit: values.batasKredit || "0",
          catatan: values.catatan || null,
          tagIds: values.tagIds,
          aktif: values.aktif,
        });

        if (res.error) {
          const msg = (res.error.value as { message?: string })?.message || "Gagal memperbarui data kontak.";
          toast.error(msg);
          return;
        }

        toast.success(`Data kontak ${values.nama} berhasil diperbarui.`);
      } else {
        const res = await api.keuangan.kontak.post({
          kode: values.kode,
          nama: values.nama,
          adalahPelanggan: values.adalahPelanggan,
          adalahPemasok: values.adalahPemasok,
          npwp: values.npwp || null,
          nik: values.nik || null,
          adalahPkp: values.adalahPkp,
          grup: values.grup || null,
          namaKontak: values.namaKontak || null,
          email: values.email || null,
          telepon: values.telepon || null,
          alamat: values.alamat || null,
          kota: values.kota || null,
          provinsi: values.provinsi || null,
          kodePos: values.kodePos || null,
          negara: values.negara,
          terminPembayaranId: values.terminPembayaranId || null,
          mataUangId: values.mataUangId || null,
          batasKredit: values.batasKredit || "0",
          catatan: values.catatan || null,
          tagIds: values.tagIds,
        });

        if (res.error) {
          const msg = (res.error.value as { message?: string })?.message || "Gagal membuat kontak baru.";
          toast.error(msg);
          return;
        }

        toast.success(`Kontak ${values.nama} berhasil ditambahkan.`);
      }

      handleOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan kontak.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl w-full p-0 gap-0 overflow-hidden border border-border/80 shadow-2xl">
        {/* Header Enterprise Modern & Bersih */}
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4.5 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs text-foreground">
              <IconBuildingSkyscraper className="size-5 text-foreground/80" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                {isEditing ? `Ubah Kontak: ${kontakToEdit?.nama}` : "Tambah Kontak Baru"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Formulir entitas kontak bisnis
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
                  value="dasar"
                  className="text-xs font-medium gap-1.5 data-[state=active]:shadow-xs transition-all"
                >
                  <IconUser className="size-3.5" />
                  Profil Dasar
                </TabsTrigger>
                <TabsTrigger
                  value="pajak"
                  className="text-xs font-medium gap-1.5 data-[state=active]:shadow-xs transition-all"
                >
                  <IconReceiptTax className="size-3.5" />
                  Pajak & Identitas
                </TabsTrigger>
                <TabsTrigger
                  value="ketentuan"
                  className="text-xs font-medium gap-1.5 data-[state=active]:shadow-xs transition-all"
                >
                  <IconCreditCard className="size-3.5" />
                  Ketentuan & Alamat
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Viewport Konten dengan Ketinggian Tetap (Zero Layout Shift) */}
            <div className="h-[430px] overflow-y-auto px-6 py-5">
              {/* TAB 1: PROFIL DASAR */}
              <TabsContent
                value="dasar"
                className="mt-0 space-y-4 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-150"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground flex items-center gap-1">
                        Kode Kontak <span className="text-destructive">*</span>
                      </label>
                      {!isEditing && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          <IconSparkles className="size-3" /> Auto
                        </span>
                      )}
                    </div>
                    <Input
                      placeholder={defaultJenis === "PELANGGAN" ? "Contoh: CUST/2026/00001" : "Contoh: SUPP/2026/00001"}
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
                      Nama Kontak / Perusahaan <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Contoh: PT Sumber Makmur Jaya"
                      className="text-xs"
                      {...register("nama")}
                    />
                    {errors.nama && (
                      <p className="text-[11px] text-destructive">{errors.nama.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Grup Kontak
                    </label>
                    <Input
                      placeholder="Contoh: Korporat, Distributor, Ritel"
                      className="text-xs"
                      {...register("grup")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Kontak Person (PIC)
                    </label>
                    <Input
                      placeholder="Contoh: Bpk. Hendra Wijaya"
                      className="text-xs"
                      {...register("namaKontak")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="nama@perusahaan.com"
                      className="text-xs"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Telepon / WhatsApp</label>
                    <Input
                      placeholder="0812-xxxx-xxxx"
                      className="text-xs"
                      {...register("telepon")}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <IconTag className="size-3.5 text-muted-foreground" />
                    Tag Label Kontak
                  </label>
                  <Controller
                    name="tagIds"
                    control={control}
                    render={({ field }) => (
                      <TagMultiSelect
                        value={field.value ?? []}
                        onChange={field.onChange}
                        placeholder="Pilih atau cari tag label kontak..."
                      />
                    )}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Sematkan label warna untuk segmentasi, pelaporan, dan filter kontak (cth: Prioritas, VIP, Retail).
                  </p>
                </div>

                {/* Peran Entitas: Pelanggan / Pemasok */}
                <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2.5">
                  <span className="text-xs font-medium text-foreground block">
                    Peran Bisnis Entitas <span className="text-destructive">*</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-2.5">
                      <Controller
                        name="adalahPelanggan"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            id="adalahPelanggan"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <label htmlFor="adalahPelanggan" className="text-xs font-medium cursor-pointer">
                        Pelanggan (Customer)
                      </label>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Controller
                        name="adalahPemasok"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            id="adalahPemasok"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <label htmlFor="adalahPemasok" className="text-xs font-medium cursor-pointer">
                        Pemasok (Vendor)
                      </label>
                    </div>
                  </div>
                  {errors.adalahPelanggan && (
                    <p className="text-[11px] text-destructive">
                      {errors.adalahPelanggan.message}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* TAB 2: PAJAK & IDENTITAS */}
              <TabsContent
                value="pajak"
                className="mt-0 space-y-4 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-150"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      NPWP (16 Digit / Format Baru)
                    </label>
                    <Input
                      placeholder="Contoh: 01.234.567.8-901.000"
                      className="font-mono text-xs"
                      {...register("npwp")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      NIK (Nomor Induk Kependudukan)
                    </label>
                    <Input
                      placeholder="16 Digit NIK KTP"
                      className="font-mono text-xs"
                      {...register("nik")}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-4">
                  <div className="space-y-0.5">
                    <label htmlFor="adalahPkp" className="text-xs font-medium text-foreground block cursor-pointer">
                      Pengusaha Kena Pajak (PKP)
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Aktifkan bila entitas menerbitkan atau dipungut Faktur Pajak PPN resmi.
                    </p>
                  </div>
                  <Controller
                    name="adalahPkp"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="adalahPkp"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/80 bg-card p-4">
                  <div className="space-y-0.5">
                    <label htmlFor="aktif" className="text-xs font-medium text-foreground block cursor-pointer">
                      Status Kontak Aktif
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Kontak nonaktif tidak akan ditampilkan pada pilihan formulir transaksi baru.
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

                <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 flex items-start gap-2.5">
                  <IconInfoCircle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Sesuai regulasi PMK 136/2023 & pembaruan Coretax DJP, Wajib Pajak Badan menggunakan NPWP 16 digit dan Wajib Pajak Orang Pribadi dapat memadankan NIK 16 digit sebagai identitas pajak.
                  </p>
                </div>
              </TabsContent>

              {/* TAB 3: KETENTUAN & ALAMAT */}
              <TabsContent
                value="ketentuan"
                className="mt-0 space-y-4 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-150"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Termin Pembayaran Default
                    </label>
                    <Controller
                      name="terminPembayaranId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? "NONE"}
                          onValueChange={(val) => field.onChange(val === "NONE" ? null : val)}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Pilih Termin..." />
                          </SelectTrigger>
                          <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                            <SelectItem value="NONE">Tanpa Termin (Jatuh Tempo Langsung)</SelectItem>
                            {terminOptions.map((term) => (
                              <SelectItem key={term.id} value={term.id}>
                                {term.nama} ({term.jumlahHari} hari)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Mata Uang Transaksi Default
                    </label>
                    <Controller
                      name="mataUangId"
                      control={control}
                      render={({ field }) => (
                        <MataUangSelect
                          value={field.value}
                          onChange={(val) => field.onChange(val)}
                          placeholder="Mata uang dasar (IDR)"
                        />
                      )}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Faktur/pesanan untuk kontak ini akan otomatis menggunakan valas ini.
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-foreground">
                      Batas Plafon Kredit (Rp)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="font-mono text-xs"
                      {...register("batasKredit")}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Isi 0 jika tidak membatasi batas nominal piutang/hutang.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Alamat Lengkap</label>
                  <Textarea
                    placeholder="Nama jalan, gedung, nomor kantor, RT/RW..."
                    className="text-xs min-h-[65px] resize-none"
                    {...register("alamat")}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Kota</label>
                    <Input placeholder="Jakarta Barat" className="text-xs" {...register("kota")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Provinsi</label>
                    <Input placeholder="DKI Jakarta" className="text-xs" {...register("provinsi")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Kode Pos</label>
                    <Input placeholder="11530" className="text-xs font-mono" {...register("kodePos")} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Catatan Tambahan</label>
                  <Textarea
                    placeholder="Informasi rekening bank kontak, instruksi khusus pengiriman, atau catatan internal."
                    className="text-xs min-h-[55px] resize-none"
                    {...register("catatan")}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer Enterprise dengan Pemisah Tegas */}
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
                  "Tambah Kontak"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
