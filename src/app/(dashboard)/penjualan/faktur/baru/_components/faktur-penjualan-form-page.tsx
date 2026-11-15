"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconCheck,
  IconFileInvoice,
  IconLoader2,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApi } from "@/lib/api-client";

export interface PelangganOption {
  id: string;
  kode: string;
  nama: string;
  npwp?: string | null;
  adalahPkp?: boolean;
}

export interface ItemOption {
  id: string;
  sku: string;
  nama: string;
  hargaJual?: string | null;
  satuanId?: string | null;
}

export interface TerminOption {
  id: string;
  kode: string;
  nama: string;
  hariJatuhTempo?: number;
}

export interface GudangOption {
  id: string;
  kode: string;
  nama: string;
}

export interface AkunOption {
  id: string;
  kode: string;
  nama: string;
}

interface BarisItemForm {
  tipe: "ITEM" | "AKUN";
  itemId?: string;
  akunId?: string;
  deskripsi: string;
  kuantitas: number;
  hargaSatuan: number;
  persenDiskon: number;
}

interface FakturPenjualanFormPageProps {
  pelangganOptions: PelangganOption[];
  itemOptions: ItemOption[];
  terminOptions: TerminOption[];
  gudangOptions: GudangOption[];
  akunOptions: AkunOption[];
}

