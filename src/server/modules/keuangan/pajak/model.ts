import { t } from "elysia";
import {
  JENIS_BUPOT,
  JENIS_FAKTUR_PAJAK,
  KATEGORI_PAJAK,
  STATUS_BUPOT,
  STATUS_FAKTUR_PAJAK,
  TIPE_PAJAK,
} from "@/db/schema/keuangan/konstanta";
import { skema } from "../shared/schema";

export const skemaTipePajak = skema.pilihan("Tipe Pajak", TIPE_PAJAK);
export const skemaKategoriPajak = skema.pilihan("Kategori Pajak", KATEGORI_PAJAK);
export const skemaJenisFakturPajak = skema.pilihan("Jenis Faktur Pajak", JENIS_FAKTUR_PAJAK);
export const skemaStatusFakturPajak = skema.pilihan("Status Faktur Pajak", STATUS_FAKTUR_PAJAK);
export const skemaJenisBupot = skema.pilihan("Jenis Bukti Potong", JENIS_BUPOT);
export const skemaStatusBupot = skema.pilihan("Status Bukti Potong", STATUS_BUPOT);

// --- MASTER PAJAK ---
export const skemaSimpanPajak = t.Object({
  kode: skema.kode("Kode Pajak", 30),
  nama: skema.teks("Nama Pajak", 150),
  tipePajak: skemaTipePajak,
  kategoriPajak: skemaKategoriPajak,
  persentaseTarif: skema.persen("Persentase Tarif"),
  dppNilaiLain: t.Optional(t.Boolean()),
  faktorDpp: t.Optional(skema.persen("Faktor DPP")),
  akunPajakPenjualanId: t.Optional(skema.uuidOpsional("Akun Pajak Penjualan")),
  akunPajakPembelianId: t.Optional(skema.uuidOpsional("Akun Pajak Pembelian")),
  keterangan: t.Optional(t.String()),
  aktif: t.Optional(t.Boolean()),
});