export function FakturPenjualanFormPage({
  pelangganOptions,
  itemOptions,
  terminOptions,
  akunOptions,
}: FakturPenjualanFormPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Header State
  const [pelangganId, setPelangganId] = React.useState<string>(
    () => pelangganOptions[0]?.id ?? "",
  );
  const [tanggal, setTanggal] = React.useState<string>(
    () => new Date().toISOString().split("T")[0] ?? "",
  );
  const [terminId, setTerminId] = React.useState<string>(
    () => terminOptions[0]?.id ?? "",
  );
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0] ?? "";
  });
  const [referensiPo, setReferensiPo] = React.useState<string>("");
  const [catatan, setCatatan] = React.useState<string>("");

  // Summary State
  const [persenPpn, setPersenPpn] = React.useState<number>(11);
  const [diskonGlobal, setDiskonGlobal] = React.useState<number>(0);
  const [ongkir, setOngkir] = React.useState<number>(0);
  const [uangMuka, setUangMuka] = React.useState<number>(0);

  // Line Items State
  const [barisList, setBarisList] = React.useState<BarisItemForm[]>(() => [
    {
      tipe: "ITEM",
      itemId: itemOptions[0]?.id ?? "",
      deskripsi: itemOptions[0]?.nama ?? "",
      kuantitas: 1,
      hargaSatuan: Number(itemOptions[0]?.hargaJual ?? 0),
      persenDiskon: 0,
    },
  ]);

  // Update Jatuh Tempo otomatis saat termin berubah
  const handleTerminChange = (tId: string) => {
    setTerminId(tId);
    const selected = terminOptions.find((t) => t.id === tId);
    if (selected && selected.hariJatuhTempo !== undefined) {
      const d = new Date(tanggal);
      d.setDate(d.getDate() + selected.hariJatuhTempo);
      setTanggalJatuhTempo(d.toISOString().split("T")[0] ?? "");
    }
  };

  const handlePilihItem = (index: number, itemId: string) => {
    const selected = itemOptions.find((i) => i.id === itemId);
    setBarisList((prev) => {
      const copy = [...prev];
      const target = copy[index];
      if (target) {
        target.itemId = itemId;
        if (selected) {
          target.deskripsi = selected.nama;
          target.hargaSatuan = Number(selected.hargaJual || 0);
        }
      }
      return copy;
    });
  };

  const handleUpdateBaris = (
    index: number,
    field: keyof BarisItemForm,
    val: string | number,
  ) => {
    setBarisList((prev) => {
      const copy = [...prev];
      const target = copy[index];
      if (target) {
        if (field === "kuantitas" || field === "hargaSatuan" || field === "persenDiskon") {
          target[field] = Math.max(0, Number(val) || 0);
        } else if (field === "deskripsi") {
          target.deskripsi = String(val);
        } else if (field === "akunId") {
          target.akunId = String(val);
        }
      }
      return copy;
    });
  };

  const handleTambahBarisItem = () => {
    setBarisList((prev) => [
      ...prev,
      {
        tipe: "ITEM",
        itemId: itemOptions[0]?.id ?? "",
        deskripsi: itemOptions[0]?.nama ?? "",
        kuantitas: 1,
        hargaSatuan: Number(itemOptions[0]?.hargaJual ?? 0),
        persenDiskon: 0,
      },
    ]);
  };

  const handleTambahBarisAkun = () => {
    setBarisList((prev) => [
      ...prev,
      {
        tipe: "AKUN",
        akunId: akunOptions[0]?.id ?? "",
        deskripsi: "Biaya / Jasa Lainnya",
        kuantitas: 1,
        hargaSatuan: 0,
        persenDiskon: 0,
      },
    ]);
  };

  const handleHapusBaris = (index: number) => {
    if (barisList.length <= 1) {
      toast.error("Faktur harus memiliki minimal satu baris transaksi.");
      return;
    }
    setBarisList((prev) => prev.filter((_, i) => i !== index));
  };

  // Kalkulasi Finansial Komprehensif
  const { subtotalDpp, nilaiPpn, grandTotal } = React.useMemo(() => {
    let sub = 0;
    for (const b of barisList) {
      const lineBruto = b.hargaSatuan * b.kuantitas;
      const lineDiskon = (lineBruto * (b.persenDiskon || 0)) / 100;
      sub += Math.max(0, lineBruto - lineDiskon);
    }

    const dppSetelahDiskon = Math.max(0, sub - (diskonGlobal || 0));
    const ppn = (dppSetelahDiskon * (persenPpn || 0)) / 100;
    const total = dppSetelahDiskon + ppn + (ongkir || 0) - (uangMuka || 0);

    return {
      subtotalDpp: sub,
      nilaiPpn: Math.max(0, ppn),
      grandTotal: Math.max(0, total),
    };
  }, [barisList, diskonGlobal, persenPpn, ongkir, uangMuka]);

  const handleSubmit = async (langsungPosting: boolean) => {
    if (!pelangganId) {
      toast.error("Silakan pilih pelanggan terlebih dahulu.");
      return;
    }
    if (barisList.length === 0) {
      toast.error("Tambahkan minimal satu baris item transaksi.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        pelangganId,
        tanggal,
        tanggalJatuhTempo: tanggalJatuhTempo || null,
        terminPembayaranId: terminId || undefined,
        catatan: catatan ? `${referensiPo ? `Ref PO: ${referensiPo} | ` : ""}${catatan}` : referensiPo || undefined,
        persenPpn: persenPpn ? persenPpn.toString() : "0",
        diskonNominal: diskonGlobal ? diskonGlobal.toString() : "0",
        ongkir: ongkir ? ongkir.toString() : "0",
        uangMuka: uangMuka ? uangMuka.toString() : "0",
        baris: barisList.map((b) => ({
          itemId: b.tipe === "ITEM" ? b.itemId || undefined : undefined,
          akunId: b.tipe === "AKUN" ? b.akunId || undefined : undefined,
          deskripsi: b.deskripsi || undefined,
          kuantitas: b.kuantitas.toString(),
          hargaSatuan: b.hargaSatuan.toString(),
          persenDiskon: b.persenDiskon ? b.persenDiskon.toString() : undefined,
        })),
      };

      const res = await getApi().keuangan.penjualan.faktur.post(payload);
      if (res.error) {
        toast.error(`Gagal membuat faktur: ${JSON.stringify(res.error.value)}`);
        return;
      }

      const fakturBaru = (res.data as unknown as { data?: { id?: string; nomor?: string } })?.data;
      const fakturId = fakturBaru?.id;

      if (langsungPosting && fakturId) {
        const postRes = await getApi().keuangan.penjualan.faktur({ id: fakturId }).posting.post();
        if (postRes.error) {
          toast.warning("Faktur tersimpan sebagai DRAFT, namun gagal diposting.");
        } else {
          toast.success(`Faktur ${fakturBaru?.nomor ?? ""} berhasil diposting ke Buku Besar!`);
        }
      } else {
        toast.success(`Faktur ${fakturBaru?.nomor ?? ""} berhasil disimpan sebagai Draft.`);
      }

      router.push("/penjualan/faktur");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPelanggan = pelangganOptions.find((p) => p.id === pelangganId);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/penjualan/faktur">
            <Button variant="outline" size="icon-sm" className="size-8" title="Kembali ke Daftar">
              <IconArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Faktur Penjualan</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs font-semibold text-primary">Dokumen Baru</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-0.5">
              <IconFileInvoice className="size-6 text-primary" />
              Penerbitan Faktur Penjualan Baru
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/penjualan/faktur">
            <Button variant="outline" size="sm" disabled={isSubmitting}>
              Batal
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
            className="gap-1.5 font-semibold"
          >
            {isSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}
            Simpan Draft
          </Button>
          <Button
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            className="gap-1.5 font-semibold"
          >
            {isSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}
            <IconCheck className="size-4" />
            Simpan & Posting
          </Button>
        </div>
      </div>

      {/* 2. Metadata Form Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1: Pelanggan & Informasi Bisnis */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b pb-2">
            Identitas Pelanggan & Dokumen
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground block mb-1">
                Pelanggan (Customer) *
              </label>
              <Select value={pelangganId} onValueChange={setPelangganId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Pelanggan" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {pelangganOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="font-semibold">{p.nama}</span>
                      <span className="text-muted-foreground ml-2 font-mono">({p.kode})</span>
                      {p.npwp && <span className="text-[11px] text-muted-foreground ml-1.5">• NPWP: {p.npwp}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPelanggan && (
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-mono">Kode: {selectedPelanggan.kode}</span>
                  {selectedPelanggan.adalahPkp && (
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold text-[10px]">
                      PKP
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Nomor Referensi PO Pelanggan
              </label>
              <Input
                placeholder="Contoh: PO-CUST-2026-0042"
                value={referensiPo}
                onChange={(e) => setReferensiPo(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Mata Uang Transaksi
              </label>
              <Input
                value="IDR - Indonesian Rupiah (Kurs 1.00)"
                disabled
                className="h-9 text-xs bg-muted font-medium"
              />
            </div>
          </div>
        </div>

        {/* Kolom 2: Ketentuan Pembayaran & Jatuh Tempo */}
        <div className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b pb-2">
            Jadwal & Termin Pembayaran
          </h2>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="font-medium text-foreground block mb-1">
                Tanggal Faktur *
              </label>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">
                Termin Pembayaran
              </label>
              <Select value={terminId} onValueChange={handleTerminChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Termin" />
                </SelectTrigger>
                <SelectContent>
                  {terminOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nama} {t.hariJatuhTempo ? `(${t.hariJatuhTempo} Hari)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">
                Tanggal Jatuh Tempo *
              </label>
              <Input
                type="date"
                value={tanggalJatuhTempo}
                onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Line Items Table (Rincian Produk & Jasa Enterprise) */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Rincian Barang & Pendapatan Penjualan
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tentukan katalog persediaan atau akun pendapatan non-persediaan, jumlah unit, dan diskon per baris.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTambahBarisAkun}
              className="h-8 text-xs gap-1"
            >
              <IconPlus className="size-3.5" />
              Baris Jasa / Akun
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleTambahBarisItem}
              className="h-8 text-xs gap-1"
            >
              <IconPlus className="size-3.5" />
              Baris Produk
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b text-muted-foreground font-semibold">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-3 py-3 min-w-[240px]">Item / Akun Pendapatan</th>
                <th className="px-3 py-3 min-w-[200px]">Deskripsi Baris</th>
                <th className="px-3 py-3 w-28 text-right">Kuantitas</th>
                <th className="px-3 py-3 w-36 text-right">Harga Satuan (Rp)</th>
                <th className="px-3 py-3 w-24 text-right">Diskon %</th>
                <th className="px-3 py-3 w-36 text-right">Subtotal (Rp)</th>
                <th className="px-3 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {barisList.map((b, idx) => {
                const lineSubtotal = Math.max(
                  0,
                  b.hargaSatuan * b.kuantitas - (b.hargaSatuan * b.kuantitas * (b.persenDiskon || 0)) / 100,
                );
                return (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 text-center text-muted-foreground font-mono">
                      {idx + 1}
                    </td>

                    <td className="px-3 py-2.5">
                      {b.tipe === "ITEM" ? (
                        <Select
                          value={b.itemId}
                          onValueChange={(val) => handlePilihItem(idx, val)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Pilih Produk" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {itemOptions.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.nama}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    [{item.sku}]
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select
                          value={b.akunId}
                          onValueChange={(val) => handleUpdateBaris(idx, "akunId", val)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Pilih Akun Pendapatan" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {akunOptions.map((akun) => (
                              <SelectItem key={akun.id} value={akun.id}>
                                <span className="font-mono text-muted-foreground mr-1.5">{akun.kode}</span>
                                <span>{akun.nama}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>

                    <td className="px-3 py-2.5">
                      <Input
                        value={b.deskripsi}
                        onChange={(e) => handleUpdateBaris(idx, "deskripsi", e.target.value)}
                        placeholder="Keterangan spesifik baris..."
                        className="h-8 text-xs bg-background"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <Input
                        type="number"
                        min={1}
                        value={b.kuantitas}
                        onChange={(e) => handleUpdateBaris(idx, "kuantitas", e.target.value)}
                        className="h-8 text-xs text-right font-mono bg-background"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <Input
                        type="number"
                        min={0}
                        value={b.hargaSatuan}
                        onChange={(e) => handleUpdateBaris(idx, "hargaSatuan", e.target.value)}
                        className="h-8 text-xs text-right font-mono bg-background"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={b.persenDiskon}
                        onChange={(e) => handleUpdateBaris(idx, "persenDiskon", e.target.value)}
                        className="h-8 text-xs text-right font-mono bg-background"
                      />
                    </td>

                    <td className="px-3 py-2.5 text-right font-mono font-medium text-foreground">
                      Rp {lineSubtotal.toLocaleString("id-ID")}
                    </td>

                    <td className="px-3 py-2.5 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleHapusBaris(idx)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Hapus Baris"
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Rekapitulasi Finansial & Catatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Catatan Dokumen */}
        <div className="rounded-xl border bg-card p-5 shadow-xs space-y-3">
          <label className="text-xs font-semibold text-foreground block">
            Catatan Faktur & Syarat Ketentuan
          </label>
          <Textarea
            placeholder="Keterangan rekening penerima, jadwal pengiriman barang, atau syarat garansi..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="text-xs h-32"
          />
          <p className="text-[11px] text-muted-foreground">
            Catatan ini akan dicetak pada faktur fisik dan dapat dibaca oleh pelanggan.
          </p>
        </div>

        {/* Ringkasan Finansial Enterprise */}
        <div className="rounded-xl border bg-card p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">
            Rekapitulasi Nilai Faktur
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Subtotal DPP (Barang & Jasa):</span>
              <span className="font-mono font-medium text-foreground">
                Rp {subtotalDpp.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Diskon Tambahan (Rp):</span>
              <Input
                type="number"
                min={0}
                value={diskonGlobal}
                onChange={(e) => setDiskonGlobal(Number(e.target.value) || 0)}
                className="w-36 h-7 text-xs text-right font-mono bg-background"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5">
                PPN (%):
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={persenPpn}
                  onChange={(e) => setPersenPpn(Number(e.target.value) || 0)}
                  className="w-12 h-6 border rounded px-1 text-xs text-right font-mono bg-background"
                />
              </span>
              <span className="font-mono text-foreground font-medium">
                Rp {nilaiPpn.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Biaya Ongkos Kirim:</span>
              <Input
                type="number"
                min={0}
                value={ongkir}
                onChange={(e) => setOngkir(Number(e.target.value) || 0)}
                className="w-36 h-7 text-xs text-right font-mono bg-background"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Uang Muka Terbayar:</span>
              <Input
                type="number"
                min={0}
                value={uangMuka}
                onChange={(e) => setUangMuka(Number(e.target.value) || 0)}
                className="w-36 h-7 text-xs text-right font-mono bg-background"
              />
            </div>

            <div className="border-t pt-3 flex justify-between items-center text-base font-bold text-primary">
              <span>Total Piutang Faktur:</span>
              <span className="font-mono">
                Rp {grandTotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