export const skemaQueryPajak = t.Object({
  q: t.Optional(t.String()),
  tipe: t.Optional(skemaTipePajak),
  kategori: t.Optional(skemaKategoriPajak),
  aktif: t.Optional(t.BooleanString()),
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// --- ALOKASI NSFP ---
export const skemaSimpanAlokasiNsfp = t.Object({
  nomorAwal: skema.teks("Nomor Awal NSFP", 20),
  nomorAkhir: skema.teks("Nomor Akhir NSFP", 20),
  tanggalSurat: skema.tanggal("Tanggal Surat"),
  tahun: t.Numeric({ minimum: 2000, maximum: 2100 }),
  keterangan: t.Optional(t.String()),
});

export const skemaQueryNsfp = t.Object({
  tahun: t.Optional(t.Numeric()),
  aktif: t.Optional(t.BooleanString()),
});

// --- FAKTUR PAJAK ---
export const skemaSimpanFakturPajak = t.Object({
  nomorFakturPajak: skema.teks("Nomor Faktur Pajak", 30),
  jenis: skemaJenisFakturPajak,
  tanggal: skema.tanggal("Tanggal Faktur"),
  masaPajak: t.Numeric({ minimum: 1, maximum: 12 }),
  tahunPajak: t.Numeric({ minimum: 2000, maximum: 2100 }),
  kontakId: t.Optional(skema.uuidOpsional("Kontak")),
  namaLawanTransaksi: skema.teks("Nama Lawan Transaksi", 200),
  npwpLawanTransaksi: t.Optional(t.String({ maxLength: 30 })),
  nikLawanTransaksi: t.Optional(t.String({ maxLength: 20 })),
  alamatLawanTransaksi: t.Optional(t.String()),
  jumlahDpp: skema.uang("Jumlah DPP"),
  jumlahPpn: skema.uang("Jumlah PPN"),
  jumlahPpnbm: t.Optional(skema.uang("Jumlah PPnBM")),
  statusFaktur: t.Optional(skemaStatusFakturPajak),
  referensiDokumen: t.Optional(t.String({ maxLength: 100 })),
  fakturPenjualanId: t.Optional(skema.uuidOpsional("Faktur Penjualan")),
  fakturPembelianId: t.Optional(skema.uuidOpsional("Faktur Pembelian")),
  dapatDikreditkan: t.Optional(t.Boolean()),
  keterangan: t.Optional(t.String()),
});

export const skemaGenerateFakturPenjualan = t.Object({
  fakturPenjualanId: skema.uuid("Faktur Penjualan"),
  nomorFakturPajak: t.Optional(t.String({ maxLength: 30 })),
  tanggal: t.Optional(skema.tanggal("Tanggal Faktur")),
});

export const skemaUpdateStatusFaktur = t.Object({
  status: skemaStatusFakturPajak,
  keterangan: t.Optional(t.String()),
});

export const skemaQueryFakturPajak = t.Object({
  jenis: t.Optional(skemaJenisFakturPajak),
  masaPajak: t.Optional(t.Numeric({ minimum: 1, maximum: 12 })),
  tahunPajak: t.Optional(t.Numeric({ minimum: 2000, maximum: 2100 })),
  status: t.Optional(skemaStatusFakturPajak),
  q: t.Optional(t.String()),
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// --- BUKTI POTONG PPH (e-Bupot) ---
export const skemaSimpanBuktiPotong = t.Object({
  nomorBuktiPotong: skema.teks("Nomor Bukti Potong", 50),
  jenisBupot: skemaJenisBupot,
  tanggal: skema.tanggal("Tanggal"),
  masaPajak: t.Numeric({ minimum: 1, maximum: 12 }),
  tahunPajak: t.Numeric({ minimum: 2000, maximum: 2100 }),
  kontakId: t.Optional(skema.uuidOpsional("Kontak")),
  namaWajibPajak: skema.teks("Nama Wajib Pajak", 200),
  npwpWajibPajak: t.Optional(t.String({ maxLength: 30 })),
  nikWajibPajak: t.Optional(t.String({ maxLength: 20 })),
  kodeObjekPajak: skema.teks("Kode Objek Pajak", 30),
  jumlahBruto: skema.uang("Jumlah Bruto"),
  tarif: skema.persen("Tarif"),
  jumlahPph: skema.uang("Jumlah PPh"),
  dokumenReferensi: t.Optional(t.String({ maxLength: 100 })),
  fakturPembelianId: t.Optional(skema.uuidOpsional("Faktur Pembelian")),
  biayaId: t.Optional(skema.uuidOpsional("Biaya")),
  status: t.Optional(skemaStatusBupot),
  keterangan: t.Optional(t.String()),
});

export const skemaUpdateStatusBupot = t.Object({
  status: skemaStatusBupot,
  keterangan: t.Optional(t.String()),
});

export const skemaQueryBuktiPotong = t.Object({
  jenisBupot: t.Optional(skemaJenisBupot),
  masaPajak: t.Optional(t.Numeric({ minimum: 1, maximum: 12 })),
  tahunPajak: t.Optional(t.Numeric({ minimum: 2000, maximum: 2100 })),
  status: t.Optional(skemaStatusBupot),
  q: t.Optional(t.String()),
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

// --- EKSPOR & LAPORAN ---
export const skemaQueryEksporEfaktur = t.Object({
  masaPajak: t.Numeric({ minimum: 1, maximum: 12 }),
  tahunPajak: t.Numeric({ minimum: 2000, maximum: 2100 }),
  jenis: t.Optional(t.Union([t.Literal("KELUARAN"), t.Literal("MASUKAN")])),
});

export const skemaQueryEksporCoretax = t.Object({
  masaPajak: t.Numeric({ minimum: 1, maximum: 12 }),
  tahunPajak: t.Numeric({ minimum: 2000, maximum: 2100 }),
});

export const skemaQueryLaporanSptPpn = t.Object({
  masaPajak: t.Numeric({ minimum: 1, maximum: 12 }),
  tahunPajak: t.Numeric({ minimum: 2000, maximum: 2100 }),
});
